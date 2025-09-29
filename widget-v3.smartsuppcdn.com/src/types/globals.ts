import type { ISmartsuppWidget, SmartsuppWidgetOptions } from '@smartsupp/widget-loader-types'
import type { Component } from 'svelte'

declare global {
	interface Window {
		widget?: ISmartsuppWidget
		dataLayer: unknown[]
		ga?: ((callback: unknown) => void) & {
			getAll: () => Tracker[]
		}
		google_tag_manager?: {
			[key: string]: object
		}
		gtag?: Gtag.Gtag
	}
}

export type Tracker = {
	get: (property: string) => string
}

export type SvelteComponentModule = {
	default: Component
}

export type AvatarSize = 'sm' | 'md' | 'lg'

export type Dictionary<T> = {
	[key: string]: T
}

export interface Dimensions {
	width: number
	height: number
}

export type SmartsuppPackage = SmartsuppWidgetOptions['packageName']

export type Icon = Component

export enum LoadState {
	Initialized,
	Loading,
	Success,
	Error,
}
