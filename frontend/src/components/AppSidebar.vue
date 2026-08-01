<script setup>
// Products/customers/orders links are added by their own feature branches (see the
// README's per-branch task lists), not all upfront here - those routes don't exist yet.
const links = [
  { to: '/', icon: 'mdi-home', label: 'Home' },
  { to: '/categories', icon: 'mdi-shape', label: 'Categories' },
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
