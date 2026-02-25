const { connectDB } = require('../../lib/db');
const { ObjectId } = require('mongodb');

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
    const { collection, id } = query;

    if (!collection || !id) return sendJson(res, { error: 'collection and id required' }, 400);

    const db = require('mongoose').connection.db;
    const _id = ObjectId.isValid(id) ? new ObjectId(id) : id;

    if (method === 'GET') {
      let doc = await db.collection(collection).findOne({ _id });
      if (!doc && !ObjectId.isValid(id)) {
        // Fallback search by user_id
        doc = await db.collection(collection).findOne({ user_id: id });
      }
      return sendJson(res, { data: doc });
    }

    if (method === 'PUT') {
      let result = await db.collection(collection).findOneAndUpdate(
        { _id },
        { $set: req.body },
        { returnDocument: 'after' }
      );

      let doc = result.value || result; // behavior varies by mongodb driver version
      if (!doc && !ObjectId.isValid(id)) {
        // Fallback update by user_id
        result = await db.collection(collection).findOneAndUpdate(
          { user_id: id },
          { $set: req.body },
          { returnDocument: 'after' }
        );
        doc = result.value || result;
      }
      return sendJson(res, { data: doc });
    }

    if (method === 'DELETE') {
      let result = await db.collection(collection).deleteOne({ _id });
      if (result.deletedCount === 0 && !ObjectId.isValid(id)) {
        // Fallback delete by user_id
        await db.collection(collection).deleteOne({ user_id: id });
      }
      return sendJson(res, { success: true });
    }

    sendJson(res, { error: 'method not allowed' }, 405);
  } catch (err) {
    console.error('api collection/:id error:', err);
    sendJson(res, { error: err.message }, 500);
  }
}
