import {
	type Attachment,
	AttachmentType,
	type Message,
	MessageContentType,
	MessageSubType,
	MessageType,
	RatingTarget,
} from '@smartsupp/smartsupp-message'

import { getNotificationSound } from '@/modules/app'
import { visitorClientProvider } from '@/modules/websocketClient'
import { lastItemOfArray } from '@/utils/arrays'
import { printWarning } from '@/utils/console'
import { isSameMinute } from '@/utils/date'
import { throttle } from '@/utils/throttle'
import { getHostWindow } from '@/utils/window'

import { isAgentTyping } from '../chat'
import { isAiChatRatingEnabled, isChatRatingEnabled } from '../chatRating'
import { getAttachments } from '../linkPreview/'
import { widgetOptions } from '../options'
import { MESSAGE_SOUND_THROTTLING, MESSAGE_SOUND_VOLUME } from './constants'
import {
	type AttachmentExtraSpaces,
	type MessageAlign,
	type MessageAttachmentContext,
	type MessageContentVariant,
	type MessageContext,
	type MessageGroup,
	MessageGroupType,
	type MessageNeighbors,
	type QuickReply,
	type TriggerList,
} from './types'

interface SendWebSocketMessageParams {
	text: string
	quickReply?: {
		replyTo: string
		payload: QuickReply['payload']
	}
}

export const sendWebSocketMessage = async ({
	text,
	quickReply,
}: SendWebSocketMessageParams): Promise<Message | null> => {
	try {
		const client = visitorClientProvider.getClient()
		const message = await client.chatMessage({ content: { type: MessageContentType.Text, text }, quickReply })
		return message ?? null
	} catch (e) {
		return null
	}
}

// NOTE: Includes also legacy trigger message
export const isBotMessage = (m: Message): boolean => {
	return m.subType === MessageSubType.Bot || m.subType === MessageSubType.Trigger
}

const isSystemMessage = (m: Message): boolean => {
	return m.subType === MessageSubType.System
}

export const isMessageReadable = (m: Message): boolean => {
	return m.subType === MessageSubType.Agent || isBotMessage(m)
}

export const compareMessagesByDate = (a: Message, b: Message): number => {
	return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
}

const resolveGroupId = (message: Message, groupType: MessageGroupType | null): string => {
	return groupType === MessageGroupType.BotReplies ? `${message.id}-replies` : message.id
}

const resolveGroupAlignAndVariant = (
	groupType: MessageGroupType | null,
): { align: MessageAlign; variant: MessageContentVariant } => {
	const align: MessageAlign = { isRight: false, isLeft: false }
	const variant: MessageContentVariant = { isPrimary: false, isSecondary: false }
	switch (groupType) {
		case MessageGroupType.ContactMessage:
			align.isRight = true
			variant.isPrimary = true
			break

		default:
			align.isLeft = true
			variant.isSecondary = true
	}
	return { align, variant }
}

const resolveGroupShowAvatar = (message: Message): boolean => {
	return (
		!!message.agentId ||
		(message.subType === MessageSubType.Bot && message.content.type !== MessageContentType.TicketForm)
	)
}

const resolveGroupFullWidth = (message: Message, grouptType: MessageGroupType | null): boolean => {
	return (
		message.subType === MessageSubType.System ||
		grouptType === MessageGroupType.BotReplies ||
		message.content.type === MessageContentType.TicketForm
	)
}

