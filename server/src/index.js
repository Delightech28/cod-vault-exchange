require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/user');

const app = express();
app.use(cors());
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cod-vault';
const PORT = process.env.PORT || 4000;

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Signup: POST /auth/signup { email, name, password }
app.post('/auth/signup', async (req, res) => {
  const { email, name, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ error: 'user already exists' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    user = await User.create({ email, name, password: hashedPassword });
    
    const token = user._id.toString();
    return res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Login: POST /auth/login { email, password }
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'invalid email or password' });
    
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.status(401).json({ error: 'invalid email or password' });
    
    const token = user._id.toString();
    return res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Get current user by token (Bearer <token>)
app.get('/auth/user', async (req, res) => {
  const auth = req.headers.authorization || '';
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.json({ user: null });
  const id = parts[1];
  try {
    const user = await User.findById(id).lean();
    if (!user) return res.json({ user: null });
    return res.json({ user: { id: user._id, email: user.email, name: user.name } });
  } catch (err) {
    return res.status(400).json({ error: 'invalid token' });
  }
});

// Generic collection endpoints (simple)
app.get('/api/:collection', async (req, res) => {
  const { collection } = req.params;
  const Model = mongoose.model(collection, new mongoose.Schema({}, { strict: false }), collection);
  // Build filter from query params (except reserved params)
  const { limit, sort, order, ...filters } = req.query;
  const query: any = {};
  Object.entries(filters).forEach(([k, v]) => { query[k] = v; });
  let q = Model.find(query).lean();
  if (sort) {
    const dir = (order === 'desc') ? -1 : 1;
    q = q.sort({ [sort]: dir });
  }
  if (limit) q = q.limit(parseInt(limit, 10));
  const docs = await q.exec();
  res.json({ data: docs });
});

app.get('/api/:collection/:id', async (req, res) => {
  const { collection, id } = req.params;
  const Model = mongoose.model(collection, new mongoose.Schema({}, { strict: false }), collection);
  const doc = await Model.findById(id).lean();
  res.json({ data: doc });
});

app.post('/api/:collection', async (req, res) => {
  const { collection } = req.params;
  const Model = mongoose.model(collection, new mongoose.Schema({}, { strict: false }), collection);
  const doc = await Model.create(req.body);
  res.json({ data: doc });
});

app.put('/api/:collection/:id', async (req, res) => {
  const { collection, id } = req.params;
  const Model = mongoose.model(collection, new mongoose.Schema({}, { strict: false }), collection);
  const doc = await Model.findByIdAndUpdate(id, req.body, { new: true }).lean();
  res.json({ data: doc });
});

app.delete('/api/:collection/:id', async (req, res) => {
  const { collection, id } = req.params;
  const Model = mongoose.model(collection, new mongoose.Schema({}, { strict: false }), collection);
  await Model.findByIdAndDelete(id);
  res.json({ success: true });
});

// Placeholder for server-side functions that used to be Supabase Functions
app.post('/functions/:name', async (req, res) => {
  const { name } = req.params;
  // Implement function handlers as needed. For now, echo.
  res.json({ name, body: req.body });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
