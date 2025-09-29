import { eventEmitter } from '@/modules/events'

import { ApiEvent, type ApiEventCallback, type ApiEventHandler } from './types'

const handleMessageSentEvent: ApiEventHandler = (callback) => {
	eventEmitter.on('messageSent', callback)
}

const handleMessageReceivedEvent: ApiEventHandler = (callback) => {
	eventEmitter.on('messageReceived', callback)
}

const handleChatCloseEvent: ApiEventHandler = (callback) => {
	eventEmitter.on('messengerClose', callback)
}

const handleWidgetInit: ApiEventHandler = (callback) => {
	eventEmitter.on('widgetInit', callback)
}

const apiEventMap: Record<ApiEvent, ApiEventHandler> = {
	[ApiEvent.MessageSent]: handleMessageSentEvent,
	[ApiEvent.MessageReceived]: handleMessageReceivedEvent,
	[ApiEvent.MessengerClose]: handleChatCloseEvent,
	[ApiEvent.WidgetInit]: handleWidgetInit,
}

export const handleApiEvent = (eventName: ApiEvent, callback: ApiEventCallback) => {
	const eventHandler = apiEventMap[eventName]
	eventHandler && eventHandler(callback)
}
