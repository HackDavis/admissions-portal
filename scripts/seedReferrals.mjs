import { randomInt } from 'crypto';
import dotenv from 'dotenv';
import { getClient } from '../app/(api)/_utils/mongodb/mongoClient.mjs';

dotenv.config({ path: './.env' });

const BASE_URL = 'https://apply.hackdavis.io';

const SOURCES = [
  'Tabling',
  'HackDavis Website',
  'Instagram/Linktree',
  'Flyers',
];

function randomCode() {
  return String(randomInt(0, 1000000)).padStart(6, '0');
}

async function seedReferrals() {
  const client = await getClient();

  try {
    const collection = client.db().collection('referrals');
    const existing = await collection.find({}).toArray();
    const usedCodes = new Set(existing.map((r) => r.code));

    for (const name of SOURCES) {
      const found = existing.find((r) => r.name === name);

      if (found) {
        console.log(`Skipped ${name} (already exists)`);
        continue;
      }

      let code = randomCode();
      while (usedCodes.has(code)) {
        code = randomCode();
      }
      usedCodes.add(code);

      await collection.insertOne({ name, code });
      existing.push({ name, code });
      console.log(`Created ${name}`);
    }

    console.log('\nReferral links:');
    for (const name of SOURCES) {
      const { code } = existing.find((r) => r.name === name);
      console.log(`${name}: ${BASE_URL}/?ref=${code}`);
    }
  } finally {
    await client.close();
  }
}

seedReferrals().catch((err) => {
  console.error('Error seeding referrals:', err);
  process.exit(1);
});
