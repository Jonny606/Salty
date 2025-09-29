import { derived } from 'svelte/store'

import { widgetOptions } from '@/modules/options'
import { isString } from '@/utils/isString'

import { isFullScreenEnabled } from '../device'

const DEFAULT_BOTTOM_OFFSET = 24
const DEFAULT_SIDE_OFFSET = 12

export const BUTTON_FRAME_DEFAULT_WIDTH = 300
export const BUTTON_FRAME_BUBBLE_SIZE = 56
export const BUTTON_FRAME_HEIGHT = BUTTON_FRAME_BUBBLE_SIZE

export const POPUP_FRAME_DEFAULT_HEIGHT = 166
const POPUP_FRAME_BOTTOM_OFFSET = BUTTON_FRAME_HEIGHT + 16

const MESSENGER_FRAME_WIDTH = 380
const MESSENGER_FRAME_HEIGHT = 672
export const MESSENGER_FRAME_BORDER_RADIUS = 12

const MESSENGER_FRAME_EXPANDED_WIDTH = 560
const MESSENGER_FRAME_EXPANDED_HEIGHT = 840

const MESSENGER_FRAME_HEADER_HEIGHT = 114
const MESSENGER_FRAME_HEADER_MOBILE_HEIGHT = 68

export const messengerHeaderHeight = derived([isFullScreenEnabled], ([$isFullScreenEnabled]) =>
	$isFullScreenEnabled ? MESSENGER_FRAME_HEADER_MOBILE_HEIGHT : MESSENGER_FRAME_HEADER_HEIGHT,
)

export const px = (value: number) => `${value}px`

const parseOffset = (offset?: string | number): number | undefined => {
	if (!offset) return
	return isString(offset) ? parseInt(offset, 10) : offset
}

export const getMessengerFrameDimensions = (isFullScreenEnabled: boolean, isMessengerFrameExpanded: boolean) => {
	const { widgetBlockingOptions } = widgetOptions.getOptions()
	if (isFullScreenEnabled || widgetBlockingOptions?.headlessMode) return { width: '100%', height: '100%' }
	if (isMessengerFrameExpanded)
		return { width: MESSENGER_FRAME_EXPANDED_WIDTH, height: MESSENGER_FRAME_EXPANDED_HEIGHT }
	return { width: MESSENGER_FRAME_WIDTH, height: MESSENGER_FRAME_HEIGHT }
}

const setMessengerNonMobileStyleProps = (el: HTMLElement) => {
	const { widgetBlockingOptions } = widgetOptions.getOptions()
	el.style.borderRadius = px(MESSENGER_FRAME_BORDER_RADIUS)
	if (widgetBlockingOptions?.headlessMode) {
		el.style.boxShadow = 'none'
	} else if (widgetBlockingOptions?.limitShadow) {
		el.style.boxShadow = 'rgba(0, 0, 0, 0.25) 0px 5px 12px'
	} else {
		el.style.boxShadow = 'rgba(0, 0, 0, 0.16) 0px 5px 40px'
	}
}

const getButtonFrameBottomOffset = () => {
	const { offsetY } = widgetOptions.getOptions()
	return parseOffset(offsetY) ?? DEFAULT_BOTTOM_OFFSET
}

const getButtonFrameSideOffset = () => {
	const { offsetX } = widgetOptions.getOptions()
	return parseOffset(offsetX) ?? DEFAULT_SIDE_OFFSET
}

const getMessengerFrameBottomOffset = (isFullScreenEnabled: boolean) => {
	const { widgetBlockingOptions } = widgetOptions.getOptions()
	return isFullScreenEnabled || widgetBlockingOptions?.headlessMode ? 0 : DEFAULT_BOTTOM_OFFSET
}

const getMessengerFrameSideOffset = (isFullScreenEnabled: boolean) => {
	const { widgetBlockingOptions } = widgetOptions.getOptions()
	return isFullScreenEnabled || widgetBlockingOptions?.headlessMode ? 0 : DEFAULT_SIDE_OFFSET
}

const hasFrameFixedPosition = (): boolean => {
	const { position } = widgetOptions.getOptions()
	return position === 'fixed'
}

const setFramePosition = (el: HTMLElement) => {
	if (hasFrameFixedPosition()) {
		el.style.position = 'fixed'
	}
}

const setFrameBottomOffset = (el: HTMLElement, offset: number) => {
	if (hasFrameFixedPosition()) {
		el.style.bottom = px(offset)
	}
}

const setFrameSideOffset = (el: HTMLElement, offset: number) => {
	if (hasFrameFixedPosition()) {
		const { orientation } = widgetOptions.getOptions()
		if (orientation === 'right') {
			el.style.left = 'initial'
			el.style.right = px(offset)
		} else {
			el.style.left = px(offset)
			el.style.right = 'initial'
		}
	}
}

const setFrameZIndex = (el: HTMLElement) => {
	const { zIndex } = widgetOptions.getOptions()
	el.style.zIndex = String(zIndex ?? 'auto')
}

// Defaults - prevent global override
export const getIframeDefaultStyles = (override?: (el: HTMLElement) => void): string => {
	const el = document.createElement('iframe')
	el.style.position = 'absolute'
	el.style.width = '100%'
	el.style.height = '100%'
	el.style.border = 'none'
	el.style.display = 'block'
	el.style.textAlign = 'left'
	el.style.margin = '0'
	el.style.padding = '0'
	el.style.top = '0'
	el.style.left = '0'
	el.style.opacity = '1'
	if (override) override(el)
	return el.getAttribute('style') ?? ''
}

// Button frame
export const setButtonFrameStyleProps = (el: HTMLElement) => {
	setFramePosition(el)
	setFrameBottomOffset(el, getButtonFrameBottomOffset())
	setFrameSideOffset(el, getButtonFrameSideOffset())
	setFrameZIndex(el)
}

// Messenger frame
export const setMessengerFrameStyleProps = (el: HTMLElement, isFullScreenEnabled: boolean) => {
	setFramePosition(el)
	setFrameBottomOffset(el, getMessengerFrameBottomOffset(isFullScreenEnabled))
	setFrameSideOffset(el, getMessengerFrameSideOffset(isFullScreenEnabled))
	setFrameZIndex(el)
	if (!isFullScreenEnabled) setMessengerNonMobileStyleProps(el)
}

// Popup frame
export const setPopupFrameStyleProps = (el: HTMLElement) => {
	setFramePosition(el)
	setFrameBottomOffset(el, getButtonFrameBottomOffset() + POPUP_FRAME_BOTTOM_OFFSET)
	setFrameSideOffset(el, getButtonFrameSideOffset())
	setFrameZIndex(el)
}

// Overlay frame
export const setOverlayFrameStyleProps = (el: HTMLElement) => {
	el.style.position = 'fixed'
	el.style.width = '100%'
	el.style.height = '100%'
	setFrameBottomOffset(el, 0)
	setFrameSideOffset(el, 0)
	setFrameZIndex(el)
}
