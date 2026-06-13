export interface Product {
  id: number
  url: string
  store: string
  productName: string
  group: string
  price: number
  currency: string
  imageUrl?: string
  fetchedAt: string
}

export interface ScrapeResult {
  title: string
  price: number
  currency: string
  imageUrl?: string | null
}
