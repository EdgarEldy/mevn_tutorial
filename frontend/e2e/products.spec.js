import { expect, test } from '@playwright/test'
import { createAdminSession, applySession } from './helpers/auth.js'

// The whole /products route is now guarded (see router/index.js's protectedRoutes), so
// every test here needs a real admin session first - full CRUD e2e coverage was
// deferred to this branch from feature/frontend/products for exactly this reason.
test.describe('Products', () => {
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

  test('creates, edits (including the category dropdown), searches, exports, and deletes a product end to end', async ({
    page,
  }) => {
    const name = `Manual Verify Product ${Date.now()}`
    const updatedName = `${name} (edited)`

    await page.goto('/products')
    await expect(page.getByRole('row', { name: /Laptop/ })).toBeVisible()

    await page.getByRole('button', { name: 'New product' }).click()
    await page.getByLabel('Product name').fill(name)
    await page.getByLabel('Unit price').fill('42.50')
    await page.locator('[role="combobox"]', { hasText: 'Category' }).click()
    await page.getByRole('option', { name: 'Electronics' }).click()
    await page.getByRole('button', { name: 'Create' }).click()

    const row = page.getByRole('row', { name: new RegExp(`${name}.*Electronics.*\\$42\\.50`) })
    await expect(row).toBeVisible()

    await row.getByRole('button', { name: 'Edit' }).click()
    await page.getByLabel('Product name').fill(updatedName)
    await page.getByLabel('Unit price').fill('55.00')
    await page.getByRole('button', { name: 'Save' }).click()

    const updatedRow = page.getByRole('row', { name: new RegExp(`${updatedName.replace(/[()]/g, '\\$&')}.*\\$55\\.00`) })
    await expect(updatedRow).toBeVisible()

    await page.getByLabel('Search products').fill(updatedName)
    await expect(updatedRow).toBeVisible()
    await expect(page.getByRole('row', { name: /^Laptop/ })).toHaveCount(0)
    await page.getByLabel('Search products').fill('')

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
