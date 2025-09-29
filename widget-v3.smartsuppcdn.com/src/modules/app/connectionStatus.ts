import { derived, get, writable } from 'svelte/store'

import { debounce } from '@/utils/debounce'
import { getHostWindow } from '@/utils/window'

import { warningMessage } from '../flashMessages'
import { t } from '../translations'
import { isClientConnected } from '../websocketClient/store'
import { CONNECTION_STATUS_DELAY } from './constants'
import { ConnectionStatus } from './types'

const isBrowserOffline = writable<boolean>(false)
export const isDisconnected = writable<boolean>(false)
export const disableConnectionStatus = writable<boolean>(false)
// listen to browser internet connection
getHostWindow().addEventListener('offline', () => isBrowserOffline.set(true))
getHostWindow().addEventListener('online', () => isBrowserOffline.set(false))

export const connectionStatus = derived(
	[isClientConnected, isBrowserOffline, disableConnectionStatus],
	([$isClientConnected, $isBrowserOffline, $disableConnectionStatus]) => {
		if ($disableConnectionStatus) return ConnectionStatus.Connected
		return !$isClientConnected || $isBrowserOffline ? ConnectionStatus.Disconnected : ConnectionStatus.Connected
	},
	ConnectionStatus.Connecting,
)

let hideOfflineMessage: undefined | (() => void)
const showOfflineMessage = debounce((offline: boolean) => {
	if (offline && !hideOfflineMessage) {
		hideOfflineMessage = warningMessage(get(t)('error.noInternet'), 0)
	}
	if (!offline && hideOfflineMessage) {
		hideOfflineMessage()
		hideOfflineMessage = undefined
	}
}, CONNECTION_STATUS_DELAY)

connectionStatus.subscribe((status) => {
	if (status === ConnectionStatus.Disconnected) {
		isDisconnected.set(true)
		showOfflineMessage(true)
	}
	if (status === ConnectionStatus.Connected) {
		isDisconnected.set(false)
		showOfflineMessage(false)
	}
})
