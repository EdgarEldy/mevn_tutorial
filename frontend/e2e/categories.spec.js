import { expect, test } from '@playwright/test'
import { createAdminSession, applySession } from './helpers/auth.js'

// The whole /categories route is now guarded (see router/index.js's protectedRoutes),
// so every test here needs a real admin session first - full CRUD e2e coverage was
// deferred to this branch from feature/frontend/categories for exactly this reason.
test.describe('Categories', () => {
  let session

  test.beforeAll(async () => {
    session = await createAdminSession()
  })

  test.afterAll(async () => {
    await session.cleanup()
  })

  test.beforeEach(async ({ page }) => {
    await applySession(page, session)
  })

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

  test('creates, edits, searches, exports, and deletes a category end to end', async ({ page }) => {
    const name = `E2E Category ${Date.now()}`
    const updatedName = `${name} (updated)`

    await page.goto('/categories')

    await page.getByRole('button', { name: 'New category' }).click()
    await page.getByLabel('Category name').fill(name)
    await page.getByRole('button', { name: 'Create' }).click()

    const row = page.getByRole('row', { name: new RegExp(name) })
    await expect(row).toBeVisible()

    await row.getByRole('button', { name: 'Edit' }).click()
    await page.getByLabel('Category name').fill(updatedName)
    await page.getByRole('button', { name: 'Save' }).click()

    const updatedRow = page.getByRole('row', { name: new RegExp(updatedName.replace(/[()]/g, '\\$&')) })
    await expect(updatedRow).toBeVisible()

    await page.getByLabel('Search categories').fill(updatedName)
    await expect(updatedRow).toBeVisible()
    await expect(page.getByRole('row', { name: /^Electronics/ })).toHaveCount(0)
    await page.getByLabel('Search categories').fill('')

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Export PDF' }).click(),
    ])
    expect(download.suggestedFilename()).toMatch(/\.pdf$/)

    await updatedRow.getByRole('button', { name: 'Delete' }).click()
    await page.getByRole('button', { name: 'Delete', exact: true }).last().click()

    await expect(page.getByRole('row', { name: new RegExp(updatedName.replace(/[()]/g, '\\$&')) })).toHaveCount(0)
  })
})
