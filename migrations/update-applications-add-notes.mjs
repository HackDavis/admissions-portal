const notesSchema = {
  bsonType: 'array',
  items: {
    bsonType: 'object',
    required: ['_id', 'body', 'authorId', 'authorEmail', 'createdAt'],
    properties: {
      _id: {
        bsonType: 'string',
        description: '_id must be a string',
      },
      body: {
        bsonType: 'string',
        description: 'body must be a string',
      },
      authorId: {
        bsonType: 'string',
        description: 'authorId must be a string',
      },
      authorEmail: {
        bsonType: 'string',
        description: 'authorEmail must be a string',
      },
      createdAt: {
        bsonType: 'date',
        description: 'createdAt must be a date',
      },
      updatedAt: {
        bsonType: 'date',
        description: 'updatedAt must be a date',
      },
    },
  },
  description: 'notes must be an array of note objects',
};

// collMod replaces the validator wholesale, so the existing schema is read back
// and amended rather than redeclared here.
async function getApplicationsSchema(db) {
  const [collection] = await db
    .listCollections({ name: 'applications' })
    .toArray();

  const schema = collection?.options?.validator?.$jsonSchema;
  if (!schema) {
    throw new Error('applications collection has no $jsonSchema validator.');
  }

  return schema;
}

export async function up(db) {
  const schema = await getApplicationsSchema(db);
  schema.properties.notes = notesSchema;

  await db.command({
    collMod: 'applications',
    validator: { $jsonSchema: schema },
  });
}

export async function down(db) {
  const schema = await getApplicationsSchema(db);
  delete schema.properties.notes;

  await db.command({
    collMod: 'applications',
    validator: { $jsonSchema: schema },
  });

  await db
    .collection('applications')
    .updateMany({}, { $unset: { notes: '' } });
}
