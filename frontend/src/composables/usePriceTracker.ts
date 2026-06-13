import { ref, watch } from 'vue'
import type { Product, ScrapeResult } from '@/types/product'

const STORAGE_KEY = 'price-tracker'

function loadProducts(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveProducts(products: Product[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
}

export function usePriceTracker() {
  const products = ref<Product[]>(loadProducts())
  const loading = ref(false)
  const error = ref<string | null>(null)

  watch(products, (value) => saveProducts(value), { deep: true })

  async function addProduct(url: string, group: string) {
    loading.value = true
    error.value = null

    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch price')
      }

      const result = data as ScrapeResult
      const parsed = new URL(url)

      products.value.push({
        id: Date.now(),
        url,
        store: parsed.hostname.replace(/^www\./, ''),
        productName: result.title || 'Unknown product',
        group: group.trim(),
        price: result.price,
        currency: result.currency || 'USD',
        imageUrl: result.imageUrl || undefined,
        fetchedAt: new Date().toISOString(),
      })
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Something went wrong'
    } finally {
      loading.value = false
    }
  }

  function addProductManual(
    url: string,
    group: string,
    productName: string,
    price: number,
    currency: string,
    imageUrl?: string,
  ) {
    error.value = null
    const parsed = new URL(url)

    products.value.push({
      id: Date.now(),
      url,
      store: parsed.hostname.replace(/^www\./, ''),
      productName: productName.trim() || 'Unknown product',
      group: group.trim(),
      price,
      currency: currency || 'USD',
      imageUrl: imageUrl?.trim() || undefined,
      fetchedAt: new Date().toISOString(),
    })
  }

  async function refreshProduct(id: number) {
    const product = products.value.find((p) => p.id === id)
    if (!product) return

    loading.value = true
    error.value = null

    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: product.url }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to refresh price')
      }

      const result = data as ScrapeResult
      product.price = result.price
      product.currency = result.currency || product.currency
      product.productName = result.title || product.productName
      if (result.imageUrl) product.imageUrl = result.imageUrl
      product.fetchedAt = new Date().toISOString()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Something went wrong'
    } finally {
      loading.value = false
    }
  }

  function removeProduct(id: number) {
    products.value = products.value.filter((p) => p.id !== id)
  }

  function clearAll() {
    products.value = []
  }

  function exportCsv() {
    const headers = ['Group', 'Store', 'Product', 'Price', 'Currency', 'Image URL', 'URL', 'Last Checked']
    const rows = products.value.map((p) => [
      p.group,
      p.store,
      p.productName,
      p.price,
      p.currency,
      p.imageUrl || '',
      p.url,
      p.fetchedAt,
    ])

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `price-compare-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return {
    products,
    loading,
    error,
    addProduct,
    addProductManual,
    refreshProduct,
    removeProduct,
    clearAll,
    exportCsv,
  }
}
