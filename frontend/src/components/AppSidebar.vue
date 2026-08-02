<script setup>
// Orders link is added by its own feature branch (see the README's per-branch task
// lists), not upfront here - that route doesn't exist yet.
const links = [
  { to: '/', icon: 'mdi-home', label: 'Home' },
  { to: '/categories', icon: 'mdi-shape', label: 'Categories' },
  { to: '/products', icon: 'mdi-package-variant', label: 'Products' },
  { to: '/customers', icon: 'mdi-account-group', label: 'Customers' },
]
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
