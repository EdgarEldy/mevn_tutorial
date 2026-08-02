import { expect, test } from '@playwright/test'

// Same reasoning as categories.spec.js: product mutation routes require a real admin
// session, and there's no login UI until feature/frontend/auth, so this covers what's
// reachable without one. Full CRUD e2e coverage belongs on the auth branch.
test.describe('Products', () => {
  test('loads and displays the seeded products with their category from the real backend', async ({ page }) => {
    await page.goto('/products')

    await expect(page.getByRole('main').getByText('Products', { exact: true })).toBeVisible()
    await expect(page.getByRole('row', { name: /Laptop.*Electronics.*\$999\.99/ })).toBeVisible()
  })

  test('shows validation errors when submitting empty required fields', async ({ page }) => {
    await page.goto('/products')

    await page.getByRole('button', { name: 'New product' }).click()
    await page.getByRole('button', { name: 'Create' }).click()

    await expect(page.getByText('Product name is required.')).toBeVisible()
    await expect(page.getByText('Unit price is required.')).toBeVisible()
    await expect(page.getByText('Category is required.')).toBeVisible()
  })

  test('shows an authentication error when submitting without a session', async ({ page }) => {
    await page.goto('/products')

    await page.getByRole('button', { name: 'New product' }).click()
    await page.getByLabel('Product name').fill(`E2E Product ${Date.now()}`)
    await page.getByLabel('Unit price').fill('9.99')
    await page.locator('[role="combobox"]', { hasText: 'Category' }).click()
    await page.getByRole('option').first().click()
    await page.getByRole('button', { name: 'Create' }).click()

    await expect(page.getByText('Authentication token missing.')).toBeVisible()
  })
})
