const https = require('https')
const http = require('http')
const cheerio = require('cheerio')

// Rotate through common browser User-Agent strings to reduce bot detection
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
]

function randomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
}

/**
 * Fetch the raw HTML of a page.
 * @param {string} url - The URL to fetch.
 * @param {object} [options]
 * @param {number} [options.timeoutMs=10000] - Request timeout in milliseconds.
 * @returns {Promise<string>} Raw HTML string.
 */
function fetchPage(url, { timeoutMs = 10000 } = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url)
    const transport = parsedUrl.protocol === 'https:' ? https : http

    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': randomUserAgent(),
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'identity',
        Connection: 'close',
      },
    }

    const req = transport.request(requestOptions, (res) => {
      // Follow a single redirect
      if (
        (res.statusCode === 301 ||
          res.statusCode === 302 ||
          res.statusCode === 307 ||
          res.statusCode === 308) &&
        res.headers.location
      ) {
        const redirectUrl = new URL(res.headers.location, url).toString()
        return fetchPage(redirectUrl, { timeoutMs }).then(resolve).catch(reject)
      }

      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`))
      }

      const chunks = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
      res.on('error', reject)
    })

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`Request timed out after ${timeoutMs}ms for ${url}`))
    })

    req.on('error', reject)
    req.end()
  })
}

/**
 * Strip noise from raw HTML: scripts, styles, nav, footers, ads, hidden elements.
 * Returns a cheerio root so callers can do further manipulation if needed.
 * @param {string} html - Raw HTML string.
 * @returns {string} Cleaned HTML string.
 */
function cleanHtml(html) {
  const $ = cheerio.load(html)

  // Remove elements that never contain useful product data
  const REMOVE_SELECTORS = [
    'script',
    'style',
    'noscript',
    'nav',
    'header',
    'footer',
    'aside',
    'iframe',
    'svg',
    'canvas',
    '[aria-hidden="true"]',
    '[hidden]',
    '.advertisement',
    '.ads',
    '.cookie-banner',
    '.newsletter',
    '.popup',
    '.modal',
    '.breadcrumb',
    '.breadcrumbs',
    '.related-products',
    '.recommendations',
    '.social-share',
    '.social-links',
  ]

  $(REMOVE_SELECTORS.join(',')).remove()

  // Remove comment nodes
  $('*')
    .contents()
    .each(function () {
      if (this.type === 'comment') {
        $(this).remove()
      }
    })

  // Collapse excessive whitespace in text nodes
  return $.html()
}

/**
 * Truncate HTML to fit within an AI context window.
 * Strips down to plain text first, then truncates by character count.
 * @param {string} html - HTML string (ideally already cleaned).
 * @param {number} [maxChars=12000] - Maximum character count.
 * @returns {string} Truncated text content.
 */
function truncateHtml(html, maxChars = 12000) {
  const $ = cheerio.load(html)

  // Extract visible text only
  const text = $('body').text().replace(/\s+/g, ' ').trim()

  if (text.length <= maxChars) return text

  // Truncate at a word boundary near maxChars
  const truncated = text.slice(0, maxChars)
  const lastSpace = truncated.lastIndexOf(' ')
  return (lastSpace > maxChars * 0.8 ? truncated.slice(0, lastSpace) : truncated) + '…'
}

module.exports = { fetchPage, cleanHtml, truncateHtml }
