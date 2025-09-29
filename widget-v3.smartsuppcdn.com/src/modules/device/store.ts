import { derived, writable } from 'svelte/store'

import type { Dimensions } from '@/types'
import { getHostWindow } from '@/utils/window'

import { widgetOptions } from '../options'
import type { BrowserInfo } from './types'
import { isIOsDevice } from './utils'

export const BREAKPOINT_WIDTH_MD = 450
export const BREAKPOINT_HEIGHT_MD = 500

export const browserInfo = writable<BrowserInfo | null>(null)

export const windowSize = writable<Dimensions>({
	width: getHostWindow().innerWidth,
	height: getHostWindow().innerHeight,
})

export const isMobileDevice = derived([browserInfo, windowSize], ([$browserInfo, $windowSize]) => {
	const { widgetBlockingOptions } = widgetOptions.getOptions()
	if (widgetBlockingOptions?.enforceDesktopMode) return false
	if ($browserInfo) {
		const { isMobile, isTablet } = $browserInfo
		if (isTablet) return false
		if (isMobile) return true
	}

	return $windowSize.width < BREAKPOINT_WIDTH_MD || $windowSize.height < BREAKPOINT_HEIGHT_MD
})

export const isFullScreenEnabled = derived([isMobileDevice], ([$isMobileDevice]) => {
	const { fullScreenEnabled } = widgetOptions.getOptions()
	if ($isMobileDevice || fullScreenEnabled) {
		return true
	}
	return false
})

export const isDesktop = derived([browserInfo], ([$browserInfo]): boolean => {
	return !!$browserInfo?.isDesktop && !isIOsDevice() // iPad 13+ is incorrectly detected as desktop
})

export const isTablet = derived([browserInfo], ([$browserInfo]): boolean => {
	return !!$browserInfo?.isTablet
})
