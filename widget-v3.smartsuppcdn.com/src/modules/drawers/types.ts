import type { Component } from 'svelte'

export enum DrawerId {
	Options,
	GdprAndPrivacy,
	AuthForm,
	CloseChat,
	ChatRating,
	TicketForm,
}

export type Drawers = Record<DrawerId, Component>
