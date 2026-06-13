# Price Compare

A Vue.js app to track and compare product prices across different store websites. Paste a product URL, and the app fetches the price and saves it to a comparison table. Data persists in your browser via **localStorage**.

## Features

- Paste any store product URL to fetch the price
- Group products (e.g. "iPhone 15 Pro") to compare the same item across stores
- Spreadsheet-style table with best-price highlighting
- Refresh individual prices on demand
- Export to CSV
- Data saved automatically in localStorage

## How it works

The browser can't fetch arbitrary store pages directly (CORS), so a small Node.js backend scrapes the page and extracts prices from:

1. JSON-LD `schema.org/Product` data (most e-commerce sites)
2. Open Graph meta tags
3. Common price HTML patterns (fallback)

## Getting started

You need **two terminals** - one for the backend, one for the frontend.

### 1. Start the backend (scraper API)

```bash
cd backend
npm install
npm start
```

Runs at `http://localhost:3001`

### 2. Start the frontend (Vue app)

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Usage

1. Paste a product URL from any store
2. Optionally add a **product group** name to group comparisons (e.g. same item from Amazon vs Best Buy)
3. Click **Add product** - the price is fetched and added to the table
4. Products in the same group are sorted by price; the lowest is marked **Best**
5. Use **↻** to refresh a price, **Export CSV** to download, or **Clear all** to reset

## Limitations

- Not every website works - some block bots or use heavy JavaScript rendering
- **Cloudflare-protected sites** may still block requests even with the browser fallback; use **Add manually** for those
- Price extraction depends on the site's HTML structure
- Group matching is manual (you assign the group name)

### Cloudflare 403 errors

If auto-fetch fails with a Cloudflare error, the backend will retry using a headless browser. If that also fails, switch to **Add manually** in the app and enter the price yourself from the store page.
