import { getClient } from '../app/(api)/_utils/mongodb/mongoClient.mjs';
import readline from 'readline';
import generateData from './generateData.mjs';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const uri = process.env.MONGODB_URI;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function dbSeed(collectionNames, numDocuments, wipe) {
  try {
    const client = await getClient();
    const db = client.db();

    const schema = await db.listCollections().toArray();
    const schemaKeys = [];
    for (const collection of schema) {
      schemaKeys.push(collection.name);
    }
    // schemaKeys.push('admin');

    // Prepare existingData for applications if needed
    let existingData = {};
    if (collectionNames.includes('applications')) {
      console.log(
        'Applications data requested. Fetching existing applications...'
      );

      // Check if applications collection exists
      if (!schemaKeys.includes('applications')) {
        console.error(
          'Error: Applications collection does not exist. Please run migrations first.'
        );
        await client.close();
        return;
      }

      const applications = await db
        .collection('applications')
        .find({})
        .toArray();
      existingData = { applications };
      console.log(`Found ${applications.length} existing applications.`);
    }

    for (const collectionName of collectionNames.split(' ')) {
      if (!['applications', 'mailchimp'].includes(collectionName)) {
        console.log(
          `Collection ${collectionName} not supported. Use applications or mailchimp.`
        );
        continue;
      }

      if (schemaKeys.find((key) => key === collectionName) === undefined) {
        console.log(`Collection ${collectionName} not found.`);
        continue;
      }

      const collection = db.collection(collectionName);

      if (collectionName === 'mailchimp') {
        await collection.deleteMany({});
        const [mailchimpSeed] = generateData(collectionName, numDocuments);
        await collection.insertOne(mailchimpSeed);
        console.log('1 document inserted into mailchimp');
        continue;
      }

      if (wipe === 'y') {
        await collection.deleteMany({});
        console.log(`Wiped collection: ${collectionName}`);
      }

      // Pass existingData to generateData for applications
      const fakeData = generateData(
        collectionName,
        numDocuments,
        collectionName === 'applications' ? existingData : {}
      );

      const result = await collection.insertMany(fakeData);
      console.log(
        `${result.insertedCount} documents inserted into ${collectionName}`
      );
    }

    await client.close();
  } catch (error) {
    if (error.writeErrors) {
      console.log(
        error.writeErrors[0].err.errInfo.details.schemaRulesNotSatisfied[0]
      );
    } else {
      console.error(error);
    }
  }
}

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function gatherInput() {
  try {
    if (uri.startsWith('mongodb+srv')) {
      let confirm = '';
      while (confirm !== 'y' && confirm !== 'n') {
        confirm = (
          await askQuestion(
            'YOU ARE ABOUT TO RUN A DATABASE SEEDING SCRIPT ON THE STAGING/PRODUCTION DATABASE. ARE YOU SURE YOU WANT TO CONTINUE? (y/n): '
          )
        ).toLowerCase();
        if (confirm !== 'y' && confirm !== 'n') {
          console.log('Please enter either "y" or "n".');
        }
      }

      if (confirm === 'n') throw new Error('Canceled seeding.');
    }

    const collectionNames = await askQuestion(
      'Which collection(s) would you like to generate data for? List their names (case-sensitive) separated by spaces: '
    );

    const numDocumentsStr = await askQuestion(
      'How many documents would you like to generate (mailchimp generates only one document regardless)? Enter a number: '
    );
    const numDocuments = parseInt(numDocumentsStr);

    let wipe = '';
    while (wipe !== 'y' && wipe !== 'n') {
      wipe = (
        await askQuestion(
          'Would you like to wipe the collections before seeding? (y/n): '
        )
      ).toLowerCase();
      if (wipe !== 'y' && wipe !== 'n') {
        console.log('Please enter either "y" or "n".');
      }
    }

    rl.close();

    return { collectionNames, numDocuments, wipe };
  } catch (error) {
    console.error(error);
    rl.close();
  }
}

gatherInput()
  .then(({ collectionNames, numDocuments, wipe }) => {
    console.log('\n');
    console.log('Inputs gathered:');
    console.log('Collection Names:', collectionNames);
    console.log('Number of Documents:', numDocuments);
    console.log('Wipe Collections:', wipe);
    console.log('\n');

    return dbSeed(collectionNames, numDocuments, wipe);
  })
  .catch((error) => {
    console.error('Error in gatherInput:', error);
  });
