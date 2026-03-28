<script lang="ts">
	import type { Tag } from '$lib/types';

	let { tag, small = false }: { tag: Tag; small?: boolean } = $props();
</script>

<span
	class="inline-flex items-center rounded-full font-medium whitespace-nowrap {small
		? 'px-1.5 py-0.5 text-[10px]'
		: 'px-2 py-0.5 text-xs'}"
	style="background-color: {tag.color}20; color: {tag.color}; border: 1px solid {tag.color}40;"
>
	{tag.name}
</span>
