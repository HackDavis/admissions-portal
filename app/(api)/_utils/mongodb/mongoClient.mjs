import { MongoClient } from 'mongodb';

let cachedClient = null;
let cachedPromise = null;

export async function getClient() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Missing MONGODB_URI environment variable.');
  }

  if (cachedClient) {
    return cachedClient;
  }

  if (!cachedPromise) {
    const client = new MongoClient(uri);
    cachedPromise = client
      .connect()
      .then((connectedClient) => {
        cachedClient = connectedClient;
        return connectedClient;
      })
      .catch((error) => {
        client.close().catch(() => {});
        cachedPromise = null;
        cachedClient = null;
        throw error;
      });
  }

  return cachedPromise;
}

// Helper function for testing
export function resetClient() {
  cachedClient = null;
  cachedPromise = null;
}

export async function getDatabase() {
  const client = await getClient();
  return client.db();
}
