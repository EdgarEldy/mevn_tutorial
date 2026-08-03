import { expect, test } from '@playwright/test'

test.describe('App shell', () => {
  test('loads the home page inside the Vuetify shell', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('.v-navigation-drawer')).toBeVisible()
    await expect(page.locator('.v-app-bar')).toBeVisible()
    await expect(page.locator('.v-footer')).toBeVisible()
    await expect(page.getByText('Welcome')).toBeVisible()
  })

  test('toggles the navigation drawer from the topbar menu button', async ({ page }) => {
    await page.goto('/')

    const drawer = page.locator('.v-navigation-drawer')
    await expect(drawer).toHaveClass(/v-navigation-drawer--active/)

    await page.getByRole('button', { name: 'Toggle navigation' }).click()
    await expect(drawer).not.toHaveClass(/v-navigation-drawer--active/)
  })
})
