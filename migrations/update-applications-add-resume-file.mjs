const INDEX_NAME = 'attached_uploadedAt';

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
  schema.properties.resumeFileId = {
    bsonType: 'string',
    description: 'resumeFileId must be a string (GridFS file id)',
  };

  await db.command({
    collMod: 'applications',
    validator: { $jsonSchema: schema },
  });

  // Helps orphan sweep
  await db
    .collection('resumes.files')
    .createIndex(
      { 'metadata.attached': 1, 'metadata.uploadedAt': 1 },
      { name: INDEX_NAME }
    );
}

export async function down(db) {
  const schema = await getApplicationsSchema(db);
  delete schema.properties.resumeFileId;

  await db.command({
    collMod: 'applications',
    validator: { $jsonSchema: schema },
  });

  await db
    .collection('resumes.files')
    .dropIndex(INDEX_NAME)
    .catch(() => {});
}
