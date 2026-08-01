import { expect, test } from '@playwright/test'

// Categories' create/update/delete routes require a real admin session (protect +
// authorize('admin') on the backend), and there's no login UI to obtain one until
// feature/frontend/auth. Full CRUD e2e coverage against the real backend belongs there;
// this branch's e2e coverage is limited to what's reachable without a session. The
// create/update/delete flow itself is already covered against a mocked service in
// CategoriesPage.spec.js.
test.describe('Categories', () => {
  test('loads and displays the seeded categories from the real backend', async ({ page }) => {
    await page.goto('/categories')

    await expect(page.getByRole('main').getByText('Categories', { exact: true })).toBeVisible()
    await expect(page.getByRole('row', { name: /Electronics/ })).toBeVisible()
  })

  test('shows a validation error when submitting an empty name', async ({ page }) => {
    await page.goto('/categories')

    await page.getByRole('button', { name: 'New category' }).click()
    await page.getByRole('button', { name: 'Create' }).click()

    await expect(page.getByText('Category name is required.')).toBeVisible()
  })

  test('shows an authentication error when submitting without a session', async ({ page }) => {
    await page.goto('/categories')

    await page.getByRole('button', { name: 'New category' }).click()
    await page.getByLabel('Category name').fill(`E2E Category ${Date.now()}`)
    await page.getByRole('button', { name: 'Create' }).click()

    await expect(page.getByText('Authentication token missing.')).toBeVisible()
  })
})
