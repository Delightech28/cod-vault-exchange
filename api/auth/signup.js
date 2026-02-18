const bcrypt = require('bcryptjs');
const { connectDB } = require('./lib/db');
const User = require('./lib/User');

// Enable CORS header helper
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

    if (method === 'POST') {
      const { email, name, password } = req.body;
      if (!email || !password) return sendJson(res, { error: 'email and password required' }, 400);

      const existingUser = await User.findOne({ email });
      if (existingUser) return sendJson(res, { error: 'user already exists' }, 400);

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({ email, name, password: hashedPassword });

      const token = user._id.toString();
      return sendJson(res, { token, user: { id: user._id, email: user.email, name: user.name } });
    }

    sendJson(res, { error: 'method not allowed' }, 405);
  } catch (err) {
    console.error('signup error:', err);
    sendJson(res, { error: err.message }, 500);
  }
}
