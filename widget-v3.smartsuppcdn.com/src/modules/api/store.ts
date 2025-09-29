import { writable } from 'svelte/store'

import type { WebsocketVisitorClient } from './types'

export const apiProps = writable<Partial<WebsocketVisitorClient.Identity>>({})

export const updateApiProps = <TName extends keyof WebsocketVisitorClient.UpdateValues>(
	name: TName,
	value: WebsocketVisitorClient.UpdateValues[TName],
) => {
	apiProps.update((props) => ({ ...props, [name]: value }))
}
