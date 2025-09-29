import type { BotIdentity } from '@smartsupp/websocket-client-visitor'

import { widgetOptions } from '../options'

const getDefaultAiAvatarUrl = () => {
	const { widgetV3Url } = widgetOptions.getOptions()
	return `${widgetV3Url}/assets/images/default-ai-identity.webp`
}

export const processBotIdentity = (identity: BotIdentity): BotIdentity => {
	return {
		...identity,
		avatarUrl: identity.avatarUrl || getDefaultAiAvatarUrl(),
	}
}
