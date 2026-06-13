import express from 'express'
import cors from 'cors'
import { scrapePrice } from './scraper.js'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

app.post('/api/scrape', async (req, res) => {
  const { url } = req.body

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL is required' })
  }

  try {
    new URL(url)
  } catch {
    return res.status(400).json({ error: 'Invalid URL' })
  }

  try {
    const result = await scrapePrice(url)
    res.json(result)
  } catch (err) {
    res.status(400).json({ error: err.message || 'Scraping failed' })
  }
})

app.listen(PORT, () => {
  console.log(`Scraper API running at http://localhost:${PORT}`)
})
