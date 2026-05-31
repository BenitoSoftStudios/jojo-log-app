<!-- Coded inline SVG animal avatar. No image files or external URLs. -->
<template>
  <svg
    viewBox="0 0 40 40"
    :width="size"
    :height="size"
    aria-hidden="true"
    class="animal-avatar"
    v-html="svgBody"
  />
</template>

<script setup>
import { computed } from 'vue'
import { getAnimalSvg, DEFAULT_ANIMAL } from './animalAvatars.js'

const props = defineProps({
  animalKey: { type: String, default: DEFAULT_ANIMAL },
  size:      { type: [Number, String], default: 40 },
})

const svgBody = computed(() => getAnimalSvg(props.animalKey))
</script>

<style scoped>
.animal-avatar {
  display: inline-block;
  flex-shrink: 0;
  overflow: visible;
}
</style>
