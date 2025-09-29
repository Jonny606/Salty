<script lang="ts">
import { onMount, type Snippet } from 'svelte'

type Props = {
	children?: Snippet
}

let { children }: Props = $props()

let loaded = $state(false)

onMount(() => {
	loaded = true
})
</script>

{#if loaded}
	{@render children?.()}
{/if}
