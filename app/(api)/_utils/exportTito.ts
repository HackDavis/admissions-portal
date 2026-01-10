import dotenv from 'dotenv';
import fs from 'fs';
import { MongoClient } from 'mongodb';

dotenv.config();

// Env
const { MONGODB_URI, MONGODB_DB, MONGODB_COLLECTION } = process.env;

if (!MONGODB_URI || !MONGODB_DB || !MONGODB_COLLECTION) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Types
interface Applicant {
  _id: any;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
}

// MongoDB
async function getTentativelyAcceptedApplicants(): Promise<Applicant[]> {
  const client = new MongoClient(MONGODB_URI!);
  await client.connect();

  console.log('Connected to MongoDB');

  const db = client.db(MONGODB_DB);
  const collection = db.collection<Applicant>(MONGODB_COLLECTION!);

  const totalCount = await collection.countDocuments();
  console.log(`Total documents in collection: ${totalCount}`);

  const statuses = await collection.distinct('status');
  console.log(`Available statuses:`, statuses);

  const applicants = await collection
    .find({ status: 'tentatively_accepted' })
    .toArray();

  console.log(`Found ${applicants.length} tentatively_accepted applicants`);

  await client.close();
  return applicants;
}

// Csv export
function exportToCSV(applicants: Applicant[], filename: string) {
  // Tito import format: Email, First Name, Last Name
  const headers = 'Email,First Name,Last Name';

  const rows = applicants.map((applicant) => {
    // Escape fields that might contain commas
    const email = `"${applicant.email}"`;
    const firstName = `"${applicant.firstName}"`;
    const lastName = `"${applicant.lastName}"`;

    return `${email},${firstName},${lastName}`;
  });

  const csvContent = [headers, ...rows].join('\n');

  fs.writeFileSync(filename, csvContent);
  console.log(`\nCSV exported to: ${filename}`);
  console.log(`   Contains ${applicants.length} applicants`);
}

// Main
async function main() {
  console.log('Exporting tentatively accepted applicants to CSV...\n');

  try {
    const applicants = await getTentativelyAcceptedApplicants();

    if (applicants.length === 0) {
      console.log('No tentatively accepted applicants found');
      return;
    }

    // Show preview of first few applicants
    console.log('\nPreview of first 3 applicants:');
    applicants.slice(0, 3).forEach((applicant, index) => {
      console.log(
        `   ${index + 1}. ${applicant.firstName} ${applicant.lastName} (${
          applicant.email
        })`
      );
    });

    if (applicants.length > 3) {
      console.log(`   ... and ${applicants.length - 3} more`);
    }

    // Export to CSV
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `tito_import_${timestamp}.csv`;

    exportToCSV(applicants, filename);

    console.log('\nExport complete!');
    console.log('\nNext steps:');
    console.log('   1. Go to your Tito RSVP Lists');
    console.log('   2. Navigate to Actions → Manage Invitations');
    console.log("   3. Click the 'Import' button");
    console.log(`   4. Upload the file: ${filename}`);
    console.log('   5. Tito will create all the invitations!');
    console.log(
      '\nAfter import, you can use the prepareMailChimp.ts to fetch the invitation URLs and send them via Mailchimp.'
    );
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
