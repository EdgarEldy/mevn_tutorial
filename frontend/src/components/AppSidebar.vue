<script setup>
// Categories/products/customers/orders links are added one at a time by their own
// feature branches (see the README's per-branch task lists), not all upfront here -
// none of those routes exist yet, so linking to them now would just produce Vue
// Router "No match found" warnings.
const links = [{ to: '/', icon: 'mdi-home', label: 'Home' }]
</script>

<template>
  <div class="pa-4 text-h6">MEVN Tutorial</div>
  <v-list nav>
    <v-list-item
      v-for="link in links"
      :key="link.to"
      :to="link.to"
      :prepend-icon="link.icon"
      :title="link.label"
      exact
    />
  </v-list>
</template>
