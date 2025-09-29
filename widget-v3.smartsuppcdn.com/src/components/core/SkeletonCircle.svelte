<script lang="ts">
import Skeleton from './Skeleton.svelte'

type Props = {
	size?: number
}

let { size = 20 }: Props = $props()
</script>

<Skeleton colorScheme="darkGray" width={size} height={size} />
