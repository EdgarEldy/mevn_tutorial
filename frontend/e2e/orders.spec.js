import { expect, test } from '@playwright/test'

// The GraphQL orders/order queries also require auth (see order.resolvers.js's
// requireAuth), same as customers, so there's no seeded-data rendering test possible here.
// GraphQL errors come back as HTTP 200 with an errors array (see graphql.service.js), which
// order.service.js surfaces through the same toast path as every REST feature service.
test.describe('Orders', () => {
  test('shows a real error toast when loading the list without a session', async ({ page }) => {
    await page.goto('/orders')

    await expect(page.getByRole('main').getByText('Orders', { exact: true })).toBeVisible()
    await expect(page.getByText('Authentication required.')).toBeVisible()
  })

  // The customer dropdown is populated via customerService.getAll() (REST), which also
  // requires a session (see customer.routes.js) - so opening the form without one surfaces
  // that 401 through the customer feature's own toast, even before any submit is attempted.
  test('shows an authentication error from the customer dropdown when opening the form without a session', async ({
    page,
  }) => {
    await page.goto('/orders')

    await page.getByRole('button', { name: 'New order' }).click()

    await expect(page.getByText('Authentication token missing.')).toBeVisible()
  })

  test('shows validation errors when submitting without a customer or product', async ({ page }) => {
    await page.goto('/orders')

    await page.getByRole('button', { name: 'New order' }).click()
    await page.getByRole('button', { name: 'Create' }).click()

    await expect(page.getByText('Customer is required.')).toBeVisible()
    await expect(page.getByText('Product is required.')).toBeVisible()
  })
})