export const groupMessages = (messages: Message[]) => {
	const groups: MessageGroup[] = []
	let currentGroup: MessageGroup | null = null
	let previousContext: MessageContext | null = null

	for (const message of messages) {
		// ignore rating messages when rating is disabled
		if (
			message.content.type === MessageContentType.RateForm &&
			((message.content.data.target === RatingTarget.Ai && !isAiChatRatingEnabled()) ||
				(message.content.data.target === RatingTarget.Agent && !isChatRatingEnabled()))
		) {
			continue
		}
		// push previous group if this message does not belong to it
		if (currentGroup && !messageBelongsToGroup(message, currentGroup)) {
			groups.push(currentGroup)
			currentGroup = null
			previousContext = null
		}
		// create group if there is not any
		currentGroup = currentGroup || createMessageGroup(message)
		// create default message context
		const messageContext = createMessageContext(message, currentGroup)
		// there have to be some checks for previous message (borders, extra spaces)
		if (previousContext) {
			const canNeighborWithPrevious = canNeighborWithMessage(previousContext)
			const lastItemContext = getLastItemOfMessageContext(previousContext)
			// set correct neighbors for previous message
			messageContext.neighbors.hasTop = canNeighborWithPrevious
			lastItemContext.any.neighbors.hasBottom = canNeighborWithPrevious
			// Previous message attachment automatically presume that is the last in the group => it is not so it must be corrected again
			if (lastItemContext.attachmentContext) {
				lastItemContext.attachmentContext.extraSpaces.hasBottom = shouldHaveExtraSpaces(
					lastItemContext.attachmentContext.attachment,
				)
			}
		}
		// process attachments contexts
		const attachments = getMessageAttachments(message)
		attachments && addAttachmentsToMessageContext(attachments, messageContext, previousContext)

		currentGroup.messagesContext.push(messageContext)
		previousContext = messageContext

		// handle bot messages
		if ((isBotMessage(message) || isSystemMessage(message)) && hasQuickReplies(message as Message.Message.Bot)) {
			// bot with replies have to be split into 2 messages (message, replies)
			groups.push(currentGroup)

			const repliesGroup = createBotRepliesGroup(message)
			repliesGroup.messagesContext.push(createMessageContext(message, repliesGroup))
			groups.push(repliesGroup)
			currentGroup = null
		}
	}

	if (currentGroup) groups.push(currentGroup)

	return groups
}

const createMessageGroup = (message: Message): MessageGroup => {
	const messageGroupType = getMessageGroupType(message)
	const isBot = message.subType === MessageSubType.Bot || message.subType === MessageSubType.Trigger
	const { align, variant } = resolveGroupAlignAndVariant(messageGroupType)
	return {
		type: messageGroupType,
		isBot,
		id: resolveGroupId(message, messageGroupType),
		date: message.createdAt,
		agentId: message.agentId,
		align,
		variant,
		messagesContext: [],
		showAvatar: resolveGroupShowAvatar(message),
		useFullWidth: resolveGroupFullWidth(message, messageGroupType),
	}
}

const createBotRepliesGroup = (message: Message): MessageGroup => {
	const groupType = MessageGroupType.BotReplies
	const { align, variant } = resolveGroupAlignAndVariant(groupType)
	return {
		type: MessageGroupType.BotReplies,
		isBot: true,
		id: resolveGroupId(message, groupType),
		date: message.createdAt,
		agentId: message.agentId,
		align,
		variant,
		messagesContext: [],
		showAvatar: false,
		useFullWidth: resolveGroupFullWidth(message, groupType),
	}
}

const createMessageContext = (message: Message, group: MessageGroup): MessageContext => {
	return {
		group,
		message,
		neighbors: { hasTop: false, hasBottom: false },
		attachmentsContext: [],
	}
}

