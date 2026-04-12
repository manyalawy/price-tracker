const https = require('https')
const { resendKey: apiKey } = require('../lib/config')

/**
 * Send a price drop email via Resend API.
 * @param {object} params
 * @param {string} params.to - Recipient email
 * @param {string} params.productName - Product name
 * @param {number} params.currentPrice - Current price
 * @param {number} params.targetPrice - User's target price
 * @param {string} params.currency - Currency code
 * @param {string} params.productUrl - Original product URL
 */
async function sendPriceDropEmail({
  to,
  productName,
  currentPrice,
  targetPrice,
  currency,
  productUrl,
}) {
  const symbol = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$'

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; background: #0a0a0a; color: #ffffff; padding: 32px; border-radius: 12px;">
      <h2 style="color: #4ade80; margin: 0 0 8px 0;">Price Drop Alert!</h2>
      <p style="color: #9ca3af; margin: 0 0 24px 0;">A product you're tracking just hit your target price.</p>
      <div style="background: #141414; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
        <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">${productName}</p>
        <p style="margin: 0 0 8px 0;">Current price: <span style="color: #4ade80; font-weight: 700; font-size: 20px;">${symbol}${currentPrice.toFixed(2)}</span></p>
        <p style="margin: 0; color: #9ca3af;">Your target: ${symbol}${targetPrice.toFixed(2)}</p>
      </div>
      <a href="${productUrl}" style="display: inline-block; background: #4ade80; color: #0a0a0a; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Product</a>
      <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">Sent by PriceTrack</p>
    </div>
  `

  const body = JSON.stringify({
    from: 'PriceTrack <alerts@pricetrack.app>',
    to: [to],
    subject: `Price Drop: ${productName} is now ${symbol}${currentPrice.toFixed(2)}`,
    html: htmlBody,
  })

  return new Promise((resolve, _reject) => {
    const req = https.request(
      'https://api.resend.com/emails',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        const chunks = []
        res.on('data', (chunk) => chunks.push(chunk))
        res.on('end', () => {
          try {
            resolve(JSON.parse(Buffer.concat(chunks).toString()))
          } catch (e) {
            resolve(null)
          }
        })
      }
    )

    req.on('error', (err) => {
      console.error('[resend] Error:', err.message)
      resolve(null)
    })

    req.write(body)
    req.end()
  })
}

module.exports = { sendPriceDropEmail }
