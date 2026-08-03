<script setup>
import { ref } from 'vue'
import { useForm } from 'vee-validate'
import * as yup from 'yup'
import authService from '../services/auth.service'
import { passwordSchema, confirmPasswordSchema } from '../validators/password.schema'

const submitting = ref(false)
const registered = ref(null)

const schema = yup.object({
  first_name: yup.string().required('First name is required.').max(50, 'First name must be 50 characters or fewer.'),
  last_name: yup.string().required('Last name is required.').max(100, 'Last name must be 100 characters or fewer.'),
  email: yup.string().required('Email is required.').email('Enter a valid email address.'),
  password: passwordSchema,
  confirmPassword: confirmPasswordSchema,
})

const { handleSubmit, defineField, errors } = useForm({ validationSchema: schema })
const [firstName, firstNameAttrs] = defineField('first_name')
const [lastName, lastNameAttrs] = defineField('last_name')
const [email, emailAttrs] = defineField('email')
const [password, passwordAttrs] = defineField('password')
const [confirmPassword, confirmPasswordAttrs] = defineField('confirmPassword')

// The backend emails the activation link directly (see auth.service.js's register()),
// so this only has to show a confirmation once registration succeeds; it never sees
// the activation token itself.
const onSubmit = handleSubmit(async (values) => {
  const { confirmPassword: _confirmPassword, ...payload } = values
  submitting.value = true
  try {
    registered.value = await authService.register(payload)
  } catch {
    // The service already toasted the error.
  } finally {
    submitting.value = false
  }
})
</script>

<template>
  <v-container class="fill-height d-flex align-center justify-center">
    <v-card max-width="420" width="100%">
      <template v-if="registered">
        <v-card-title>Check your email</v-card-title>
        <v-card-text>
          <p>We've sent an activation link to <strong>{{ registered.email }}</strong>. Follow it to activate your account.</p>
          <RouterLink to="/login">Back to login</RouterLink>
        </v-card-text>
      </template>
      <template v-else>
        <v-card-title>Create an account</v-card-title>
        <form @submit.prevent="onSubmit">
          <v-card-text>
            <v-text-field
              v-model="firstName"
              v-bind="firstNameAttrs"
              label="First name"
              maxlength="50"
              :error-messages="errors.first_name ? [errors.first_name] : []"
            />
            <v-text-field
              v-model="lastName"
              v-bind="lastNameAttrs"
              label="Last name"
              maxlength="100"
              :error-messages="errors.last_name ? [errors.last_name] : []"
            />
            <v-text-field
              v-model="email"
              v-bind="emailAttrs"
              label="Email"
              type="email"
              :error-messages="errors.email ? [errors.email] : []"
            />
            <v-text-field
              v-model="password"
              v-bind="passwordAttrs"
              label="Password"
              type="password"
              :error-messages="errors.password ? [errors.password] : []"
            />
            <v-text-field
              v-model="confirmPassword"
              v-bind="confirmPasswordAttrs"
              label="Confirm password"
              type="password"
              :error-messages="errors.confirmPassword ? [errors.confirmPassword] : []"
            />
          </v-card-text>
          <v-card-actions class="flex-column align-stretch px-4 pb-4">
            <v-btn color="primary" variant="flat" type="submit" :loading="submitting" block>Create account</v-btn>
            <RouterLink to="/login" class="text-body-2 mt-4">Already have an account?</RouterLink>
          </v-card-actions>
        </form>
      </template>
    </v-card>
  </v-container>
</template>
