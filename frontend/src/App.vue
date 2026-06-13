<script setup lang="ts">
import UrlInput from './components/UrlInput.vue'
import PriceTable from './components/PriceTable.vue'
import { usePriceTracker } from './composables/usePriceTracker'

const {
  products,
  loading,
  error,
  addProduct,
  addProductManual,
  refreshProduct,
  removeProduct,
  clearAll,
  exportCsv,
} = usePriceTracker()
</script>

<template>
  <div class="app">
    <header class="header">
      <div>
        <h1>Price Compare</h1>
        <p class="subtitle">
          Track product prices across stores and find the best deal.
        </p>
      </div>
      <div v-if="products.length > 0" class="header-actions">
        <button class="btn-secondary" @click="exportCsv">Export CSV</button>
        <button class="btn-secondary btn-danger-outline" @click="clearAll">Clear all</button>
      </div>
    </header>

    <UrlInput
      :loading="loading"
      @submit="addProduct"
      @manual-submit="addProductManual"
    />

    <p v-if="error" class="error">{{ error }}</p>

    <PriceTable
      :products="products"
      @remove="removeProduct"
      @refresh="refreshProduct"
    />
  </div>
</template>

<style scoped>
.app {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 2rem;
}

h1 {
  margin: 0 0 0.25rem;
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.subtitle {
  margin: 0;
  color: var(--text-muted);
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.btn-secondary {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
}

.btn-secondary:hover {
  background: var(--bg);
}

.btn-danger-outline:hover {
  border-color: #fca5a5;
  color: #dc2626;
}

.error {
  margin: 1rem 0 0;
  padding: 0.75rem 1rem;
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
  border-radius: 8px;
  font-size: 0.9rem;
}

@media (max-width: 600px) {
  .header {
    flex-direction: column;
  }
}
</style>
