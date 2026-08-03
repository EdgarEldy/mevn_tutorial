import { expect, test } from '@playwright/test'
import { createAdminSession, applySession } from './helpers/auth.js'

// The whole /customers route is now guarded (see router/index.js's protectedRoutes), so
// every test here needs a real admin session first - full CRUD e2e coverage was
// deferred to this branch from feature/frontend/customers for exactly this reason.
test.describe('Customers', () => {
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

  test('loads and displays the seeded customers from the real backend', async ({ page }) => {
    await page.goto('/customers')

    await expect(page.getByRole('main').getByText('Customers', { exact: true })).toBeVisible()
    await expect(page.getByRole('row', { name: /Alice Smith/ })).toBeVisible()
  })

  test('shows a validation error when the email is not valid, entirely client-side', async ({ page }) => {
    await page.goto('/customers')

    await page.getByRole('button', { name: 'New customer' }).click()
    await page.getByLabel('Email').fill('not-an-email')
    await page.getByRole('button', { name: 'Create' }).click()

    await expect(page.getByText('Must be a valid email address.')).toBeVisible()
  })

  test('creates, edits, searches, exports, and deletes a customer end to end, stripping blank fields', async ({
    page,
  }) => {
    const firstName = `Manual${Date.now()}`
    const updatedFirstName = `${firstName}Edited`

    await page.goto('/customers')

    // Only first_name and email filled in - last_name/telephone/address left blank, to
    // verify stripBlankFields() keeps the backend from rejecting an empty-string email.
    await page.getByRole('button', { name: 'New customer' }).click()
    await page.getByLabel('First name').fill(firstName)
    await page.getByLabel('Email').fill(`${firstName}@example.com`)
    await page.getByRole('button', { name: 'Create' }).click()

    const row = page.getByRole('row', { name: new RegExp(`${firstName}.*${firstName}@example.com`) })
    await expect(row).toBeVisible()
    await expect(row).toContainText('N/A')

    await row.getByRole('button', { name: 'Edit' }).click()
    await page.getByLabel('First name').fill(updatedFirstName)
    await page.getByLabel('Telephone').fill('555-0100')
    await page.getByRole('button', { name: 'Save' }).click()

    const updatedRow = page.getByRole('row', { name: new RegExp(`${updatedFirstName}.*555-0100`) })
    await expect(updatedRow).toBeVisible()

    await page.getByLabel('Search customers').fill(updatedFirstName)
    await expect(updatedRow).toBeVisible()
    await page.getByLabel('Search customers').fill('')

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Export PDF' }).click(),
    ])
    expect(download.suggestedFilename()).toMatch(/\.pdf$/)

    await updatedRow.getByRole('button', { name: 'Delete' }).click()
    await page.getByRole('button', { name: 'Delete', exact: true }).last().click()

    await expect(page.getByRole('row', { name: new RegExp(updatedFirstName) })).toHaveCount(0)
  })
})
