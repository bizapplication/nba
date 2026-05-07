<script setup lang="ts">
definePageMeta({
  layout: false
})

await navigateTo('/home', {
  replace: true,
  redirectCode: 302
})
</script>

<template>
  <div />
</template>
