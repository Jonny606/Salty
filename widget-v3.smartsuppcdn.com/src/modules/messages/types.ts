import type { Attachment, Message, MessageComponent } from '@smartsupp/smartsupp-message'
import type { Writable } from 'svelte/store'

import type { Dictionary } from '@/types'

export type MessageDictionary = Dictionary<Message>

export type MessageAlign = {
	isLeft: boolean
	isRight: boolean
}

export interface MessageNeighbors {
	hasTop: boolean
	hasBottom: boolean
}

export type AttachmentExtraSpaces = MessageNeighbors

export enum MessageGroupType {
	ContactMessage = 'contact-message',
	AgentMessage = 'agent-message',
	BotMessage = 'bot-message',
	BotReplies = 'bot-replies',
}

export interface MessageGroup {
	type: MessageGroupType | null
	id: string
	date: string
	agentId: string | null
	align: MessageAlign
	variant: MessageContentVariant
	messagesContext: MessageContext[]
	isBot: boolean
	showAvatar: boolean
	useFullWidth: boolean
}

export type AnyContext = MessageContext | MessageAttachmentContext

export interface MessageContext {
	group: MessageGroup
	message: Message
	neighbors: MessageNeighbors
	attachmentsContext: MessageAttachmentContext[]
}
export type WritableMessageContext = Writable<MessageContext>

export type MessageAttachmentContext = {
	attachment: Attachment
	messageContext: MessageContext
	neighbors: MessageNeighbors
	extraSpaces: AttachmentExtraSpaces
}
export type WritableMessageAttachmentContext = Writable<MessageAttachmentContext>

export type MessageContentVariant = {
	isPrimary: boolean
	isSecondary: boolean
}

export interface QuickReply extends MessageComponent.Action {
	text: string
	payload: {
		replyId?: string
		isGoBackButton?: boolean
		translate?: boolean
		nextInteractionId?: string
	}
}

export type TriggerList = {
	[key: string]: {
		sent?: boolean
		reacted?: boolean
		visitorResponded?: boolean
	}
}
