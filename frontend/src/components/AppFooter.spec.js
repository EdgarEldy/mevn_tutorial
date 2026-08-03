import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import { VApp } from 'vuetify/components'
import AppFooter from './AppFooter.vue'

// VFooter needs Vuetify's layout system, which only exists inside a mounted VApp.
// VApp must be imported/registered explicitly here: vite-plugin-vuetify's auto-import
// only rewrites .vue SFCs at transform time, and this inline test-host template isn't one.
const TestHost = {
  components: { VApp, AppFooter },
  template: '<v-app><AppFooter /></v-app>',
}

describe('AppFooter', () => {
  it('renders the current year and app name', () => {
    const wrapper = mount(TestHost, { global: { plugins: [createVuetify()] } })
    const year = new Date().getFullYear().toString()

    expect(wrapper.text()).toContain(year)
    expect(wrapper.text()).toContain('MEVN Tutorial')
  })
})
