<script lang="ts">
import { onDestroy, onMount, type Snippet } from 'svelte'

import { getSmartsuppWidget } from '@/modules/options'
import { getHostDocument, getHostWindow } from '@/utils/window'

type Props = {
	children?: Snippet
}

let { children }: Props = $props()

let ref: HTMLDivElement | null = $state(null)

const chatId = `${
	getHostWindow().SMARTSUPP_AUTOCREATE !== false ? 'smartsupp' : getSmartsuppWidget(window).id
}-widget-container`

onMount(() => {
	if (ref) getHostDocument().body.appendChild(ref)
})

onDestroy(() => {
	getHostDocument().getElementById(chatId)?.remove()
})
</script>

<!-- Portal has to be wrapped in extra element: https://github.com/sveltejs/svelte/issues/3088#issuecomment-641749316  -->
<div id={chatId} bind:this={ref}>
	{@render children?.()}
</div>
