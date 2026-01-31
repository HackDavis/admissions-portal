export async function up(db) {
  await db.createCollection('mailchimp', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        title: 'mailchimp Object Validation',
        required: [
          'batchNumber',
          'apiCallsMade',
          'maxApiCalls',
          'apiKeyIndex',
          'maxApiKeys',
          'lastUpdate',
          'lastReset',
        ],
        properties: {
          _id: {
            bsonType: 'objectId',
            description: '_id must be an ObjectId',
          },
          batchNumber: {
            bsonType: 'int',
            description: 'batchNumber must be an int',
          },
          apiCallsMade: {
            bsonType: 'int',
            description: 'apiCallsMade must be an int',
          },
          maxApiCalls: {
            bsonType: 'int',
            description: 'maxApiCalls must be an int',
          },
          apiKeyIndex: {
            bsonType: 'int',
            description: 'apiKeyIndex must be an int',
          },
          maxApiKeys: {
            bsonType: 'int',
            description: 'maxApiKeys must be an int',
          },
          lastUpdate: {
            bsonType: 'date',
            description: 'lastUpdate must be a date',
          },
          lastReset: {
            bsonType: 'date',
            description: 'lastReset must be a date',
          },
        },
        additionalProperties: false,
      },
    },
  });
}

export async function down(db) {
  await db.collection('mailchimp').drop();
}
