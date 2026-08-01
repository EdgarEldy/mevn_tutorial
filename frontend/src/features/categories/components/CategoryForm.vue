<script setup>
import { computed, watch } from 'vue'
import { useForm } from 'vee-validate'
import * as yup from 'yup'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  category: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'submit'])

const isEditMode = computed(() => !!props.category)

const schema = yup.object({
  category_name: yup
    .string()
    .required('Category name is required.')
    .max(255, 'Category name must be 255 characters or fewer.'),
})

const { handleSubmit, defineField, resetForm, errors } = useForm({
  validationSchema: schema,
  initialValues: { category_name: props.category?.category_name ?? '' },
})

const [categoryName, categoryNameAttrs] = defineField('category_name')

// Re-seed the form every time the dialog opens, so editing a different row (or opening
// "New" after an edit) doesn't show stale values from the previous open.
watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      resetForm({ values: { category_name: props.category?.category_name ?? '' } })
    }
  },
)

const onSubmit = handleSubmit((values) => {
  emit('submit', values)
})

function cancel() {
  emit('update:modelValue', false)
}
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="480" @update:model-value="$emit('update:modelValue', $event)">
    <v-card>
      <v-card-title>{{ isEditMode ? 'Edit category' : 'New category' }}</v-card-title>
      <!-- A plain <form>, not Vuetify's <v-form>: VForm wraps native submission in its own
           async emit('submit', e) choreography (its own field-rules validate() call) that
           conflicts with vee-validate owning validation here via the yup schema instead. -->
      <form @submit.prevent="onSubmit">
        <v-card-text>
          <v-text-field
            v-model="categoryName"
            v-bind="categoryNameAttrs"
            label="Category name"
            maxlength="255"
            :error-messages="errors.category_name ? [errors.category_name] : []"
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
