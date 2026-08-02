import { expect, test } from '@playwright/test'

// Unlike categories/products, GET /customers also requires a real session (see
// customer.routes.js), so even the read path 401s without one - there's no seeded-data
// rendering test reachable here. Full CRUD e2e coverage against the real backend belongs
// on feature/frontend/auth, once a real login session is obtainable through the UI.
test.describe('Customers', () => {
  test('shows a real 401 toast when loading the list without a session', async ({ page }) => {
    await page.goto('/customers')

    await expect(page.getByRole('main').getByText('Customers', { exact: true })).toBeVisible()
    await expect(page.getByText('Authentication token missing.')).toBeVisible()
  })

  test('shows a validation error when the email is not valid, entirely client-side', async ({ page }) => {
    let postCount = 0
    page.on('request', (request) => {
      if (request.method() === 'POST' && request.url().includes('/customers')) postCount += 1
    })

    await page.goto('/customers')

    await page.getByRole('button', { name: 'New customer' }).click()
    await page.getByLabel('Email').fill('not-an-email')
    await page.getByRole('button', { name: 'Create' }).click()

    await expect(page.getByText('Must be a valid email address.')).toBeVisible()
    expect(postCount).toBe(0)
  })

  test('shows an authentication error when submitting without a session', async ({ page }) => {
    await page.goto('/customers')

    await page.getByRole('button', { name: 'New customer' }).click()
    await page.getByLabel('First name').fill('Jane')
    await page.getByRole('button', { name: 'Create' }).click()

    await expect(page.getByText('Authentication token missing.').last()).toBeVisible()
  })
})
