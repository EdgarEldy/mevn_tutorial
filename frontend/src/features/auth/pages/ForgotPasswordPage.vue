<script setup>
import { ref } from 'vue'
import { useForm } from 'vee-validate'
import * as yup from 'yup'
import authService from '../services/auth.service'

const submitting = ref(false)
const submitted = ref(false)

const schema = yup.object({
  email: yup.string().required('Email is required.').email('Enter a valid email address.'),
})

const { handleSubmit, defineField, errors } = useForm({ validationSchema: schema })
const [email, emailAttrs] = defineField('email')

// The backend sends the same generic response whether or not the email exists (see
// auth.service.js's forgotPassword()), and only actually emails a reset link when the
// account does exist, so this page never sees a token either way.
const onSubmit = handleSubmit(async (values) => {
  submitting.value = true
  try {
    await authService.forgotPassword(values)
    submitted.value = true
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
      <template v-if="submitted">
        <v-card-title>Check your email</v-card-title>
        <v-card-text>
          <p>If an account exists for that email, a password reset link has been sent.</p>
          <RouterLink to="/login">Back to login</RouterLink>
        </v-card-text>
      </template>
      <template v-else>
        <v-card-title>Forgot password</v-card-title>
        <form @submit.prevent="onSubmit">
          <v-card-text>
            <v-text-field
              v-model="email"
              v-bind="emailAttrs"
              label="Email"
              type="email"
              :error-messages="errors.email ? [errors.email] : []"
            />
          </v-card-text>
          <v-card-actions class="flex-column align-stretch px-4 pb-4">
            <v-btn color="primary" variant="flat" type="submit" :loading="submitting" block>Send reset link</v-btn>
            <RouterLink to="/login" class="text-body-2 mt-4">Back to login</RouterLink>
          </v-card-actions>
        </form>
      </template>
    </v-card>
  </v-container>
</template>
