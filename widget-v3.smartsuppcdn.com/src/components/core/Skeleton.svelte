<script lang="ts">
import { px } from '@/modules/frames'
import { isNumber } from '@/utils/isNumber'

type SkeletonColorScheme = 'gray' | 'darkGray'

type Props = {
	height?: number
	width?: string | number
	colorScheme?: SkeletonColorScheme
	roundedStyle?: string
}

let { height = 20, width = '100%', colorScheme = 'gray', roundedStyle = 'rounded-full' }: Props = $props()
const skeletonClass = `${roundedStyle} animate-pulse`
</script>

<div
	class={[skeletonClass, colorScheme === 'gray' && 'bg-gray-200', colorScheme === 'darkGray' && 'bg-gray-300']}
	style:height={px(height)}
	style:width={isNumber(width) ? px(width) : width}
></div>
