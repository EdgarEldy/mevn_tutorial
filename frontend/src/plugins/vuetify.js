import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'

// No `import 'vuetify/styles'` and no manual components/directives import here -
// vite-plugin-vuetify (see vite.config.js) auto-imports both, tree-shaken to only
// what's actually used.
export default createVuetify({
  theme: {
    defaultTheme: 'light',
  },
  icons: {
    defaultSet: 'mdi',
  },
})
