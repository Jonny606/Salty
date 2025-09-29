<script lang="ts">
import { onMount } from 'svelte'
import { get } from 'svelte/store'

import Portal from '@/components/Portal.svelte'
import ButtonFrame from '@/frames/button/WidgetButtonFrame.svelte'
import MessengerFrame from '@/frames/messenger/WidgetMessengerFrame.svelte'
import PopupFrame from '@/frames/popup/WidgetPopupFrame.svelte'
import TypingFrame from '@/frames/typing/WidgetTypingFrame.svelte'
import {
	isMessengerFrameOpen,
	openPopupFrame,
	useMobileBackButtonHandling,
	useWatchDocumentVisibility,
} from '@/modules/app'
import { lastUnreadMessage } from '@/modules/messages'
import { initTranslations } from '@/modules/translations'
import { visitorClientProvider } from '@/modules/websocketClient'
import { getHostWindow } from '@/utils/window'

import MediaPreviewFrame from './frames/mediaPreview/WidgetMediaPreviewFrame.svelte'
import { isMobileDevice } from './modules/device'

onMount(() => {
	const initWidget = async () => {
		await initTranslations()
		await visitorClientProvider.initClient()
	}

	void initWidget()
})

// Handles opening popup frame in case there is an unread message after reload
$effect(() => {
	if ($lastUnreadMessage && !$isMessengerFrameOpen) openPopupFrame()
})

useWatchDocumentVisibility(getHostWindow())
if (get(isMobileDevice)) useMobileBackButtonHandling(getHostWindow())
</script>

<Portal>
	<TypingFrame />
	<PopupFrame />
	<ButtonFrame />
	<MessengerFrame />
	<MediaPreviewFrame />
</Portal>
