export type { WebsocketVisitorClient } from '@smartsupp/websocket-client-visitor'
export type { SmartsuppWidgetApi } from '@smartsupp/widget-loader-types'

export enum ApiCommand {
	Name = 'name',
	Group = 'group',
	Email = 'email',
	Phone = 'phone',
	Variables = 'variables',
	ContactData = 'contactData',
	Language = 'language',
	ChatClose = 'chat:close',
	ChatOpen = 'chat:open',
	ChatShow = 'chat:show',
	ChatHide = 'chat:hide',
	ThemeColor = 'theme:color',
	ChatMessage = 'chat:message',
	ChatSend = 'chat:send',
	HtmlApply = 'html:apply',
	On = 'on',
	AnalyticsConsent = 'analyticsConsent',
	MarketingConsent = 'marketingConsent',
	OpenRateForm = 'openRateForm',
	OpenAuthForm = 'openAuthForm',
	WidgetStatus = 'widgetStatus',
	Translations = 'translations',
	AuthFormFields = 'authFormFields',
	ButtonStyle = 'buttonStyle',
	PreviewTranslate = 'previewTranslate',
	DisableConnectionStatus = 'disableConnectionStatus',
	ReloadWithMockData = 'reloadWithMockData',
	Reload = 'reload',
}

export type ApiCommandHandler = (name: ApiCommand, param: unknown, ...args: unknown[]) => void

export enum ApiEvent {
	MessageSent = 'message_sent',
	MessageReceived = 'message_received',
	MessengerClose = 'messenger_close',
	WidgetInit = 'widget_init',
}

export type ApiEventCallback = (...args: unknown[]) => void
export type ApiEventHandler = (callback: ApiEventCallback) => void
