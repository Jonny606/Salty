import VisitorClient, { ChatStatus, SocketError, type VisitorEvents } from '@smartsupp/websocket-client-visitor'
import { get } from 'svelte/store'

import { agents } from '@/modules/agents'
import { isMessengerFrameOpen, isWidgetInitialized, openMessengerFrame, shouldOpenWidgetOnTrigger } from '@/modules/app'
import {
	assignedAgentIds,
	chatId,
	chatStatus,
	dynamicWidgetOptions,
	isAgentTyping,
	lastReadAt,
	readChatIfPossible,
	setAccountStatus,
	setChatClosed,
	suggestedRating,
} from '@/modules/chat'
import { browserInfo } from '@/modules/device'
import { eventEmitter } from '@/modules/events'
import { fileUploadConfig } from '@/modules/fileUpload'
import { groups } from '@/modules/groups'
import {
	isBotMessage,
	isMessageReadable,
	isReplyProcessing,
	lastMessageId,
	messages,
	showMessageInPopupFrame,
} from '@/modules/messages'
import { setVisitsToStorage } from '@/modules/storage'
import { visitor } from '@/modules/visitor'
import { debugWidget } from '@/utils/debug'
import { initQueue } from '@/utils/initQueue'
import { provideSmartsuppGlobalProps } from '@/utils/window'

import { botIdentities } from '../botIdentities/store'
import { isAiChatRatingEnabled, isChatRatingEnabled, openChatRatingDrawer, RATE_MESSAGE_ID } from '../chatRating'
import { isClientConnected } from './store'
import { handleVisitorSessionReset, setVisitorId } from './utils'

/**
 * General events
 */
export const onInitializedEvent = (data: VisitorClient.ConnectedData) => {
	debugWidget('init data', data)
	isClientConnected.set(true)

	// Setup session ID
	handleVisitorSessionReset(data.chat, data.sessionId)
	// Setup visitor data
	const visitorId = data.visitor.id
	void setVisitorId(visitorId)
	setVisitsToStorage(data.visitor.visits)
	visitor.setVisitorData(data.visitor)
	provideSmartsuppGlobalProps({ vid: visitorId })

	// Setup file upload data
	fileUploadConfig.initialize(data.fileUpload)

	// Setup browser data
	browserInfo.set(data.browser)

	// Setup account data
	agents.setAgents(data.account.agents)
	botIdentities.setIdentities(data.account.botIdentities)
	if (data.chat?.virtualAgent !== undefined) agents.setVirtualAgent(data.chat?.virtualAgent)
	groups.setGroups(data.account.groups)
	setAccountStatus(data.account.status)

	// Setup chat data
	if (data.chat) {
		if (isChatRatingEnabled()) suggestedRating.set(data.chat.ratingSuggestedTarget || null)
		chatStatus.set(data.chat.status)
		setChatClosed(data.chat.isClosed)
		lastReadAt.set(data.chat.unreadInfo.lastReadAt)
		void messages.setMessages(data.chat.messages)
		assignedAgentIds.setAssignedAgentIds(data.chat.assignedIds ?? [])
		if (data.chat.widgetOptions) {
			dynamicWidgetOptions.updateGeneralOptions(data.chat.widgetOptions)
		}
	}

	isWidgetInitialized.set(true)
	eventEmitter.emit('widgetInit', true)
	// Execute all callbacks in queue
	initQueue.executeAll()
}

export const onErrorEvent = (error: Error | SocketError) => {
	// eslint-disable-next-line no-console
	console.error(error)
}

export const onDisconnectEvent = () => {
	isClientConnected.set(false)
}

// export const onReconnectingEvent = () => {
// 	console.log('reconnecting...')
// }
//
// export const onReconnectEvent = () => {
// 	console.log('reconnected!')
// }

/**
 * Chat status events
 */
export const onChatOpenedEvent = ({ chatId: id }: VisitorEvents.ChatOpened) => {
	isReplyProcessing.set(false)
	chatId.set(id)
	chatStatus.set(ChatStatus.Open)
	dynamicWidgetOptions.setMessageOptions({ disableAttachments: false })
}

export const onChatServedEvent = () => {
	chatStatus.set(ChatStatus.Served)

	// It's needed to reset chat closed status in order to close chat again, because this update isn't sent through WS
	setChatClosed(false)
}

export const onChatClosedEvent = ({ message }: VisitorEvents.ChatClosed) => {
	const { closeType } = message.content.data
	if (closeType === 'agent_close' || closeType === 'bot_close') {
		assignedAgentIds.setAssignedAgentIds([])
		chatStatus.set(ChatStatus.Closed)
		void messages.addMessage(message)
		eventEmitter.emit('chatClosed', message)
	}
}

export const onChatVisitorClosedEvent = ({ message }: VisitorEvents.ChatVisitorClosed) => {
	if (isChatRatingEnabled()) openChatRatingDrawer(RATE_MESSAGE_ID)
	setChatClosed(true, { byVisitor: true })
	void messages.addMessage(message)
	eventEmitter.emit('chatVisitorClosed', message)
}

