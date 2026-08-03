import { expect, test } from '@playwright/test'
import { createAdminSession, applySession } from './helpers/auth.js'

// The whole /orders route is now guarded (see router/index.js's protectedRoutes), and
// the GraphQL orders/order queries themselves also require auth (order.resolvers.js),
// so every test here needs a real admin session first - full CRUD e2e coverage was
// deferred to this branch from feature/frontend/orders for exactly this reason.
test.describe('Orders', () => {
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

  test('loads the orders page with a real session', async ({ page }) => {
    await page.goto('/orders')

    await expect(page.getByRole('main').getByText('Orders', { exact: true })).toBeVisible()
  })

  test('shows validation errors when submitting without a customer or product', async ({ page }) => {
    await page.goto('/orders')

    await page.getByRole('button', { name: 'New order' }).click()
    await page.getByRole('button', { name: 'Create' }).click()

    await expect(page.getByText('Customer is required.')).toBeVisible()
    await expect(page.getByText('Product is required.')).toBeVisible()
  })

  test('creates, edits (verifying the live and recalculated total), searches, exports, and deletes an order end to end', async ({
    page,
  }) => {
    await page.goto('/orders')

    await page.getByRole('button', { name: 'New order' }).click()
    await page.locator('[role="combobox"]', { hasText: 'Customer' }).click()
    await page.getByRole('option', { name: 'Alice Smith' }).click()
    await page.locator('[role="combobox"]', { hasText: 'Product' }).click()
    await page.getByRole('option', { name: /Laptop/ }).click()
    await page.getByLabel('Quantity').fill('3')

    await expect(page.getByText('Estimated total: $2999.97')).toBeVisible()
    await page.getByRole('button', { name: 'Create' }).click()

    const row = page.getByRole('row', { name: /Alice Smith.*Laptop.*3.*\$2999\.97/ })
    await expect(row).toBeVisible()

    await row.getByRole('button', { name: 'Edit' }).click()
    await page.getByLabel('Quantity').fill('5')
    await expect(page.getByText('Estimated total: $4999.95')).toBeVisible()
    await page.getByRole('button', { name: 'Save' }).click()

    const updatedRow = page.getByRole('row', { name: /Alice Smith.*Laptop.*5.*\$4999\.95/ })
    await expect(updatedRow).toBeVisible()

    await page.getByLabel('Search orders').fill('Alice')
    await expect(updatedRow).toBeVisible()
    await page.getByLabel('Search orders').fill('')

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Export PDF' }).click(),
    ])
    expect(download.suggestedFilename()).toMatch(/\.pdf$/)

    await updatedRow.getByRole('button', { name: 'Delete' }).click()
    await page.getByRole('button', { name: 'Delete', exact: true }).last().click()

    await expect(page.getByRole('row', { name: /Alice Smith.*Laptop/ })).toHaveCount(0)
  })
})
