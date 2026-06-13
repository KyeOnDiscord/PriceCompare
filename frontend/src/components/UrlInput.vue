<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  submit: [url: string, group: string]
  manualSubmit: [
    url: string,
    group: string,
    productName: string,
    price: number,
    currency: string,
    imageUrl?: string,
  ]
}>()

defineProps<{
  loading: boolean
}>()

const manualMode = ref(false)
const url = ref('')
const group = ref('')
const productName = ref('')
const price = ref('')
const currency = ref('USD')
const imageUrl = ref('')

function handleAutoSubmit() {
  const trimmed = url.value.trim()
  if (!trimmed) return
  emit('submit', trimmed, group.value)
  url.value = ''
}

function handleManualSubmit() {
  const trimmedUrl = url.value.trim()
  const parsedPrice = parseFloat(price.value)
  if (!trimmedUrl || Number.isNaN(parsedPrice)) return

  emit(
    'manualSubmit',
    trimmedUrl,
    group.value,
    productName.value,
    parsedPrice,
    currency.value,
    imageUrl.value,
  )
  url.value = ''
  group.value = ''
  productName.value = ''
  price.value = ''
  imageUrl.value = ''
}
</script>

<template>
  <div class="url-input-wrapper">
    <div class="mode-toggle">
      <button
        type="button"
        class="mode-btn"
        :class="{ active: !manualMode }"
        @click="manualMode = false"
      >
        Auto-fetch
      </button>
      <button
        type="button"
        class="mode-btn"
        :class="{ active: manualMode }"
        @click="manualMode = true"
      >
        Add manually
      </button>
    </div>

    <form v-if="!manualMode" class="url-input" @submit.prevent="handleAutoSubmit">
      <div class="field">
        <label for="url">Store product URL</label>
        <input
          id="url"
          v-model="url"
          type="url"
          placeholder="https://store.example.com/product/..."
          required
          :disabled="loading"
        />
      </div>
      <div class="field">
        <label for="group">Product group (optional)</label>
        <input
          id="group"
          v-model="group"
          type="text"
          placeholder="e.g. iPhone 15 Pro"
          :disabled="loading"
        />
      </div>
      <button type="submit" class="btn-primary" :disabled="loading || !url.trim()">
        {{ loading ? 'Fetching price...' : 'Add product' }}
      </button>
      <p class="hint">
        Some Cloudflare-protected sites may block auto-fetching. Use "Add manually" for those.
      </p>
    </form>

    <form v-else class="url-input" @submit.prevent="handleManualSubmit">
      <div class="field">
        <label for="manual-url">Store product URL</label>
        <input
          id="manual-url"
          v-model="url"
          type="url"
          placeholder="https://store.example.com/product/..."
          required
        />
      </div>
      <div class="field">
        <label for="manual-name">Product name</label>
        <input
          id="manual-name"
          v-model="productName"
          type="text"
          placeholder="Product title"
          required
        />
      </div>
      <div class="field-row">
        <div class="field">
          <label for="manual-price">Price</label>
          <input
            id="manual-price"
            v-model="price"
            type="number"
            step="0.01"
            min="0"
            placeholder="29.99"
            required
          />
        </div>
        <div class="field">
          <label for="manual-currency">Currency</label>
          <select id="manual-currency" v-model="currency">
            <option value="USD">USD</option>
            <option value="GBP">GBP</option>
            <option value="EUR">EUR</option>
            <option value="CAD">CAD</option>
            <option value="AUD">AUD</option>
            <option value="JPY">JPY</option>
          </select>
        </div>
      </div>
      <div class="field">
        <label for="manual-image">Image URL (optional)</label>
        <input
          id="manual-image"
          v-model="imageUrl"
          type="url"
          placeholder="https://store.example.com/image.jpg"
        />
      </div>
      <div class="field">
        <label for="manual-group">Product group (optional)</label>
        <input
          id="manual-group"
          v-model="group"
          type="text"
          placeholder="e.g. iPhone 15 Pro"
        />
      </div>
      <button type="submit" class="btn-primary" :disabled="!url.trim() || !productName.trim() || !price">
        Add product
      </button>
    </form>
  </div>
</template>

<style scoped>
.url-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.mode-toggle {
  display: flex;
  gap: 0.5rem;
}

.mode-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text-muted);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
}

.mode-btn.active {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
}

.url-input {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1rem;
}

label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-muted);
}

input,
select {
  padding: 0.75rem 1rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 1rem;
  background: var(--bg);
  color: var(--text);
}

input:focus,
select:focus {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

input:disabled {
  opacity: 0.6;
}

.btn-primary {
  align-self: flex-start;
  padding: 0.75rem 1.5rem;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.hint {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-muted);
}

@media (max-width: 600px) {
  .field-row {
    grid-template-columns: 1fr;
  }
}
</style>
