export async function up(db) {
  await db.createCollection('rollouts', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        title: 'Rollouts Object Validation',
        required: ['component_key', 'rollout_time'],
        properties: {
          _id: {
            bsonType: 'objectId',
            description: '_id must be an ObjectId',
          },
          component_key: {
            bsonType: 'string',
            description: 'component_key must be a string',
          },
          rollout_time: {
            bsonType: 'number',
            description: 'rollout_time in milliseconds since epoch',
          },
          rollback_time: {
            bsonType: 'number',
            description: 'rollback_time in milliseconds since epoch',
          },
        },
        additionalProperties: false,
      },
    },
  });

  await db.collection('rollouts').insertOne(
  {
    component_key: 'applications',
    rollout_time: Date.parse('2026-09-04T00:00:00Z'), // change the date???
    rollback_time: Date.parse('2027-09-04T00:00:00Z'), // this too
  });
}

export async function down(db) {
  await db.collection('rollouts').drop();
}
