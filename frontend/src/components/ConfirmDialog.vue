<script setup>
defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, required: true },
  message: { type: String, required: true },
  confirmLabel: { type: String, default: 'Delete' },
  cancelLabel: { type: String, default: 'Cancel' },
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

function confirm() {
  emit('update:modelValue', false)
  emit('confirm')
}

function cancel() {
  emit('update:modelValue', false)
  emit('cancel')
}
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="480" @update:model-value="$emit('update:modelValue', $event)">
    <v-card>
      <v-card-title>{{ title }}</v-card-title>
      <v-card-text>{{ message }}</v-card-text>
      <v-card-actions class="justify-end">
        <v-btn variant="text" type="button" @click="cancel">{{ cancelLabel }}</v-btn>
        <v-btn color="error" variant="flat" type="button" @click="confirm">{{ confirmLabel }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
