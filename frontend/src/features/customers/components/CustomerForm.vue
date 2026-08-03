<script setup>
import { computed, watch } from 'vue'
import { useForm } from 'vee-validate'
import * as yup from 'yup'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  customer: { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue', 'submit'])

const isEditMode = computed(() => !!props.customer)

// Every field mirrors the backend's optional validation rules (customer.validation.js has
// no notEmpty()/required() anywhere), so unlike category/product this schema has no
// .required() at all, only format/length checks that yup already skips for an empty string.
const schema = yup.object({
  first_name: yup.string().max(255, 'First name must be 255 characters or fewer.'),
  last_name: yup.string().max(255, 'Last name must be 255 characters or fewer.'),
  // The character-set check is a frontend-only UX guard with no backend equivalent
  // (customer.validation.js only checks isString()/isLength() on telephone, no pattern) -
  // an intentional stricter-than-backend divergence, not a mismatch to fix.
  telephone: yup
    .string()
    .max(50, 'Telephone must be 50 characters or fewer.')
    .matches(/^[0-9+\-.\s()]*$/, 'Telephone may only contain digits, spaces and + - . ( )'),
  email: yup.string().email('Must be a valid email address.').max(255, 'Email must be 255 characters or fewer.'),
  address: yup.string().max(255, 'Address must be 255 characters or fewer.'),
})

function initialValues() {
  return {
    first_name: props.customer?.first_name ?? '',
    last_name: props.customer?.last_name ?? '',
    telephone: props.customer?.telephone ?? '',
    email: props.customer?.email ?? '',
    address: props.customer?.address ?? '',
  }
}

const { handleSubmit, defineField, resetForm, errors } = useForm({
  validationSchema: schema,
  initialValues: initialValues(),
})

const [firstName, firstNameAttrs] = defineField('first_name')
const [lastName, lastNameAttrs] = defineField('last_name')
const [telephone, telephoneAttrs] = defineField('telephone')
const [email, emailAttrs] = defineField('email')
const [address, addressAttrs] = defineField('address')

// Re-seed the form every time the dialog opens, so editing a different row (or opening
// "New" after an edit) doesn't show stale values from the previous open.
watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      resetForm({ values: initialValues() })
    }
  },
)

// express-validator's .optional() only skips a field when the key is absent, not when it's
// present as an empty string, so `email: ''` would still fail isEmail() server-side. Every
// field here defaults to '' when left blank, so blank fields are dropped entirely instead of
// being sent as empty strings.
function stripBlankFields(values) {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== ''))
}

const onSubmit = handleSubmit((values) => {
  emit('submit', stripBlankFields(values))
})

function cancel() {
  emit('update:modelValue', false)
}
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="480" @update:model-value="$emit('update:modelValue', $event)">
    <v-card>
      <v-card-title>{{ isEditMode ? 'Edit customer' : 'New customer' }}</v-card-title>
      <!-- A plain <form>, not Vuetify's <v-form>: VForm wraps native submission in its own
           async emit('submit', e) choreography (its own field-rules validate() call) that
           conflicts with vee-validate owning validation here via the yup schema instead. -->
      <form @submit.prevent="onSubmit">
        <v-card-text>
          <v-text-field
            v-model="firstName"
            v-bind="firstNameAttrs"
            label="First name"
            maxlength="255"
            :error-messages="errors.first_name ? [errors.first_name] : []"
          />
          <v-text-field
            v-model="lastName"
            v-bind="lastNameAttrs"
            label="Last name"
            maxlength="255"
            :error-messages="errors.last_name ? [errors.last_name] : []"
          />
          <v-text-field
            v-model="telephone"
            v-bind="telephoneAttrs"
            label="Telephone"
            maxlength="50"
            :error-messages="errors.telephone ? [errors.telephone] : []"
          />
          <v-text-field
            v-model="email"
            v-bind="emailAttrs"
            label="Email"
            maxlength="255"
            :error-messages="errors.email ? [errors.email] : []"
          />
          <v-text-field
            v-model="address"
            v-bind="addressAttrs"
            label="Address"
            maxlength="255"
            :error-messages="errors.address ? [errors.address] : []"
          />
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" type="button" @click="cancel">Cancel</v-btn>
          <v-btn color="primary" variant="flat" type="submit">{{ isEditMode ? 'Save' : 'Create' }}</v-btn>
        </v-card-actions>
      </form>
    </v-card>
  </v-dialog>
</template>
