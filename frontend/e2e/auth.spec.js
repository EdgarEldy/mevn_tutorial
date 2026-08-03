import { expect, test } from '@playwright/test'
import { extractTokenFromLatestEmailTo, deleteUserByEmail } from './helpers/auth.js'

test.describe('Auth', () => {
  // One assertion per feature route group, not just categories: router/index.js's
  // protectedRoutes maps beforeEnter: authGuard over four separate route arrays, so a
  // regression that drops just one of them from that map wouldn't be caught by testing
  // only /categories.
  for (const path of ['/categories', '/products', '/customers', '/orders']) {
    test(`redirects to /login when visiting ${path} without a session`, async ({ page }) => {
      await page.goto(path)

      await expect(page).toHaveURL(/\/login$/)
    })
  }

  test('full flow: register, activate via the real mailbox, log in, access a protected route, then log out', async ({ page }) => {
    const email = `e2e-${Date.now()}@example.com`

    await page.goto('/register')
    await page.getByLabel('First name').fill('E2E')
    await page.getByLabel('Last name').fill('Test')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password', { exact: true }).fill('Password123')
    await page.getByLabel('Confirm password').fill('Password123')
    await page.getByRole('button', { name: 'Create account' }).click()

    await expect(page.getByText('Check your email', { exact: true })).toBeVisible()

    const activationToken = await extractTokenFromLatestEmailTo(email, '/auth/activate/')
    await page.goto(`/auth/activate/${activationToken}`)
    await expect(page.getByText('Your account is now active.')).toBeVisible()

    await page.getByRole('link', { name: 'Go to login' }).click()
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password').fill('Password123')
    await page.getByRole('button', { name: 'Login' }).click()

    await expect(page).toHaveURL(/\/$/)

    // Now that there's a real session, the previously-guarded route is reachable.
    await page.goto('/categories')
    await expect(page.getByRole('main').getByText('Categories', { exact: true })).toBeVisible()

    await page.getByRole('button', { name: 'User menu' }).click()
    await page.getByText('Logout').click()

    await expect(page).toHaveURL(/\/login$/)
    await page.goto('/categories')
    await expect(page).toHaveURL(/\/login$/)

    await deleteUserByEmail(email)
  })

  test('full flow: forgot password, reset via the real mailbox, then log in with the new password', async ({ page }) => {
    const email = `e2e-reset-${Date.now()}@example.com`

    await page.goto('/register')
    await page.getByLabel('First name').fill('E2E')
    await page.getByLabel('Last name').fill('Reset')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password', { exact: true }).fill('Password123')
    await page.getByLabel('Confirm password').fill('Password123')
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page.getByText('Check your email', { exact: true })).toBeVisible()

    const activationToken = await extractTokenFromLatestEmailTo(email, '/auth/activate/')
    await page.goto(`/auth/activate/${activationToken}`)
    await expect(page.getByText('Your account is now active.')).toBeVisible()

    await page.goto('/forgot-password')
    await page.getByLabel('Email').fill(email)
    await page.getByRole('button', { name: 'Send reset link' }).click()
    await expect(page.getByText('If an account exists for that email')).toBeVisible()

    const resetToken = await extractTokenFromLatestEmailTo(email, '/auth/reset-password/')
    await page.goto(`/auth/reset-password/${resetToken}`)
    await page.getByLabel('New password', { exact: true }).fill('NewPassword123')
    await page.getByLabel('Confirm new password').fill('NewPassword123')
    await page.getByRole('button', { name: 'Reset password' }).click()

    await expect(page).toHaveURL(/\/login$/)
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password').fill('NewPassword123')
    await page.getByRole('button', { name: 'Login' }).click()

    await expect(page).toHaveURL(/\/$/)

    await deleteUserByEmail(email)
  })
})
