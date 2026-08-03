import * as yup from 'yup'

// minLength(8) matches auth.validation.js's isLength({ min: 8 }) exactly; the complexity
// pattern is intentionally stricter than the backend (which has no complexity rule at
// all), a deliberate frontend-only nudge toward stronger passwords, not a mirrored rule.
// Shared by RegisterPage.vue and ResetPasswordPage.vue so the two never drift apart.
export const passwordSchema = yup
  .string()
  .required('Password is required.')
  .min(8, 'Password must be at least 8 characters.')
  .matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
    'Password needs an uppercase letter, a lowercase letter, and a digit.',
  )

export const confirmPasswordSchema = yup
  .string()
  .required('Please confirm your password.')
  .oneOf([yup.ref('password')], 'Passwords do not match.')
