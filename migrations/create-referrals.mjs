export async function up(db) {
  await db.createCollection('referrals', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        title: 'referrals Object Validation',
        required: ['name', 'code'],
        properties: {
          _id: {
            bsonType: 'objectId',
            description: '_id must be an objectId',
          },
          name: {
            bsonType: 'string',
            description: 'name must be a string',
          },
          code: {
            bsonType: 'string',
            pattern: '^[0-9]{6}$',
            description: 'code must be a six digit string',
          },
        },
        additionalProperties: false,
      },
    },
  });

  await db.collection('referrals').createIndex({ code: 1 }, { unique: true });
  await db.collection('referrals').createIndex({ name: 1 }, { unique: true });
}

export async function down(db) {
  await db.collection('referrals').drop();
}
