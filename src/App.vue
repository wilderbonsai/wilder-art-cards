<template>
  <div id="app">
    <CardGenerator/>
  </div>
</template>

<script>
import HelloWorld from './components/HelloWorld.vue'
import CardGenerator from './components/CardGenerator.vue'

export default {
  name: 'app',
  components: {
    HelloWorld,
    CardGenerator
  }
}
</script>

<style>
#app {
}
</style>
