<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import * as yup from 'yup'
// Cross-feature imports, sanctioned only for a form that needs another resource's dropdown.
// This form needs two: the customer placing the order and the product being ordered.
import customerService from '@/features/customers/services/customer.service'
import productService from '@/features/products/services/product.service'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  order: { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue', 'submit'])

const isEditMode = computed(() => !!props.order)

const customers = ref([])
const products = ref([])
onMounted(async () => {
  try {
    ;[customers.value, products.value] = await Promise.all([customerService.getAll(), productService.getAll()])
  } catch {
    // The services already toasted their own errors.
  }
})

function customerLabel(customer) {
  const name = [customer.first_name, customer.last_name].filter(Boolean).join(' ')
  return name || `Customer #${customer.id}`
}

function productLabel(product) {
  return `${product.product_name} ($${Number(product.unit_price).toFixed(2)})`
}

// Guards against picking a customer/product that was deleted by someone else between page
// load and submit; the dropdowns themselves only ever offer resources already fetched above.
const schema = yup.object({
  customer_id: yup
    .number()
    .typeError('Customer is required.')
    .required('Customer is required.')
    .test('customer-exists', 'Selected customer no longer exists.', (value) =>
      customers.value.some((customer) => customer.id === value),
    ),
  product_id: yup
    .number()
    .typeError('Product is required.')
    .required('Product is required.')
    .test('product-exists', 'Selected product no longer exists.', (value) =>
      products.value.some((product) => product.id === value),
    ),
  quantity: yup
    .number()
    .typeError('Quantity must be a number.')
    .required('Quantity is required.')
    .integer('Quantity must be a whole number.')
    .min(1, 'Quantity must be at least 1.'),
})

function initialValues() {
  return {
    // GraphQL's ID scalar always serializes as a string, but the customer/product dropdowns
    // are populated from REST (customerService/productService) where ids are numbers, so
    // this needs Number(...) or v-select's strict-equality value matching would never select
    // the pre-filled option when editing an existing order.
    customer_id: props.order?.customer?.id ? Number(props.order.customer.id) : null,
    product_id: props.order?.product?.id ? Number(props.order.product.id) : null,
    quantity: props.order?.quantity ?? 1,
  }
}

const { handleSubmit, defineField, resetForm, errors } = useForm({
  validationSchema: schema,
  initialValues: initialValues(),
})

const [customerId, customerIdAttrs] = defineField('customer_id')
const [productId, productIdAttrs] = defineField('product_id')
const [quantity, quantityAttrs] = defineField('quantity')

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

// Live preview only, recomputed whenever the selected product or quantity changes - the
// server recomputes and owns the authoritative total the same way (quantity x unit_price).
const estimatedTotal = computed(() => {
  const product = products.value.find((candidate) => candidate.id === productId.value)
  const qty = Number(quantity.value)
  return product && qty > 0 ? (Number(product.unit_price) * qty).toFixed(2) : '0.00'
})

const onSubmit = handleSubmit((values) => {
  emit('submit', {
    customer_id: Number(values.customer_id),
    product_id: Number(values.product_id),
    quantity: Number(values.quantity),
  })
})

function cancel() {
  emit('update:modelValue', false)
}
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="480" @update:model-value="$emit('update:modelValue', $event)">
    <v-card>
      <v-card-title>{{ isEditMode ? 'Edit order' : 'New order' }}</v-card-title>
      <!-- A plain <form>, not Vuetify's <v-form>: VForm wraps native submission in its own
           async emit('submit', e) choreography (its own field-rules validate() call) that
           conflicts with vee-validate owning validation here via the yup schema instead. -->
      <form @submit.prevent="onSubmit">
        <v-card-text>
          <v-select
            v-model="customerId"
            v-bind="customerIdAttrs"
            label="Customer"
            :items="customers"
            :item-title="customerLabel"
            item-value="id"
            :error-messages="errors.customer_id ? [errors.customer_id] : []"
          />
          <v-select
            v-model="productId"
            v-bind="productIdAttrs"
            label="Product"
            :items="products"
            :item-title="productLabel"
            item-value="id"
            :error-messages="errors.product_id ? [errors.product_id] : []"
          />
          <v-text-field
            v-model="quantity"
            v-bind="quantityAttrs"
            label="Quantity"
            type="number"
            min="1"
            step="1"
            :error-messages="errors.quantity ? [errors.quantity] : []"
          />
          <p class="text-body-2 text-medium-emphasis">Estimated total: ${{ estimatedTotal }}</p>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" type="button" @click="cancel">Cancel</v-btn>
          <v-btn color="primary" variant="flat" type="submit">{{ isEditMode ? 'Save' : 'Create' }}</v-btn>
        </v-card-actions>
      </form>
    </v-card>
  </v-dialog>
</template>
