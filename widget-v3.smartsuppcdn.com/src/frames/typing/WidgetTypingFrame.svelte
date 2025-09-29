<script lang="ts">
import { fly } from 'svelte/transition'

import Frame from '@/components/Frame.svelte'
import { testIds } from '@/constants'
import { shouldRenderTypingFrame } from '@/modules/app'
import { getIframeDefaultStyles, px, typingFrameStyle } from '@/modules/frames'
import { widgetOptions } from '@/modules/options'

import WidgetTyping from './WidgetTyping.svelte'

const { widgetBlockingOptions } = widgetOptions.getOptions()
</script>

{#if $shouldRenderTypingFrame}
	<div
		use:typingFrameStyle
		style={`box-shadow: rgba(0, 0, 0, 0.2) ${
			widgetBlockingOptions?.limitShadow ? '0px 3px 12px' : '0px 3px 16px'
		}; border-radius: 24px;`}
		style:height={px(40)}
		style:width={px(70)}
		style:overflow="hidden"
		in:fly={{ y: 20, delay: 300, duration: 400 }}
		out:fly={{ y: 10, duration: 250 }}
		data-testid={testIds.widgetTypingFrame}
	>
		<Frame
			component={WidgetTyping}
			id={testIds.widgetTypingFrame}
			title="Smartsupp widget typing"
			frameStyle={getIframeDefaultStyles()}
		/>
	</div>
{/if}
