const manualEntrySchema = {
  bsonType: 'object',
  required: ['addedById', 'addedByEmail', 'addedAt'],
  properties: {
    addedById: {
      bsonType: 'string',
      description: 'addedById must be a string',
    },
    addedByEmail: {
      bsonType: 'string',
      description: 'addedByEmail must be a string',
    },
    addedAt: {
      bsonType: 'date',
      description: 'addedAt must be a date',
    },
    invitedAt: {
      bsonType: 'date',
      description: 'invitedAt must be a date',
    },
  },
  description: 'manualEntry records which admin added the application and when',
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
  schema.properties.manualEntry = manualEntrySchema;

  await db.command({
    collMod: 'applications',
    validator: { $jsonSchema: schema },
  });
}

export async function down(db) {
  const schema = await getApplicationsSchema(db);
  delete schema.properties.manualEntry;

  await db.command({
    collMod: 'applications',
    validator: { $jsonSchema: schema },
  });
}
