import * as SecureStore from 'expo-secure-store';

const CHUNK_SIZE = 2048;
const COUNT_SUFFIX = '.__count';

export const secureStoreAdapter = {
  getItem: async (key) => {
    const countStr = await SecureStore.getItemAsync(key + COUNT_SUFFIX);
    if (!countStr) {
      return SecureStore.getItemAsync(key);
    }
    const count = parseInt(countStr, 10);
    const chunks = await Promise.all(
      Array.from({ length: count }, (_, i) =>
        SecureStore.getItemAsync(i === 0 ? key : `${key}.${i}`)
      )
    );
    if (chunks.some((c) => c === null)) return null;
    return chunks.join('');
  },

  setItem: async (key, value) => {
    if (value.length <= CHUNK_SIZE) {
      await SecureStore.deleteItemAsync(key + COUNT_SUFFIX);
      await SecureStore.setItemAsync(key, value);
      return;
    }
    const chunks = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }
    await Promise.all(
      chunks.map((chunk, i) =>
        SecureStore.setItemAsync(i === 0 ? key : `${key}.${i}`, chunk)
      )
    );
    await SecureStore.setItemAsync(key + COUNT_SUFFIX, String(chunks.length));
  },

  removeItem: async (key) => {
    const countStr = await SecureStore.getItemAsync(key + COUNT_SUFFIX);
    if (countStr) {
      const count = parseInt(countStr, 10);
      await Promise.all([
        ...Array.from({ length: count }, (_, i) =>
          SecureStore.deleteItemAsync(i === 0 ? key : `${key}.${i}`)
        ),
        SecureStore.deleteItemAsync(key + COUNT_SUFFIX),
      ]);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};
