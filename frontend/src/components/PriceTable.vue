<script setup lang="ts">
import { computed } from 'vue'
import type { Product } from '@/types/product'

const props = defineProps<{
  products: Product[]
}>()

const emit = defineEmits<{
  remove: [id: number]
  refresh: [id: number]
}>()

const groupedProducts = computed(() => {
  const groups = new Map<string, Product[]>()

  for (const product of props.products) {
    const key = product.group || 'Ungrouped'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(product)
  }

  return Array.from(groups.entries()).map(([name, items]) => ({
    name,
    items: [...items].sort((a, b) => a.price - b.price),
    lowestPrice: Math.min(...items.map((i) => i.price)),
  }))
})

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(price)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString()
}

function isLowest(price: number, lowest: number) {
  return price === lowest
}
</script>

<template>
  <div class="price-table-wrapper">
    <div v-if="products.length === 0" class="empty">
      <p>No products yet. Paste a store URL above to start comparing prices.</p>
    </div>

    <div v-for="group in groupedProducts" :key="group.name" class="group-section">
      <h2 class="group-title">{{ group.name }}</h2>

      <table class="price-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Store</th>
            <th>Product</th>
            <th>Price</th>
            <th>Last checked</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in group.items" :key="product.id">
            <td class="image-cell">
              <img
                v-if="product.imageUrl"
                :src="product.imageUrl"
                :alt="product.productName"
                class="product-image"
                loading="lazy"
                referrerpolicy="no-referrer"
              />
              <span v-else class="no-image">—</span>
            </td>
            <td class="store">{{ product.store }}</td>
            <td class="product-name">
              <a :href="product.url" target="_blank" rel="noopener noreferrer">
                {{ product.productName }}
              </a>
            </td>
            <td
              class="price"
              :class="{ lowest: isLowest(product.price, group.lowestPrice) }"
            >
              {{ formatPrice(product.price, product.currency) }}
              <span v-if="isLowest(product.price, group.lowestPrice)" class="badge">
                Best
              </span>
            </td>
            <td class="date">{{ formatDate(product.fetchedAt) }}</td>
            <td class="actions">
              <button class="btn-sm" title="Refresh price" @click="emit('refresh', product.id)">
                ↻
              </button>
              <button class="btn-sm btn-danger" title="Remove" @click="emit('remove', product.id)">
                ✕
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.price-table-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.empty {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-muted);
  background: var(--surface);
  border: 1px dashed var(--border);
  border-radius: 12px;
}

.group-section {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}

.group-title {
  margin: 0;
  padding: 1rem 1.25rem;
  font-size: 1.1rem;
  background: var(--bg);
  border-bottom: 1px solid var(--border);
}

.price-table {
  width: 100%;
  border-collapse: collapse;
}

.price-table th,
.price-table td {
  padding: 0.85rem 1.25rem;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.price-table th {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
  background: var(--bg);
}

.price-table tbody tr:last-child td {
  border-bottom: none;
}

.price-table tbody tr:hover {
  background: var(--bg);
}

.store {
  font-weight: 600;
  white-space: nowrap;
}

.image-cell {
  width: 72px;
}

.product-image {
  width: 56px;
  height: 56px;
  object-fit: contain;
  border-radius: 6px;
  background: var(--bg);
  border: 1px solid var(--border);
}

.no-image {
  color: var(--text-muted);
}

.product-name a {
  color: var(--accent);
  text-decoration: none;
}

.product-name a:hover {
  text-decoration: underline;
}

.price {
  font-weight: 700;
  font-size: 1.05rem;
  white-space: nowrap;
}

.price.lowest {
  color: var(--success);
}

.badge {
  display: inline-block;
  margin-left: 0.5rem;
  padding: 0.15rem 0.5rem;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  background: var(--success-bg);
  color: var(--success);
  border-radius: 4px;
  vertical-align: middle;
}

.date {
  font-size: 0.85rem;
  color: var(--text-muted);
  white-space: nowrap;
}

.actions {
  white-space: nowrap;
}

.btn-sm {
  padding: 0.35rem 0.6rem;
  margin-right: 0.25rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg);
  color: var(--text);
  cursor: pointer;
  font-size: 0.9rem;
}

.btn-sm:hover {
  background: var(--border);
}

.btn-danger:hover {
  background: #fee2e2;
  border-color: #fca5a5;
  color: #dc2626;
}

@media (max-width: 768px) {
  .price-table {
    display: block;
    overflow-x: auto;
  }
}
</style>
