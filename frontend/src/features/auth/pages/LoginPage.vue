<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import * as yup from 'yup'
import authService from '../services/auth.service'

const router = useRouter()
const submitting = ref(false)

const schema = yup.object({
  email: yup.string().required('Email is required.').email('Enter a valid email address.'),
  password: yup.string().required('Password is required.'),
})

const { handleSubmit, defineField, errors } = useForm({ validationSchema: schema })
const [email, emailAttrs] = defineField('email')
const [password, passwordAttrs] = defineField('password')

// authService.login() already updates the shared session state on success (see
// auth.store.js's setSession()), so this only has to navigate away afterward.
const onSubmit = handleSubmit(async (values) => {
  submitting.value = true
  try {
    await authService.login(values)
    router.push('/')
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
      <v-card-title>Login</v-card-title>
      <form @submit.prevent="onSubmit">
        <v-card-text>
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
        </v-card-text>
        <v-card-actions class="flex-column align-stretch px-4 pb-4">
          <v-btn color="primary" variant="flat" type="submit" :loading="submitting" block>Login</v-btn>
          <div class="d-flex justify-space-between mt-4 text-body-2">
            <RouterLink to="/register">Create an account</RouterLink>
            <RouterLink to="/forgot-password">Forgot password?</RouterLink>
          </div>
        </v-card-actions>
      </form>
    </v-card>
  </v-container>
</template>
