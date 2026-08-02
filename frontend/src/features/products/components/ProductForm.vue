<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import * as yup from 'yup'
// Cross-feature import, sanctioned only for a form that needs a related resource's dropdown
// (here: the category a product belongs to).
import categoryService from '@/features/categories/services/category.service'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  product: { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue', 'submit'])

const isEditMode = computed(() => !!props.product)

const categories = ref([])
onMounted(async () => {
  try {
    categories.value = await categoryService.getAll()
  } catch {
    // The service already toasted the error.
  }
})

// Guards against picking a category that was deleted by someone else between page load and
// submit; the dropdown itself only ever offers categories already fetched into `categories`.
const schema = yup.object({
  product_name: yup.string().required('Product name is required.').max(255, 'Product name must be 255 characters or fewer.'),
  unit_price: yup
    .number()
    .typeError('Unit price must be a number.')
    .required('Unit price is required.')
    .min(0, 'Unit price must be zero or greater.'),
  category_id: yup
    .number()
    .typeError('Category is required.')
    .required('Category is required.')
    .test('category-exists', 'Selected category no longer exists.', (value) =>
      categories.value.some((category) => category.id === value),
    ),
})

const { handleSubmit, defineField, resetForm, errors } = useForm({
  validationSchema: schema,
  initialValues: {
    product_name: props.product?.product_name ?? '',
    unit_price: props.product?.unit_price ?? null,
    category_id: props.product?.category_id ?? null,
  },
})

const [productName, productNameAttrs] = defineField('product_name')
const [unitPrice, unitPriceAttrs] = defineField('unit_price')
const [categoryId, categoryIdAttrs] = defineField('category_id')

// Re-seed the form every time the dialog opens, so editing a different row (or opening
// "New" after an edit) doesn't show stale values from the previous open.
watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      resetForm({
        values: {
          product_name: props.product?.product_name ?? '',
          unit_price: props.product?.unit_price ?? null,
          category_id: props.product?.category_id ?? null,
        },
      })
    }
  },
)

// vee-validate passes the raw form values, not yup's casted output. unit_price is still
// a string from the text input despite the schema validating it as a number, and
// category_id can likewise be a string if the categories API returns BIGINT ids as
// strings (a known Sequelize/mysql2 behavior) - cast both explicitly before they leave
// the component.
const onSubmit = handleSubmit((values) => {
  emit('submit', { ...values, unit_price: Number(values.unit_price), category_id: Number(values.category_id) })
})

function cancel() {
  emit('update:modelValue', false)
}
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="480" @update:model-value="$emit('update:modelValue', $event)">
    <v-card>
      <v-card-title>{{ isEditMode ? 'Edit product' : 'New product' }}</v-card-title>
      <!-- A plain <form>, not Vuetify's <v-form>: VForm wraps native submission in its own
           async emit('submit', e) choreography (its own field-rules validate() call) that
           conflicts with vee-validate owning validation here via the yup schema instead. -->
      <form @submit.prevent="onSubmit">
        <v-card-text>
          <v-text-field
            v-model="productName"
            v-bind="productNameAttrs"
            label="Product name"
            maxlength="255"
            :error-messages="errors.product_name ? [errors.product_name] : []"
          />
          <v-text-field
            v-model="unitPrice"
            v-bind="unitPriceAttrs"
            label="Unit price"
            type="number"
            step="0.01"
            min="0"
            :error-messages="errors.unit_price ? [errors.unit_price] : []"
          />
          <v-select
            v-model="categoryId"
            v-bind="categoryIdAttrs"
            label="Category"
            :items="categories"
            item-title="category_name"
            item-value="id"
            :error-messages="errors.category_id ? [errors.category_id] : []"
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
