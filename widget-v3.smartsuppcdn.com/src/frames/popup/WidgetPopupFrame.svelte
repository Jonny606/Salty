<script lang="ts">
import { fly } from 'svelte/transition'

import Frame from '@/components/Frame.svelte'
import { testIds } from '@/constants'
import { shouldRenderPopupFrame } from '@/modules/app'
import { getIframeDefaultStyles, hasPopupFrameHover, popupFrameHeight, popupFrameStyle, px } from '@/modules/frames'
import { widgetOptions } from '@/modules/options'

import WidgetPopupLazy from './WidgetPopupLazy.svelte'

let containerRef: HTMLDivElement | undefined = $state()

const resizeContainer = (height: number) => {
	if (containerRef) containerRef.style.maxHeight = `${height}px`
}

const { widgetBlockingOptions } = widgetOptions.getOptions()

$effect(() => {
	containerRef && resizeContainer($popupFrameHeight)
})

let boxShadowAlpha: number = $derived($hasPopupFrameHover ? 0.28 : 0.16)
</script>

{#if $shouldRenderPopupFrame}
	<div
		bind:this={containerRef}
		use:popupFrameStyle
		style="height: calc(100% - 40px); border-radius: 12px; transition: box-shadow 0.2s ease-in-out; transition: max-height 250ms ease-in-out"
		style:width={px(300)}
		style:overflow="hidden"
		style:box-shadow={`rgba(0, 0, 0, ${
			widgetBlockingOptions?.limitShadow ? '0.2) 0px 3px 12px' : `${boxShadowAlpha}) 0px 3px 16px`
		}`}
		in:fly={{ y: 20, delay: 300, duration: 400 }}
		out:fly={{ y: 10, duration: 400 }}
		data-testid={testIds.widgetPopupFrame}
	>
		<Frame
			component={WidgetPopupLazy}
			id={testIds.widgetPopupFrame}
			title="Smartsupp widget popup"
			frameStyle={getIframeDefaultStyles()}
		/>
	</div>
{/if}
