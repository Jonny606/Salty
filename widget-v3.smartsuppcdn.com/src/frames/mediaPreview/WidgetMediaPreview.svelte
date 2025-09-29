<script lang="ts">
import { fly } from 'svelte/transition'
import IconClose from 'virtual:icons/lucide/x'

import IconButton from '@/components/core/IconButton.svelte'
import { PreviewedMediaType } from '@/modules/app'
import { previewedMedia } from '@/modules/app/mediaPreview'
import { isDesktop } from '@/modules/device'
import { t } from '@/modules/translations'

let overlaySourceAllowed = $derived($isDesktop)

const closePreview = (source: 'overlay' | 'button') => {
	if (source === 'overlay' && !overlaySourceAllowed) return
	previewedMedia.set(null)
}
</script>

<div
	class="w-full h-full flex flex-col"
	in:fly={{ y: 20, delay: 300, duration: 400 }}
	out:fly={{ y: 10, duration: 250 }}
>
	<div class="flex-shrink flex flex-row w-full bg-black text-white">
		<div class="flex-grow flex items-center text-md px-4 overflow-hidden">
			<span class="whitespace-nowrap text-ellipsis overflow-hidden">{$previewedMedia?.attachment.fileName}</span>
		</div>
		<div class="flex-shrink">
			<IconButton
				onClick={() => closePreview('button')}
				icon={IconClose}
				iconDescription={$t('tooltip.close')}
				size="xl"
			/>
		</div>
	</div>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class={['relative overflow-hidden flex-grow flex items-center bg-black/80 z-10', $isDesktop ? 'p-8' : 'p-4']}
		onclick={() => closePreview('overlay')}
		onkeypress={() => {}}
	>
		{#if $previewedMedia?.type === PreviewedMediaType.Image}
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<img
				class="m-auto max-h-full max-w-full select-none bg-black"
				width="auto"
				height="auto"
				src={$previewedMedia?.attachment.url}
				alt={$previewedMedia?.attachment.fileName}
				onclick={(e) => e.stopPropagation()}
				onkeypress={() => {}}
			/>
		{:else if $previewedMedia?.type === PreviewedMediaType.Video}
			<video
				controls
				class="m-auto max-h-full max-w-full bg-black object-contain"
				onclick={(e) => e.stopPropagation()}
				onkeypress={() => {}}
				autoplay={true}
				loop={true}
			>
				<track kind="captions" />
				<source src={$previewedMedia.attachment.url} />
			</video>
		{/if}
	</div>
</div>
