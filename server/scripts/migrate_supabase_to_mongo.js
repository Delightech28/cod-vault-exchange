require('dotenv').config();
const { Client } = require('pg');
const mongoose = require('mongoose');

// Configuration via env
// Provide either POSTGRES_URL (preferred) or SUPABASE_* (deprecated).
const POSTGRES_URL = process.env.POSTGRES_URL || process.env.SOURCE_POSTGRES_URL;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cod-vault';
const TABLES = (process.env.MIGRATE_TABLES || 'profiles,listings').split(',').map(s => s.trim()).filter(Boolean);

if (!POSTGRES_URL) {
  console.error('POSTGRES_URL is required for this migration script (set your Postgres connection string).');
  process.exit(1);
}

const pgClient = new Client({ connectionString: POSTGRES_URL });

async function connectMongo() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');
}

async function migrateTable(table) {
  console.log(`Migrating table: ${table}`);
  const res = await pgClient.query(`SELECT * FROM "${table}"`);
  const rows = res.rows || [];

  const Model = mongoose.model(table, new mongoose.Schema({}, { strict: false }), table);
  if (!rows || rows.length === 0) { console.log(`No rows in ${table}`); return; }

  for (const row of rows) {
    // prefer id-like keys
    const id = row.id || row.user_id || row._id;
    const doc = { ...row };
    if (id) doc._id = String(id);
    try {
      if (id) await Model.updateOne({ _id: doc._id }, { $set: doc }, { upsert: true });
      else await Model.create(doc);
    } catch (e) {
      console.error('Error upserting row:', e.message || e);
    }
  }

  console.log(`Finished migrating ${table}: ${rows.length} records`);
}

async function run() {
  await pgClient.connect();
  console.log('Connected to Postgres');
  await connectMongo();
  for (const t of TABLES) {
    await migrateTable(t);
  }
  await pgClient.end();
  console.log('Migration complete');
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
