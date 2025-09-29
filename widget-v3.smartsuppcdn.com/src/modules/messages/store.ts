import { type Message, MessageContent, MessageContentType, MessageSubType } from '@smartsupp/smartsupp-message'
import { derived, get, type Readable, writable } from 'svelte/store'

import {
	isMessageNotifiable,
	isMessengerFrameOpen,
	isWidgetVisible,
	openPopupFrame,
	openTypingFrame,
	shouldShowWidget,
	showWidgetByAPI,
	soundsEnabled,
} from '@/modules/app'
import { accountStatus, deleteRatingMessage, lastReadAt, suggestedRating } from '@/modules/chat'
import { type ChatRating, openChatRatingDrawer, ratingMessageId } from '@/modules/chatRating'
import { eventEmitter } from '@/modules/events'
import { chatbotButtonInteractionGA, offlineMessageSentGaLogger } from '@/modules/googleAnalytics'
import { lastItemOfArray } from '@/utils/arrays'
import { normalize } from '@/utils/normalize'

import { uploadFile } from '../fileUpload/utils'
import type { MessageDictionary, MessageGroup, QuickReply } from './types'
import {
	compareMessagesByDate,
	groupMessages,
	isBotMessage,
	isMessageReadable,
	playMessageSoundThrottled,
	processMessage,
	processMessages,
	sendWebSocketMessage,
} from './utils'

const createMessageStore = () => {
	const messages = writable<MessageDictionary>({})
	const { subscribe, update, set } = messages

	const setMessages = async (messages: Message[]) => {
		set(normalize('id', await processMessages(messages)))
	}

	const addMessage = async (message: Message) => {
		const processedMessage = await processMessage(message)
		if (isBotMessage(message)) isReplyProcessing.set(false)
		update((state) => ({ ...state, [message.id]: processedMessage }))
		void handleMessageNotification(processedMessage)
	}

	const replaceMessage = async (message: Message) => {
		const messages = get(sortedMessages)
		if (!messages.some((msg) => msg.id === message.id)) return

		const processedMessage = get(lastMessageId) === message.id ? await processMessage(message, true) : message
		update((state) => ({ ...state, [message.id]: processedMessage }))
	}

	const updateMessageRating = (message: Message.Message.Generic<'system', MessageContent.Message.RateForm>) => {
		if (get(suggestedRating) === message.content.data?.target) deleteRatingMessage()
		update((state) => {
			if (!message || message.content.type !== MessageContentType.RateForm) return { ...state }
			if (!state[message.id]) {
				openChatRatingDrawer(message.id)
			}

			return { ...state, [message.id]: message }
		})
	}

	const deleteMessage = (id: string) => {
		update((state) => {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { [id]: _, ...newState } = state
			return newState
		})
	}

	const sendMessage = async (text: string, attachmentTokens: string[]) => {
		lastMessageInProcess.set(text)
		const message = await sendWebSocketMessage({ text })
		if (message) {
			lastMessageInProcess.set(null)
			await addMessage(message)
			eventEmitter.emit('messageSent', message)
			offlineMessageSentGaLogger(get(accountStatus))
		}
		await Promise.all(attachmentTokens.map((token) => uploadFile(token)))
	}

	const sendBotReply = async (replyTo: string, text: string, payload: QuickReply['payload']) => {
		const message = await sendWebSocketMessage({ text, quickReply: { replyTo, payload } })
		if (!payload.isGoBackButton) chatbotButtonInteractionGA(text)
		message && (await replaceMessage(message))
	}

	const clearMessages = () => {
		set({})
	}

	return {
		subscribe,
		setMessages,
		addMessage,
		deleteMessage,
		replaceMessage,
		updateMessageRating,
		sendMessage,
		sendBotReply,
		clearMessages,
	}
}

export const messages = createMessageStore()

export const showMessageInPopupFrame = (message: Message) => {
	if (!get(shouldShowWidget)) showWidgetByAPI()
	openTypingFrame()
	setTimeout(() => {
		void messages.addMessage(message)
		openPopupFrame()
	}, 1600)
}

export const handleMessageNotification = (incomingMessage: Message) => {
	if (
		!!incomingMessage &&
		get(soundsEnabled) &&
		get(shouldShowWidget) &&
		!(get(isWidgetVisible) && get(isMessengerFrameOpen)) &&
		isMessageNotifiable(incomingMessage)
	) {
		playMessageSoundThrottled()
	}
}

export const isReplyProcessing = writable(false)

export const popupMessage = derived([messages], ([$messages]): Message | null => {
	const allowedMessages = Object.values($messages).filter(isMessageReadable)
	if (!allowedMessages) return null

	const sortedMessages = allowedMessages.sort(
		(a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
	)
	return lastItemOfArray(sortedMessages)
})

export const unreadMessages = derived([messages, lastReadAt], ([$messages, $lastReadAt]): Message[] => {
	const readableMessages = Object.values($messages).filter(isMessageReadable)
	if (!$lastReadAt) return readableMessages

	return readableMessages.filter((m) => new Date(m.createdAt) > new Date($lastReadAt))
})

export const lastUnreadMessage = derived([unreadMessages], ([$unreadMessages]): Message | null => {
	return lastItemOfArray($unreadMessages)
})

export const unreadMessagesCount = derived([unreadMessages], ([$unreadMessages]): number => $unreadMessages.length)

export const hasUnreadMessages = derived(
	[unreadMessagesCount],
	([$unreadMessagesCount]): boolean => $unreadMessagesCount > 0,
)

export const sortedMessages = derived([messages], ([$messages]): Message[] => {
	return Object.values($messages).sort(compareMessagesByDate)
})

export const messageGroups = derived([sortedMessages], ([$messages]): MessageGroup[] => {
	return groupMessages($messages)
})

export const lastMessageId = derived([sortedMessages], ([$sortedMessages]): string | null => {
	const lastMessage = lastItemOfArray($sortedMessages)
	return lastMessage?.id ?? null
})

export const isMessengerInputDisabled = derived([messages], ([$messages]): boolean => {
	const messagesWithDisableInput = Object.values($messages).filter(
		(m) => typeof m.widgetOptions?.disableInput === 'boolean',
	)
	const lastMessage = lastItemOfArray(messagesWithDisableInput)
	return lastMessage?.widgetOptions?.disableInput ?? false
})

export const hasContactOrAgentMessage = derived([messages], ([$messages]): boolean => {
	return Object.values($messages).filter((m) => m.subType === 'contact' || m.subType === 'agent').length > 0
})

export const hasContactMessage = derived([messages], ([$messages]): boolean => {
	return Object.values($messages).filter((m) => m.subType === MessageSubType.Contact).length > 0
})

export const chatRating: Readable<ChatRating | null> = derived(
	[messages, ratingMessageId],
	([$messages, $ratingMessageId], set) => {
		if ($ratingMessageId) {
			const message = $messages[$ratingMessageId]
			if (message && message.content.type === MessageContentType.RateForm) {
				set({
					messageId: message.id,
					value: message.content.data?.value,
					text: message.content.data?.text,
					target: message.content.data?.target,
				})
			}
		} else {
			set(null)
		}
	},
)

export const lastContactMessage = derived([sortedMessages], ([$sortedMessages]): Message | null => {
	const lastMessage = $sortedMessages
		.slice()
		.reverse()
		.find((message) => message.subType === MessageSubType.Contact)
	return lastMessage || null
})

export const lastMessageInProcess = writable<string | null>(null)
