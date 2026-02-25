const { connectDB } = require('../lib/db');

function setCors(res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
}

function sendJson(res, data, status = 200) {
  setCors(res);
  res.status(status).json(data);
}

export default async function handler(req, res) {
  const { method, query } = req;

  if (method === 'OPTIONS') {
    setCors(res);
    res.status(200).end();
    return;
  }

  try {
    await connectDB();
    const { collection } = query;

    if (!collection) return sendJson(res, { error: 'collection name required' }, 400);

    const db = require('mongoose').connection.db;

    if (method === 'GET') {
      // Fetch all docs from collection with optional filters
      const { limit, sort, order, ...filters } = req.query;
      const q = {};
      Object.entries(filters).forEach(([k, v]) => {
        if (!['collection', 'limit', 'sort', 'order'].includes(k)) {
          let val = v;
          if (v === 'true') val = true;
          else if (v === 'false') val = false;
          // Don't cast to number if it's a field known to be a string-id like 'code' or user_id
          else if (!['code', 'user_id', 'id'].includes(k) && !isNaN(v) && v !== '') {
            val = Number(v);
          }
          q[k] = val;
        }
      });

      // Map 'id' to '_id' for MongoDB
      if (q.id) {
        const idVal = q.id;
        delete q.id;
        try {
          const { ObjectId } = require('mongodb');
          if (ObjectId.isValid(idVal)) {
            q._id = new ObjectId(idVal);
          } else {
            q._id = idVal;
          }
        } catch (e) {
          q._id = idVal;
        }
      }

      // Special handling for email verification codes check to ensure string match
      if (collection === 'email_verification_codes' && q.code) {
        q.code = String(q.code);
      }

      console.log(`🔍 [VERCEL API] GET ${collection} query:`, JSON.stringify(q));

      let cursor = db.collection(collection).find(q);
      if (sort) {
        const dir = order === 'desc' ? -1 : 1;
        cursor = cursor.sort({ [sort]: dir });
      }
      if (limit) cursor = cursor.limit(parseInt(limit, 10));

      const data = await cursor.toArray();
      return sendJson(res, { data });
    }

    if (method === 'POST') {
      // Insert doc
      const result = await db.collection(collection).insertOne(req.body);
      const doc = { ...req.body, _id: result.insertedId };
      return sendJson(res, { data: doc }, 201);
    }

    sendJson(res, { error: 'method not allowed' }, 405);
  } catch (err) {
    console.error('api collection error:', err);
    sendJson(res, { error: err.message }, 500);
  }
}
