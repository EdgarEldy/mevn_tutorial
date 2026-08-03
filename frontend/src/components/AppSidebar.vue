<script setup>
const links = [
  { to: '/', icon: 'mdi-home', label: 'Home' },
  { to: '/categories', icon: 'mdi-shape', label: 'Categories' },
  { to: '/products', icon: 'mdi-package-variant', label: 'Products' },
  { to: '/customers', icon: 'mdi-account-group', label: 'Customers' },
  { to: '/orders', icon: 'mdi-cart', label: 'Orders' },
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
