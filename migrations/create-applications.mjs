import fs from 'fs';
import path from 'path';

const dataPath = path.resolve(
  process.cwd(),
  'app/_data/db_validation_data.json'
);
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const years = [...new Set(data.years)];
const shirtSizes = [...new Set(data.shirtSizes)];
const statuses = [...new Set(data.statuses)];

export async function up(db) {
  await db.createCollection('applications', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        title: 'applications Object Validation',
        required: [
          'email',
          'firstName',
          'lastName',
          'phone',
          'age',
          'isOver18',
          'isUCDavisStudent',
          'university',
          'countryOfResidence',
          'levelOfStudy',
          'major',
          'year',
          'shirtSize',
          'dietaryRestrictions',
          'connectWithSponsors',
          'attendedHackDavis',
          'firstHackathon',
          'linkedin',
          'connectWithHackDavis',
          'connectWithMLH',
          'mlhAgreements',
          'status',
          'wasWaitlisted',
          'submittedAt',
        ],
        properties: {
          _id: {
            bsonType: 'objectId',
            description: '_id must be an ObjectId',
          },
          email: {
            bsonType: 'string',
            description: 'email must be an string',
          },
          firstName: {
            bsonType: 'string',
            description: 'firstName must be an string',
          },
          lastName: {
            bsonType: 'string',
            description: 'lastName must be an string',
          },
          phone: {
            bsonType: 'string',
            description: 'phone must be an string',
          },
          age: {
            bsonType: 'int',
            description: 'age must be an int',
          },
          isOver18: {
            bsonType: 'bool',
            description: 'isOver18 must be a bool',
          },
          isUCDavisStudent: {
            bsonType: 'bool',
            description: 'isUCDavisStudent must be a bool',
          },
          university: {
            bsonType: 'string',
            description: 'university must be an string',
          },
          countryOfResidence: {
            bsonType: 'string',
            description: 'countryOfResidence must be an string',
          },
          levelOfStudy: {
            bsonType: 'string',
            description: 'levelOfStudy must be an string',
          },
          major: {
            bsonType: 'string',
            description: 'major must be an string',
          },
          minorOrDoubleMajor: {
            bsonType: 'string',
            description: 'minorOrDoubleMajor must be an string',
          },
          college: {
            bsonType: 'array',
            items: {
              bsonType: 'string',
              description: 'college must be a string',
            },
            description: 'college must be an array of strings',
          },
          year: {
            bsonType: 'string',
            enum: years,
            description: `year must be one of: ${years.join(', ')}`,
          },
          shirtSize: {
            bsonType: 'string',
            enum: shirtSizes,
            description: `shirtSize must be one of: ${shirtSizes.join(', ')}`,
          },
          dietaryRestrictions: {
            bsonType: 'array',
            items: {
              bsonType: 'string',
              description: 'dietaryRestriction must be a string',
            },
            description: 'dietaryRestrictions must be an array of strings',
          },
          connectWithSponsors: {
            bsonType: 'bool',
            description: 'connectWithSponsors must be a bool',
          },
          gender: {
            bsonType: 'array',
            items: {
              bsonType: 'string',
              description: 'gender must be a string',
            },
            description: 'gender must be an array of strings',
          },
          race: {
            bsonType: 'array',
            items: {
              bsonType: 'string',
              description: 'race must be a string',
            },
            description: 'race must be an array of strings',
          },
          attendedHackDavis: {
            bsonType: 'bool',
            description: 'attendedHackDavis must be a bool',
          },
          firstHackathon: {
            bsonType: 'bool',
            description: 'firstHackathon must be a bool',
          },
          linkedin: {
            bsonType: 'string',
            description: 'linkedin must be an string',
          },
          githubOrPortfolio: {
            bsonType: 'string',
            description: 'githubOrPortfolio must be an string',
          },
          resume: {
            bsonType: 'string',
            description: 'resume must be an string',
          },
          connectWithHackDavis: {
            bsonType: 'bool',
            description: 'connectWithHackDavis must be a bool',
          },
          connectWithMLH: {
            bsonType: 'bool',
            description: 'connectWithMLH must be a bool',
          },
          mlhAgreements: {
            bsonType: 'object',
            required: ['mlhCodeOfConduct', 'eventLogisticsInformation'],
            properties: {
              mlhCodeOfConduct: {
                bsonType: 'bool',
                description: 'mlhCodeOfConduct must be a bool',
              },
              eventLogisticsInformation: {
                bsonType: 'bool',
                description: 'eventLogisticsInformation must be a bool',
              },
            },
          },
          status: {
            bsonType: 'string',
            enum: statuses,
            description: `status must be one of: ${statuses.join(', ')}`,
          },
          wasWaitlisted: {
            bsonType: 'bool',
            description: 'wasWaitlisted must be a boolean',
          },
          batchNumber: {
            bsonType: 'int',
            description: 'batchNumber must be a int',
          },
          submittedAt: {
            bsonType: 'date',
            description: 'submittedAt must be a date',
          },
          reviewedAt: {
            bsonType: 'date',
            description: 'reviewedAt must be a date',
          },
          processedAt: {
            bsonType: 'date',
            description: 'processedAt must be a date',
          },
        },
        additionalProperties: false,
      },
    },
  });
}

export async function down(db) {
  await db.collection('applications').drop();
}
