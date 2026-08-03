<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import * as yup from 'yup'
import authService from '../services/auth.service'
import { passwordSchema, confirmPasswordSchema } from '../validators/password.schema'

const route = useRoute()
const router = useRouter()
const submitting = ref(false)

const schema = yup.object({
  password: passwordSchema,
  confirmPassword: confirmPasswordSchema,
})

const { handleSubmit, defineField, errors } = useForm({ validationSchema: schema })
const [password, passwordAttrs] = defineField('password')
const [confirmPassword, confirmPasswordAttrs] = defineField('confirmPassword')

// Route-driven page for /auth/reset-password/:token: the token comes from the URL,
// only the new password is entered here.
const onSubmit = handleSubmit(async (values) => {
  submitting.value = true
  try {
    await authService.resetPassword({ token: route.params.token, password: values.password })
    router.push('/login')
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
      <v-card-title>Reset password</v-card-title>
      <form @submit.prevent="onSubmit">
        <v-card-text>
          <v-text-field
            v-model="password"
            v-bind="passwordAttrs"
            label="New password"
            type="password"
            :error-messages="errors.password ? [errors.password] : []"
          />
          <v-text-field
            v-model="confirmPassword"
            v-bind="confirmPasswordAttrs"
            label="Confirm new password"
            type="password"
            :error-messages="errors.confirmPassword ? [errors.confirmPassword] : []"
          />
        </v-card-text>
        <v-card-actions class="flex-column align-stretch px-4 pb-4">
          <v-btn color="primary" variant="flat" type="submit" :loading="submitting" block>Reset password</v-btn>
        </v-card-actions>
      </form>
    </v-card>
  </v-container>
</template>
