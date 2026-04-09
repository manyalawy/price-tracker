const express = require('express')
const { checkPrices } = require('../services/price-check.service')

const router = express.Router()

/**
 * POST /check-prices
 * Processes up to 20 products whose next_check_at is due.
 */
router.post('/check-prices', async (_req, res) => {
  try {
    const results = await checkPrices()
    res.json(results)
  } catch (err) {
    console.error('[/check-prices] Fatal error:', err)
    res.status(500).json({ error: 'Failed to check prices', details: err.message })
  }
})

module.exports = router
