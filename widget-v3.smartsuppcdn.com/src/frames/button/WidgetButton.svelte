<script lang="ts">
import { testIds } from '@/constants'
import { openMessengerFrame } from '@/modules/app'
import { isWidgetButtonBubble } from '@/modules/frames'
import { Key } from '@/modules/textarea'
import { t } from '@/modules/translations'

import WidgetButtonBubble from './WidgetButtonBubble.svelte'
import WidgetButtonGreeting from './WidgetButtonGreeting.svelte'
import WidgetButtonOnlineBadge from './WidgetButtonOnlineBadge.svelte'
import WidgetButtonUnreadMessagesBadge from './WidgetButtonUnreadMessagesBadge.svelte'
</script>

<div class="h-full w-full relative flex justify-end border-rounded-full">
	<div
		aria-label={$t('ariaLabel.openChat')}
		role="button"
		tabindex={0}
		onclick={() => openMessengerFrame()}
		onkeypress={(e) => e.key === Key.Enter && openMessengerFrame()}
		class="group flex-center w-full bg-primary-gradient bg-primary-gradient-hover text-primary-content rounded-full overflow-hidden cursor-pointer content-focus-secondary"
		data-testid={testIds.widgetButton}
	>
		{#if $isWidgetButtonBubble}
			<WidgetButtonBubble />
		{:else}
			<WidgetButtonGreeting />
		{/if}
		<WidgetButtonOnlineBadge />
	</div>
	<WidgetButtonUnreadMessagesBadge />
</div>
