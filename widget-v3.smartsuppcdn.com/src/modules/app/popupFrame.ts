import { derived, writable } from 'svelte/store'

import { isMobileDevice } from '@/modules/device'
import { processingPopupCards } from '@/modules/linkPreview'
import { popupMessage } from '@/modules/messages'
import { widgetOptions } from '@/modules/options'
import { getFromStorage, setToStorage, StorageItem } from '@/modules/storage'

import { isMessengerFrameOpen } from './messengerFrame'
import { isWidgetInitialized } from './store'
import { shouldShowWidget } from './widgetVisibility'

const isTypingFrameOpen = writable<boolean>(false)
const isPopupFrameOpen = writable<boolean>(false)

export const openTypingFrame = () => {
	isTypingFrameOpen.set(true)
	isPopupFrameOpen.set(false)
}

export const openPopupFrame = () => {
	isPopupFrameOpen.set(true)
	isTypingFrameOpen.set(false)
}

export const closePopupFrame = (setClosedAt = false) => {
	isPopupFrameOpen.set(false)
	setClosedAt && setToStorage({ name: StorageItem.PopupClosedAt, value: new Date().toISOString() })
}

const shouldRenderPopupIfMobile = derived([isMobileDevice], ([$isMobileDevice]): boolean => {
	const { mobilePopupsEnabled } = widgetOptions.getOptions()
	return $isMobileDevice ? !!mobilePopupsEnabled : true
})

const canReopenPopupFrame = derived([popupMessage], ([$popupMessage]) => {
	// Should only open the popup frame if the popup message is newer than the last time the popup was closed by user
	const popupClosedAt = getFromStorage(StorageItem.PopupClosedAt) ?? null
	if (!popupClosedAt || !$popupMessage) return true

	const popupMessageTime = new Date($popupMessage.createdAt).getTime()
	const popupClosedTime = new Date(popupClosedAt).getTime()

	return popupMessageTime > popupClosedTime
})

export const shouldRenderTypingFrame = derived(
	[isWidgetInitialized, shouldShowWidget, isTypingFrameOpen, isMessengerFrameOpen, shouldRenderPopupIfMobile],
	([
		$isWidgetInitialized,
		$shouldShowWidget,
		$isTypingFrameOpen,
		$isMessengerFrameOpen,
		$shouldRenderPopupIfMobile,
	]) => {
		return (
			$isWidgetInitialized &&
			$shouldShowWidget &&
			$isTypingFrameOpen &&
			!$isMessengerFrameOpen &&
			$shouldRenderPopupIfMobile
		)
	},
)

export const shouldRenderPopupFrame = derived(
	[
		isWidgetInitialized,
		shouldShowWidget,
		isPopupFrameOpen,
		isMessengerFrameOpen,
		popupMessage,
		canReopenPopupFrame,
		shouldRenderPopupIfMobile,
		processingPopupCards,
	],
	([
		$isWidgetInitialized,
		$shouldShowWidget,
		$isPopupFrameOpen,
		$isMessengerFrameOpen,
		$popupMessage,
		$canReopenPopupFrame,
		$shouldRenderPopupIfMobile,
		$processingPopupCards,
	]) => {
		return (
			$isWidgetInitialized &&
			$shouldShowWidget &&
			$isPopupFrameOpen &&
			$popupMessage &&
			$canReopenPopupFrame &&
			!$isMessengerFrameOpen &&
			$shouldRenderPopupIfMobile &&
			!$processingPopupCards
		)
	},
)
