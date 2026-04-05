require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting: 60 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use(limiter);

// API key auth middleware
function requireApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized: invalid or missing API key.' });
  }
  next();
}

// Health check — no auth required
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'price-track-server' });
});

// All routes below require API key auth
app.use(requireApiKey);

// POST /extract — extract price/product data from a URL
app.post('/extract', async (req, res) => {
  const { url } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "url" in request body.' });
  }

  try {
    // Pipeline module will be implemented in a later task
    const { extractProduct } = require('./extraction/pipeline.js');
    const result = await extractProduct(url);
    return res.json(result);
  } catch (err) {
    // If pipeline hasn't been built yet, return a placeholder
    if (err.code === 'MODULE_NOT_FOUND') {
      return res.json({
        placeholder: true,
        message: 'Extraction pipeline not yet implemented.',
        url,
      });
    }
    console.error('[/extract] error:', err);
    return res.status(500).json({ error: 'Failed to extract product data.' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`price-track-server running on port ${PORT}`);
});

module.exports = app;