const addAttachmentsToMessageContext = (
	attachments: Attachment[],
	messageContext: MessageContext,
	prevMessageContext: MessageContext | null,
): void => {
	let previousContext: MessageAttachmentContext | null = null
	for (const attachment of attachments) {
		const canNeighborWithCurrent = canNeighborWithAttachment(attachment)
		const neighbors: MessageNeighbors = { hasTop: false, hasBottom: false }

		const hasExtraSpaces = shouldHaveExtraSpaces(attachment)
		const extraSpaces: AttachmentExtraSpaces = { hasTop: hasExtraSpaces, hasBottom: false }

		if (!previousContext) {
			// First attachment
			messageContext.neighbors.hasBottom = canNeighborWithCurrent
			neighbors.hasTop = canNeighborWithCurrent

			if (isMessageEmpty(messageContext.message)) {
				// First attachment and parent IS empty message
				neighbors.hasTop = false
				messageContext.neighbors.hasTop = false
				messageContext.neighbors.hasBottom = false
				if (prevMessageContext) {
					// First attachment, parent IS empty message and there is another message in group above the parent
					const canNeighborWithPreviousMessage = canNeighborWithMessage(prevMessageContext)
					const previousMessageLastItemContext = getLastItemOfMessageContext(prevMessageContext)
					neighbors.hasTop = canNeighborWithPreviousMessage && canNeighborWithCurrent
					previousMessageLastItemContext.any.neighbors.hasBottom =
						canNeighborWithPreviousMessage && canNeighborWithCurrent

					const previousMessageAttachmentContext = previousMessageLastItemContext.attachmentContext
					if (previousMessageAttachmentContext) {
						previousMessageAttachmentContext.extraSpaces.hasBottom =
							!hasExtraSpaces && shouldHaveExtraSpaces(previousMessageAttachmentContext.attachment)
					}
				} else {
					// First attachment, parent IS empty message and there IS NOT a message in group above the parent
					extraSpaces.hasTop = false
				}
			}
		} else {
			// There is another attachment before this one
			const canNeighborWithPrevious = canNeighborWithAttachment(previousContext.attachment)
			const shouldPreviousHasExtraSpaces = shouldHaveExtraSpaces(previousContext.attachment)
			previousContext.neighbors.hasBottom = canNeighborWithPrevious && canNeighborWithCurrent
			neighbors.hasTop = canNeighborWithPrevious && canNeighborWithCurrent
			previousContext.extraSpaces.hasBottom = !hasExtraSpaces && shouldPreviousHasExtraSpaces
		}

		const context: MessageAttachmentContext = {
			attachment,
			neighbors,
			extraSpaces,
			messageContext,
		}
		messageContext.attachmentsContext.push(context)
		previousContext = { ...context }
	}
}

const getLastItemOfMessageContext = (
	messageContext: MessageContext,
): { any: MessageContext | MessageAttachmentContext; attachmentContext?: MessageAttachmentContext } => {
	const attachmentContext = lastItemOfArray(messageContext.attachmentsContext) || undefined
	return { attachmentContext, any: attachmentContext || messageContext }
}

const getMessageAttachments = (message: Message): Attachment[] => {
	if (!message) return []
	return message.content?.type === MessageContentType.Upload ? [message.content.data] : message.attachments
}

const isMessageEmpty = (message: Message) => !message.content.text

