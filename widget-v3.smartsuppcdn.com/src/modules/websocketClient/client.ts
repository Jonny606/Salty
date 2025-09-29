import { SocketMock, type SocketMockOptions } from '@smartsupp/websocket-client-core'
import VisitorClient from '@smartsupp/websocket-client-visitor'

import { printError } from '@/utils/console'

import { widgetOptions, widgetOptions as widgetOptionsProvider } from '../options'
import { getServerUrl, getVisitorClientData } from './utils'
import {
	onAccountUpdatedEvent,
	onAgentStatusUpdatedEvent,
	onAgentUpdatedEvent,
	onChatAgentAssigned,
	onChatAgentJoined,
	onChatAgentLeft,
	onChatAgentTyping,
	onChatAgentUnassigned,
	onChatClosedEvent,
	onChatContactReadEvent,
	onChatMessageDeletedEvent,
	onChatMessageReceivedEvent,
	onChatMessageUpdatedEvent,
	onChatOpenedEvent,
	onChatRated,
	onChatRatingCancelled,
	onChatRatingSuggested,
	onChatServedEvent,
	onChatUpdated,
	onChatVisitorClosedEvent,
	onContactAcquired,
	onDisconnectEvent,
	onErrorEvent,
	onIdentityStatusUpdatedEvent,
	onInitializedEvent,
	onTranscriptPdf,
	onVisitorUpdatedEvent,
} from './websocketEventHandlers'

const createClient = async (data: VisitorClient.ConnectData): Promise<VisitorClient> => {
	const widgetOptions = await widgetOptionsProvider.awaitOptions()
	const options = {
		data,
		connection: {
			url: getServerUrl(),
			socket: widgetOptions.mock ? new SocketMock(widgetOptions.mock) : undefined,
			balancerUrl: widgetOptions.balancerUrl,
			options: {
				path: '/socket',
				autoConnect: false,
				reconnection: true,
			},
		},
	}

	return new VisitorClient(options)
}

const createVisitorClientProvider = () => {
	let visitorClient: VisitorClient | null = null

	const isInitialized = (): boolean => {
		return !!visitorClient
	}

	const getClient = (): VisitorClient => {
		if (!visitorClient) throw new Error('Visitor client is not initialized')
		return visitorClient
	}

	const initClient = async (reloadWithReset?: boolean) => {
		const clientData = await getVisitorClientData(reloadWithReset)
		visitorClient = await createClient(clientData)
		if (!visitorClient) return

		initEvents(visitorClient)

		await visitorClient.connect().catch((error) => {
			printError('Failed connect to server.', error)
		})
	}

	const reloadClient = async (mockData?: SocketMockOptions, reloadWithReset?: boolean) => {
		await visitorClient?.disconnect()
		if (mockData) widgetOptions.updateOptions({ mock: mockData })
		await initClient(reloadWithReset)
	}

	return Object.freeze({ getClient, initClient, reloadClient, isInitialized })
}

const initEvents = (client: VisitorClient) => {
	// General events
	client.on('initialized', onInitializedEvent)
	client.on('error', onErrorEvent)

	// Connection events
	client.on('disconnect', onDisconnectEvent)
	// client.connection.on('reconnecting', onReconnectEvent)
	// client.connection.on('reconnect', onReconnectEvent)

	// Chat status events
	client.on('chat.opened', onChatOpenedEvent)
	client.on('chat.served', onChatServedEvent)
	client.on('chat.closed', onChatClosedEvent)
	client.on('chat.visitor_closed', onChatVisitorClosedEvent)

	// Chat events
	client.on('chat.updated', onChatUpdated)
	client.on('chat.message_received', onChatMessageReceivedEvent)
	client.on('chat.message_updated', onChatMessageUpdatedEvent)
	client.on('chat.message_deleted', onChatMessageDeletedEvent)
	client.on('chat.agent_joined', onChatAgentJoined)
	client.on('chat.agent_left', onChatAgentLeft)
	client.on('chat.agent_assigned', onChatAgentAssigned)
	client.on('chat.agent_unassigned', onChatAgentUnassigned)
	client.on('chat.agent_typing', onChatAgentTyping)
	client.on('chat.contact_read', onChatContactReadEvent)
	client.on('chat.rated', onChatRated)
	client.on('chat.rating_suggested', onChatRatingSuggested)
	client.on('chat.rating_cancelled', onChatRatingCancelled)
	client.on('chat.transcript_pdf', onTranscriptPdf)

	// Agent events
	client.on('agent.updated', onAgentUpdatedEvent)
	client.on('agent.status_updated', onAgentStatusUpdatedEvent)

	// Account events
	client.on('account.updated', onAccountUpdatedEvent)

	// Visitor events
	client.on('visitor.updated', onVisitorUpdatedEvent)

	// Contact events
	client.on('contact.acquired', onContactAcquired)

	//Identity events
	client.on('identity.status_updated', onIdentityStatusUpdatedEvent)
}

export const visitorClientProvider = createVisitorClientProvider()