/**
 * Chat events
 */
export const onChatUpdated = ({ changes }: VisitorEvents.ChatUpdated) => {
	if (changes.widgetOptions) {
		dynamicWidgetOptions.updateGeneralOptions(changes.widgetOptions)
	}
	if (changes.isClosed !== undefined) {
		setChatClosed(changes.isClosed)
	}
	if (changes.virtualAgent !== undefined) {
		agents.setVirtualAgent(changes.virtualAgent)
	}
}

const processChatMessageReceivedEvent = async ({ message }: VisitorEvents.ChatMessageReceived) => {
	const shouldOpenMessengerFrame = get(shouldOpenWidgetOnTrigger) && isBotMessage(message)

	// If messenger frame is closed and message is readable, add message with delay to show typing frame.
	// Also don't display typing and popup frames if widget should be open
	if (!get(isMessengerFrameOpen) && isMessageReadable(message) && !shouldOpenMessengerFrame) {
		showMessageInPopupFrame(message)
	} else {
		await messages.addMessage(message)
	}

	readChatIfPossible()
	if (message.widgetOptions) {
		dynamicWidgetOptions.setMessageOptions(message.widgetOptions)
	}
	if (shouldOpenMessengerFrame) {
		openMessengerFrame()
	}
	eventEmitter.emit('messageReceived', message)
}

export const onChatMessageReceivedEvent = (data: VisitorEvents.ChatMessageReceived) => {
	void processChatMessageReceivedEvent(data)
}

export const onChatMessageDeletedEvent = ({ messageId }: VisitorEvents.ChatMessageDeleted) => {
	void messages.deleteMessage(messageId)
}

export const onChatMessageUpdatedEvent = ({ message }: VisitorEvents.ChatMessageUpdated) => {
	void messages.replaceMessage(message)
	if (message.widgetOptions && message.id === get(lastMessageId)) {
		dynamicWidgetOptions.setMessageOptions(message.widgetOptions)
	}
}

export const onChatAgentJoined = ({ message, agent }: VisitorEvents.ChatAgentJoined) => {
	assignedAgentIds.addAssignedAgentId(message.content.data.agentId)
	void messages.addMessage(message)
	eventEmitter.emit('agentJoined', agent)
}

export const onChatAgentLeft = ({ message }: VisitorEvents.ChatAgentLeft) => {
	assignedAgentIds.removeAssignedAgentId(message.content.data.agentId)
	void messages.addMessage(message)
}

export const onChatAgentAssigned = ({ message }: VisitorEvents.ChatAgentAssigned) => {
	assignedAgentIds.addAssignedAgentId(message.content.data.assigned)
	void messages.addMessage(message)
}

export const onChatAgentUnassigned = ({ message }: VisitorEvents.ChatAgentUnassigned) => {
	assignedAgentIds.removeAssignedAgentId(message.content.data.unassigned)
	void messages.addMessage(message)
}

export const onChatAgentTyping = (data: VisitorEvents.ChatAgentTyping) => {
	if (!data.typing.is && get(isReplyProcessing)) return
	isAgentTyping.set(data.typing.is)
}

export const onChatContactReadEvent = (data: VisitorEvents.ChatRead) => {
	lastReadAt.set(data.lastReadAt)
}

export const onChatRated = ({ message, rating }: VisitorEvents.ChatRated) => {
	messages.updateMessageRating(message)
	eventEmitter.emit('chatRated', rating)
}

export const onTranscriptPdf = (data: VisitorEvents.ChatTranscriptPdf) => {
	eventEmitter.emit('transcriptPdf', data)
}

/**
 * Agent events
 */
export const onAgentUpdatedEvent = ({ id, changes }: VisitorEvents.AgentUpdated) => {
	agents.updateAgent(id, changes)
}

export const onAgentStatusUpdatedEvent = ({ id, status }: VisitorEvents.AgentStatusUpdated) => {
	agents.updateAgent(id, { status })
}

/**
 * Account events
 */
export const onAccountUpdatedEvent = ({ status }: VisitorEvents.AccountUpdated) => {
	setAccountStatus(status)
}

/**
 * Visitor events
 */
export const onVisitorUpdatedEvent = (data: Partial<VisitorClient.Identity>) => {
	visitor.updateVisitorData(data)
}

/**
 * Contact events
 */
export const onContactAcquired = (data: VisitorEvents.ContactAcquired) => {
	eventEmitter.emit('contactAcquired', data)
}

export const onChatRatingSuggested = (data: VisitorEvents.ChatRatingSuggested) => {
	if (isChatRatingEnabled() || isAiChatRatingEnabled()) {
		suggestedRating.set(data.ratingSuggestedTarget)
	}
}

export const onChatRatingCancelled = () => {
	if (get(suggestedRating)) {
		suggestedRating.set(null)
	}
}

/**
 * Identity events
 */
export const onIdentityStatusUpdatedEvent = ({ id, isActive }: VisitorEvents.IdentityStatusUpdated) => {
	botIdentities.updateIdentity(id, { isActive })
}
