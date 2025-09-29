import type { Message, MessageContent } from '@smartsupp/smartsupp-message'

import type { ChatRatingInfo } from './types'

export enum RatingValue {
	Good = 5,
	Normal = 3,
	Bad = 1,
}

export const chatRatingInfoMap: Record<number, ChatRatingInfo> = {
	[RatingValue.Good]: {
		value: RatingValue.Good,
		text: 'agentRating.good.formText',
		name: 'good',
	},
	[RatingValue.Normal]: {
		value: RatingValue.Normal,
		text: 'agentRating.normal.formText',
		name: 'neutral',
	},
	[RatingValue.Bad]: { value: RatingValue.Bad, text: 'agentRating.bad.formText', name: 'bad' },
}

export const ratingInfoArray = Object.values(chatRatingInfoMap).sort((a, b) => b.value - a.value)

export const RATE_MESSAGE_ID = 'rate_form_id'

export const RATE_FORM_MESSAGE: Message.Message.Generic<'system', MessageContent.Message.RateForm> = {
	id: RATE_MESSAGE_ID,
	type: 'message',
	subType: 'system',
	channel: {
		type: 'default',
		id: null,
	},
	chatId: '',
	visitorId: '',
	groupId: null,
	agentId: null,
	trigger: null,
	createdAt: '',
	content: {
		type: 'rate_form',
		data: {},
	},
	attachments: [],
	widgetOptions: {
		disableInput: false,
		disableAuthentication: false,
		disableAttachments: false,
	},
}
