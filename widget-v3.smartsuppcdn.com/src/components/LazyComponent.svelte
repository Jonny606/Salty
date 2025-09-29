<script module lang="ts">
export type ComponentLoader = () => Promise<SvelteComponentModule>

export const loadedMap: Map<ComponentLoader, Component> = new Map()

const loadComponent = async (loader: ComponentLoader) => {
	const component = (await loader()).default
	loadedMap.set(loader, component)
	return component
}
</script>

<script lang="ts">
import type { Component, Snippet } from 'svelte'
import { onMount } from 'svelte'

import { LoadState, type SvelteComponentModule } from '@/types'

type Props = {
	delay?: number
	loader: ComponentLoader
	loading: Snippet
	error?: Snippet<[{ error?: Error }]>
}

const { delay = 200, loader, error, loading }: Props = $props()

let loadState = $state(LoadState.Initialized)
let component: Component | undefined = $state()
let loadError: Error | undefined = $state()
let loadTimer: number | undefined = $state()

const LoadedComponent = $derived(component)

const clearTimer = () => {
	window.clearTimeout(loadTimer)
}

const load = async () => {
	clearTimer()

	loadError = undefined
	component = undefined

	if (delay > 0) {
		loadState = LoadState.Initialized
		loadTimer = window.setTimeout(() => {
			loadState = LoadState.Loading
		}, delay)
	} else {
		loadState = LoadState.Loading
	}

	try {
		component = await loadComponent(loader)
		loadState = LoadState.Success
	} catch (e) {
		loadState = LoadState.Error
		if (e instanceof Error) {
			loadError = e
		} else {
			throw e
		}
	}

	clearTimer()
}

if (loadedMap.has(loader)) {
	loadState = LoadState.Success
	component = loadedMap.get(loader)
} else {
	onMount(() => {
		void load()
	})
}
</script>

{#if loadState === LoadState.Error && error}
	{@render error({ error: loadError })}
{:else if loadState === LoadState.Loading}
	{@render loading()}
{:else if loadState === LoadState.Success}
	<LoadedComponent />
{/if}
