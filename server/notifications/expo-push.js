const https = require('https');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const BATCH_SIZE = 100;

/**
 * Send push notifications via Expo Push API.
 * @param {Array<{to: string, title: string, body: string, data?: object}>} messages
 * @returns {Promise<Array>} Expo push receipts
 */
async function sendPushNotifications(messages) {
  if (!messages.length) return [];

  const results = [];

  // Batch messages per Expo's recommendation
  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const batch = messages.slice(i, i + BATCH_SIZE);
    const result = await sendBatch(batch);
    results.push(...result);
  }

  return results;
}

function sendBatch(messages) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(messages);

    const req = https.request(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        try {
          const data = JSON.parse(Buffer.concat(chunks).toString());
          resolve(data.data || []);
        } catch (e) {
          resolve([]);
        }
      });
    });

    req.on('error', (err) => {
      console.error('[expo-push] Error:', err.message);
      resolve([]);
    });

    req.write(body);
    req.end();
  });
}

module.exports = { sendPushNotifications };
