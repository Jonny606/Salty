import type VisitorClient from '@smartsupp/websocket-client-visitor'
import { get } from 'svelte/store'

import { WIDGET_VERSION } from '@/constants'
import { apiProps } from '@/modules/api'
import { isMessengerFrameOpen, shouldShowWidget } from '@/modules/app'
import { widgetOptions } from '@/modules/options'
import {
	clearLocalStorage,
	closeCrossDomainStorage,
	getVisitorIdFromStorage,
	getVisitsFromStorage,
	setVisitorIdToStorage,
	StorageItem,
} from '@/modules/storage'
import { printWarning } from '@/utils/console'
import { getTopOrHostWindow } from '@/utils/window'

import { assignedAgentIds, clearChat } from '../chat'
import { messages } from '../messages'
import { removeCookie } from '../storage/cookies'
import { sessionId } from './store'

export const getServerUrl = () => {
	const { protocol, host } = widgetOptions.getOptions()
	const widgetProtocol = protocol === 'http' ? 'http' : 'https'
	return `${widgetProtocol}://${host}`
}

const getVisitorId = async (): Promise<string | null> => {
	const { mobileSdk, visitorId } = widgetOptions.getOptions()
	if (mobileSdk && visitorId) {
		return visitorId
	}

	try {
		return await getVisitorIdFromStorage()
	} catch (e) {
		printWarning(String(e))
		return null
	}
}

const getPageUrl = (isPreviewMode: boolean, botId?: string) => {
	let pageUrl = getTopOrHostWindow().location.href
	if (isPreviewMode && botId) {
		pageUrl = `${pageUrl}${pageUrl.includes('?') ? '&' : '?'}ss-bot-run=${botId}`
	}
	return pageUrl
}

const resetVisitorSession = () => {
	messages.clearMessages()
	clearChat()
	assignedAgentIds.clearAssignedAgentIds()
	clearLocalStorage()
	removeCookie(StorageItem.VisitorId)
}

export const setVisitorId = async (id: string) => {
	try {
		await setVisitorIdToStorage(id)
		closeCrossDomainStorage()
	} catch (e) {
		printWarning(String(e))
	}
}

export const getVisitorClientData = async (reloadWithReset = false): Promise<VisitorClient.ConnectData> => {
	const { key, lang, isPreviewMode, previewWithoutReset, sitePlatform, triggerable, _chatMaxReopenTime, botId } =
		widgetOptions.getOptions()

	if ((isPreviewMode && !previewWithoutReset) || reloadWithReset) {
		resetVisitorSession()
	}

	const id = await getVisitorId()
	const apiProperties = get(apiProps)

	return {
		key,
		id,
		isPreviewMode,
		sitePlatform,
		triggerable,
		_chatMaxReopenTime,
		name: apiProperties.name,
		email: apiProperties.email,
		phone: apiProperties.phone,
		group: apiProperties.group,
		lang: apiProperties.lang ?? lang,
		variables: apiProperties.variables,
		widgetVersion: WIDGET_VERSION,
		visits: getVisitsFromStorage(),
		isWidgetVisible: get(shouldShowWidget),
		isWidgetOpen: get(isMessengerFrameOpen),
		pageUrl: getPageUrl(isPreviewMode, botId),
		pageTitle: getTopOrHostWindow().document.title,
		domain: getTopOrHostWindow().location.hostname || 'unknown',
		referer: getTopOrHostWindow().document.referrer,
		bundleVersion: import.meta.env.VITE_COMMIT_HASH || 'dev',
	}
}

export const handleVisitorSessionReset = (chat: VisitorClient.ChatInfo | undefined, session: string) => {
	const { isPreviewMode } = widgetOptions.getOptions()
	if (!chat && session !== get(sessionId) && !isPreviewMode) {
		resetVisitorSession()
		if (get(isMessengerFrameOpen)) isMessengerFrameOpen.set(false)
	}
	sessionId.set(session)
}
