import {
	setButtonFrameStyleProps,
	setMessengerFrameStyleProps,
	setOverlayFrameStyleProps,
	setPopupFrameStyleProps,
} from './frameStyles'

export const buttonFrameStyle = (el: HTMLElement) => {
	setButtonFrameStyleProps(el)
}

export const messengerFrameStyle = (el: HTMLElement, isfullscreenMode: boolean) => {
	setMessengerFrameStyleProps(el, isfullscreenMode)
}

export const popupFrameStyle = (el: HTMLElement) => {
	setPopupFrameStyleProps(el)
}

export const typingFrameStyle = (el: HTMLElement) => {
	// Has same styles as popup frame
	setPopupFrameStyleProps(el)
}

export const overlayFrameStyle = (el: HTMLElement) => {
	setOverlayFrameStyleProps(el)
}
