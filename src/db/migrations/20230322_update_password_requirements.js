module.exports = {
  async up(db) {
    // Get all users
    const users = await db.collection('users').find({}).toArray();

    // Log migration start
    console.log(
      `Starting migration to update password requirements for ${users.length} users`
    );

    // Define a counter for affected records
    let updatedCount = 0;

    // Update schema validation rules for the users collection
    await db.command({
      collMod: 'users',
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['email', 'password', 'name'],
          properties: {
            email: {
              bsonType: 'string',
              pattern: '^\\S+@\\S+\\.\\S+$',
              description: 'Must be a valid email address',
            },
            password: {
              bsonType: 'string',
              minLength: 8,
              description: 'Must be at least 8 characters',
            },
            name: {
              bsonType: 'string',
              description: 'Must be a string',
            },
            failedLoginAttempts: {
              bsonType: 'int',
              description: 'Number of failed login attempts',
            },
            lockUntil: {
              bsonType: ['date', 'null'],
              description: 'Account lock expiry time',
            },
          },
        },
      },
      validationLevel: 'moderate',
    });

    // Add the new fields to all users if they don't exist
    const result = await db.collection('users').updateMany(
      {},
      {
        $set: {
          failedLoginAttempts: 0,
          lockUntil: null,
        },
      }
    );

    updatedCount = result.modifiedCount;

    // Log migration completion
    console.log(`Successfully updated ${updatedCount} user records`);
  },

  async down(db) {
    // Remove the added fields
    await db.collection('users').updateMany(
      {},
      {
        $unset: {
          failedLoginAttempts: '',
          lockUntil: '',
        },
      }
    );

    // Log rollback
    console.log('Successfully rolled back password requirement changes');
  },
};
