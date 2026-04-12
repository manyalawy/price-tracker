const { initSentry, Sentry } = require('./lib/sentry')
initSentry()

const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const { requireApiKey } = require('./middleware/auth')
const { requestLogger } = require('./middleware/request-logger')
const { errorHandler } = require('./middleware/error-handler')
const { extractProduct } = require('./extraction/pipeline')
const checkPricesRouter = require('./routes/check-prices')
const config = require('./lib/config')
const logger = require('./lib/logger')

const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(requestLogger)

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

app.post('/extract', async (req, res, next) => {
  const { url } = req.body
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "url" in request body.' })
  }
  try {
    const result = await extractProduct(url)
    return res.json(result)
  } catch (err) {
    next(err)
  }
})

app.use(checkPricesRouter)

app.use(Sentry.expressErrorHandler())
app.use(errorHandler)

app.listen(config.port, () => {
  logger.info(`price-track-server running on port ${config.port}`)
})

module.exports = app
