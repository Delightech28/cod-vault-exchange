const { connectDB } = require('../lib/db');
const User = require('../lib/User');

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
  const { method } = req;

  if (method === 'OPTIONS') {
    setCors(res);
    res.status(200).end();
    return;
  }

  try {
    await connectDB();

    if (method === 'GET') {
      const auth = req.headers.authorization || '';
      const parts = auth.split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return sendJson(res, { user: null });
      }

      const id = parts[1];
      const user = await User.findById(id).lean();
      if (!user) return sendJson(res, { user: null });

      return sendJson(res, { user: { id: user._id, email: user.email, name: user.name } });
    }

    sendJson(res, { error: 'method not allowed' }, 405);
  } catch (err) {
    console.error('auth/user error:', err);
    sendJson(res, { error: err.message }, 500);
  }
}
