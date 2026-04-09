const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const { requireApiKey } = require('./middleware/auth')
const { extractProduct } = require('./extraction/pipeline')
const checkPricesRouter = require('./routes/check-prices')
const config = require('./lib/config')

const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json())

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
  })
)

// Health check — no auth required
app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'price-track-server' })
})

app.use(requireApiKey)

app.post('/extract', async (req, res) => {
  const { url } = req.body
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "url" in request body.' })
  }
  try {
    const result = await extractProduct(url)
    return res.json(result)
  } catch (err) {
    console.error('[/extract] error:', err)
    return res.status(500).json({ error: 'Failed to extract product data.' })
  }
})

app.use(checkPricesRouter)

app.listen(config.port, () => {
  console.error(`price-track-server running on port ${config.port}`)
})

module.exports = app
