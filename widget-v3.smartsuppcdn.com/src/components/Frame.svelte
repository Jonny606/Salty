<script lang="ts">
import { type Component, mount, onDestroy, onMount, tick, unmount } from 'svelte'

import { setThemeCssVariables } from '@/modules/theme'
import { type Theme, themeColor } from '@/modules/theme/store'

type Props = {
	component: Component
	frameStyle?: string
	title: string
	id: string
}

let { component, frameStyle, title, id }: Props = $props()

const viteDevIdDataAttr = 'data-vite-dev-id'
const isDevelopmentMode = import.meta.env.MODE === 'development'

let frame: HTMLIFrameElement | undefined = $state()
let frameDocument: Document | null = $state(null)
let framedComponent: Component
let styleObserver: MutationObserver | undefined

$effect(() => {
	if (frameDocument) {
		void mountComponent(frameDocument)
	}
})

// Update frame CSS variables when color is changed
$effect(() => {
	frameDocument && setThemeVariables($themeColor)
})

const mountComponent = async (doc: Document) => {
	if (framedComponent) {
		await unmount(framedComponent)
	}
	if (doc && component) {
		framedComponent = mount(component, { target: doc.body }) as Component
	}
}

const setThemeVariables = (theme: Theme) => {
	if (!frameDocument) return
	setThemeCssVariables(frameDocument, theme)
}

const createStyleElement = (content: string) => {
	if (!frameDocument) return
	const styleEl = frameDocument.createElement('style')
	styleEl.textContent = content
	frameDocument.head.appendChild(styleEl)
	return styleEl
}

const adoptMainFrameStyles = () => {
	for (const sheet of window.document.styleSheets) {
		let styleText = ''
		try {
			styleText = [...sheet.cssRules].map((rule) => rule.cssText).join('')
		} catch (e) {
			// Skip stylesheets that are restricted
			continue
		}
		const styleEl = createStyleElement(styleText)

		if (!styleEl) return
		// Dev mode: Copy vite dev data attribute of owner style element
		if (isDevelopmentMode) {
			const ownerNode = sheet.ownerNode as HTMLElement | null
			if (ownerNode) {
				const viteDataAttrValue = ownerNode.getAttribute(viteDevIdDataAttr)
				if (viteDataAttrValue) {
					styleEl.setAttribute(viteDevIdDataAttr, viteDataAttrValue)
				}
			}
		}
	}
}

const getNodeViteDevId = (node: Node): string => {
	return (node as HTMLElement).getAttribute(viteDevIdDataAttr) ?? ''
}

const getMatchingStyleElement = (node: Node): HTMLStyleElement | null => {
	if (!frameDocument) return null
	const styleElements = frameDocument.head.querySelectorAll('style')
	for (const el of styleElements) {
		if (el.getAttribute(viteDevIdDataAttr) === getNodeViteDevId(node)) return el
	}
	return null
}

const observeStyleChanges = () => {
	const trackStyleMutations: MutationCallback = (mutations) => {
		for (const mutation of mutations) {
			if (mutation.type === 'childList') {
				for (const node of mutation.removedNodes) {
					switch (node.nodeType) {
						case Node.TEXT_NODE: {
							const styleEl = getMatchingStyleElement(mutation.target)
							if (styleEl) styleEl.textContent = ''
							break
						}
					}
				}

				for (const node of mutation.addedNodes) {
					switch (node.nodeType) {
						case Node.ELEMENT_NODE:
							frameDocument && frameDocument.head.appendChild(node.cloneNode(true))
							break
						case Node.TEXT_NODE: {
							const styleEl = getMatchingStyleElement(mutation.target)
							if (styleEl) styleEl.textContent = node.textContent
							break
						}
					}
				}
			}
		}
	}

	styleObserver = new MutationObserver(trackStyleMutations)
	styleObserver.observe(window.document.head, { childList: true, subtree: true })
}

const handleFrameLoad = () => {
	if (!frame || !frame.contentDocument) return
	frameDocument = frame.contentDocument
	adoptMainFrameStyles()
	isDevelopmentMode && observeStyleChanges()
}

onMount(async () => {
	await tick()
	if (frame?.contentDocument && frame.contentDocument.readyState === 'complete' && frame.contentDocument.defaultView) {
		handleFrameLoad()
	} else {
		frame?.addEventListener('load', handleFrameLoad)
	}
})

onDestroy(async () => {
	if (frame) frame.removeEventListener('load', handleFrameLoad)
	if (framedComponent) {
		await unmount(framedComponent)
	}
	if (styleObserver) styleObserver.disconnect()
})
</script>

<iframe bind:this={frame} {id} {title} style={frameStyle} allowfullscreen scrolling="no"></iframe>
