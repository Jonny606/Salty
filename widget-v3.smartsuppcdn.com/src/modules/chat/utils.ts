import { type Message, MessageContent, type RatingTarget } from '@smartsupp/smartsupp-message'
import { get } from 'svelte/store'

import { closeMessengerFrame, isMessengerFrameOpen } from '@/modules/app'
import { isChatRatingEnabled, RATE_FORM_MESSAGE, RATE_MESSAGE_ID } from '@/modules/chatRating'
import { closeDrawer } from '@/modules/drawers'
import { hasUnreadMessages, messages } from '@/modules/messages'
import { visitorClientProvider } from '@/modules/websocketClient'
import { getHostDocument } from '@/utils/window'

import { chatId, lastReadAt, setChatClosed } from './store'

export const readChat = () => {
	lastReadAt.set(new Date().toISOString())
	visitorClientProvider.getClient().chatRead()
}

export const readChatIfPossible = () => {
	const isDocumentVisible = getHostDocument().visibilityState === 'visible'
	if (!get(hasUnreadMessages) || !get(isMessengerFrameOpen) || !isDocumentVisible) return

	readChat()
}

const getRateMessage = (target: RatingTarget): Message.Message.Generic<'system', MessageContent.Message.RateForm> => {
	return {
		...RATE_FORM_MESSAGE,
		chatId: get(chatId),
		createdAt: new Date().toISOString(),
		content: { ...RATE_FORM_MESSAGE.content, data: { target } },
	}
}

export const closeChatByVisitor = () => {
	setChatClosed(true, { byVisitor: true })
	visitorClientProvider.getClient().chatClose()
	closeDrawer()

	if (!isChatRatingEnabled()) {
		closeMessengerFrame()
	}
}

export const addRatingMessage = async (target: RatingTarget) => {
	await messages.addMessage(getRateMessage(target))
}

export const deleteRatingMessage = () => {
	messages.deleteMessage(RATE_MESSAGE_ID)
}
