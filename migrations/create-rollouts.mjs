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
}

export async function down(db) {
  await db.collection('rollouts').drop();
}
