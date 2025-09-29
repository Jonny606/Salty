export enum StorageItem {
	AnalyticsConsent = 'analyticsConsent',
	AuthForm = 'authForm',
	IsMessengerFrameExpanded = 'isMessengerFrameExpanded',
	IsMessengerFrameOpened = 'opened',
	MarketingConsent = 'marketingConsent',
	Message = 'message',
	PopupClosedAt = 'popupClosedAt',
	RatingText = 'ratingText',
	SoundsEnabled = 'enableSounds',
	VisitorId = 'vid',
	Visits = 'visits',
	TicketForm = 'ticketForm',
	SessionId = 'sessionId',
}

export interface SetToStorageParams {
	name: StorageItem
	value: string
}
