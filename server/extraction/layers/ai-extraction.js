const Anthropic = require('@anthropic-ai/sdk');
const { cleanHtml, truncateHtml } = require('../utils/html');

let client = null;

function getClient() {
  if (!client) {
    client = new Anthropic();
  }
  return client;
}

/**
 * Use Claude API as a last-resort fallback to extract product data from HTML.
 * Sends cleaned, truncated HTML and asks for structured extraction.
 */
async function extract(html, url) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn('[ai-extraction] No ANTHROPIC_API_KEY set, skipping AI extraction');
    return null;
  }

  const cleaned = cleanHtml(html);
  const truncated = truncateHtml(cleaned, 12000);

  if (!truncated || truncated.length < 50) {
    return null;
  }

  try {
    const anthropic = getClient();
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `Extract the product information from this webpage content. The URL is: ${url}

Return ONLY a JSON object with these fields (no markdown, no explanation):
{
  "name": "product name",
  "price": 29.99,
  "currency": "USD",
  "image_url": "https://..." or null
}

If you cannot find a price, return {"error": "no price found"}.

Webpage content:
${truncated}`,
        },
      ],
    });

    const text = response.content[0]?.text?.trim();
    if (!text) return null;

    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const data = JSON.parse(jsonMatch[0]);
    if (data.error || !data.price) return null;

    const price = typeof data.price === 'number' ? data.price : parseFloat(data.price);
    if (isNaN(price) || price <= 0) return null;

    return {
      name: data.name || null,
      price,
      currency: data.currency || 'USD',
      image_url: data.image_url || null,
      method: 'ai',
      selector: null,
    };
  } catch (err) {
    console.error('[ai-extraction] Error:', err.message);
    return null;
  }
}

module.exports = { extract };