const processHtmlLinks = (html: string): string => {
	try {
		const hostname = getHostWindow().location.hostname
		const parser = new DOMParser()
		const doc = parser.parseFromString(html, 'text/html')
		const anchors = doc.querySelectorAll('a[href]')

		anchors.forEach((a) => {
			let href = a.getAttribute('href') || ''

			href = href.replace(/^https?:\/\/"?https?:\/\//, 'https://')
			href = href.replace(/^"+|"+$/g, '')
			a.setAttribute('href', href)

			const isSameHost = hostname.length > 0 && href.includes(hostname)
			if (!a.hasAttribute('target')) {
				a.setAttribute('target', isSameHost ? '_parent' : '_blank')
			}

			if (!a.hasAttribute('rel')) {
				a.setAttribute('rel', 'noopener noreferrer')
			}
		})

		return doc.body.innerHTML
	} catch (error) {
		return html
	}
}

/**
 * The main logic decision, which message belongs to which group.
 * - Group types
 *   - contact messages (+ attachments)
 *   - agent messages (+ attachments)
 * - Not grouping for
 *   - bot messages with replies (group if replies are hidden)
 * - Group messages received/send in the same minute
 * - Group only the same authors (agent, visitor, bot)
 */
const messageBelongsToGroup = (message: Message, currentGroup: MessageGroup): boolean => {
	const messageGroupType = getMessageGroupType(message)
	const sameAgentMessage =
		messageGroupType === MessageGroupType.AgentMessage && message.agentId === currentGroup.agentId
	const sameContactMessage = messageGroupType === MessageGroupType.ContactMessage
	const noBotQuickReplies = message.subType !== MessageSubType.Bot || (message.content.quickReplies || []).length === 0
	return (
		currentGroup.type === messageGroupType &&
		(sameAgentMessage || sameContactMessage) &&
		noBotQuickReplies &&
		isSameMinute(currentGroup.date, message.createdAt)
	)
}

const getMessageGroupType = (message: Message): MessageGroupType | null => {
	switch (message.subType) {
		case MessageSubType.Agent:
			return MessageGroupType.AgentMessage
		case MessageSubType.Contact:
			return MessageGroupType.ContactMessage
		case MessageSubType.Bot:
			return MessageGroupType.BotMessage
	}
	return null
}

/**
 * Check previous message context if it is possible to be neighbor with
 */
const canNeighborWithMessage = (context: MessageContext): boolean => {
	const attachmentsCount = context.attachmentsContext.length
	const isLastAttachmentFile =
		attachmentsCount > 0 && context.attachmentsContext[attachmentsCount - 1].attachment.type === AttachmentType.File
	return !isLastAttachmentFile
}

/**
 * Check previous message context if it is possible to be neighbor with
 */
const canNeighborWithAttachment = (attachment: Attachment): boolean => {
	return attachment.type !== AttachmentType.File && attachment.type !== AttachmentType.Cards
}

const shouldHaveExtraSpaces = (attachment?: Attachment): boolean => {
	return !!attachment && (attachment.type === AttachmentType.File || attachment.type === AttachmentType.Cards)
}

export const playMessageSound = (): void => {
	const audio = getNotificationSound()
	audio.volume = MESSAGE_SOUND_VOLUME

	audio.addEventListener('canplaythrough', () => {
		audio.play().catch((error) => printWarning('Could not play message sound.', error))
	})
}

export const playMessageSoundThrottled = throttle(playMessageSound, MESSAGE_SOUND_THROTTLING)

export const filterUserAgentMessages = (messages: Message[]) =>
	messages.filter(
		(m) =>
			m.type === MessageType.Message && (m.subType === MessageSubType.Agent || m.subType === MessageSubType.Contact),
	)

export const lastOpenedConversationMessages = (messages: Message[], filterOutSystem = true) => {
	const openedConversationMessages = messages.reduce((acc, message) => {
		acc.push(message)
		if (
			message.content.type === MessageContentType.ChatClose ||
			message.content.type === MessageContentType.ChatVisitorClose
		)
			return []
		return acc
	}, [] as Message[])

	return filterOutSystem
		? openedConversationMessages.filter((m) => m.type === MessageType.Message && m.subType !== MessageSubType.System)
		: openedConversationMessages
}

export const filterTriggers = (messages: Message[]) => {
	const chatbotIds: TriggerList = {}
	messages.forEach((message) => {
		if (message.trigger) {
			chatbotIds[message.trigger.id] = { sent: true }
		}
	})
	return chatbotIds
}

export const hasQuickReplies = (message: Message.Message.Bot): boolean => {
	return !!(message.content.quickReplies && message.content.quickReplies.length > 0)
}

export const processMessage = async (message: Message, isUpdate = false): Promise<Message> => {
	const isReadable = isMessageReadable(message)
	const shouldProcessPopupCards = !isUpdate && isReadable
	if ('html' in message.content && message.content.html) {
		message.content.html = processHtmlLinks(message.content.html)
	}
	if (message.content?.text && widgetOptions.getOptions().urlCardsEnabled) {
		const attachments = await getAttachments(
			message.content.text,
			message.subType === MessageSubType.Contact,
			shouldProcessPopupCards,
		)
		if (attachments && attachments.items.length > 0) message.attachments.push(attachments)
	}
	isAgentTyping.set(false)
	return message
}

export const processMessages = async (messages: Message[]): Promise<Message[]> => {
	if (widgetOptions.getOptions().urlCardsEnabled) {
		await Promise.all(messages.map(async (message) => await processMessage(message)))
	}
	return messages
}

export const hasEmailChannelType = (messagesContext: MessageContext[]) => {
	return messagesContext.findIndex((item) => item.message.channel.type === 'email') > -1
}

export const getBotIdentityId = (messagesContext: MessageContext[]) => {
	const messageContext = messagesContext.find((item) => item.message?.trigger?.identityId)
	return messageContext?.message?.trigger?.identityId as string
}
