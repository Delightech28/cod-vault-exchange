require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/user');

const app = express();
app.use(cors());
app.use(express.json());
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const { ObjectId, GridFSBucket } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cod-vault';
const PORT = process.env.PORT || 4000;

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
  socket.on('disconnect', () => console.log('Socket disconnected:', socket.id));
});

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

// Helper to get or create model for a collection
function getModel(collection) {
  if (mongoose.models[collection]) {
    return mongoose.models[collection];
  }
  return mongoose.model(collection, new mongoose.Schema({}, { strict: false }), collection);
}

// Generic collection endpoints (simple)
app.get('/api/:collection', async (req, res) => {
  const { collection } = req.params;
  const Model = getModel(collection);
  // Build filter from query params (except reserved params)
  const { limit, sort, order, ...filters } = req.query;
  const query = {};
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
  const Model = getModel(collection);
  const doc = await Model.findById(id).lean();
  res.json({ data: doc });
});

app.post('/api/:collection', async (req, res) => {
  const { collection } = req.params;
  const Model = getModel(collection);
  const doc = await Model.create(req.body);
  try { io.emit(`${collection}:INSERT`, doc); } catch(e){}
  res.json({ data: doc });
});

app.put('/api/:collection/:id', async (req, res) => {
  const { collection, id } = req.params;
  const Model = getModel(collection);
  const doc = await Model.findByIdAndUpdate(id, req.body, { new: true }).lean();
  try { io.emit(`${collection}:UPDATE`, doc); } catch(e){}
  res.json({ data: doc });
});

app.delete('/api/:collection/:id', async (req, res) => {
  const { collection, id } = req.params;
  const Model = getModel(collection);
  await Model.findByIdAndDelete(id);
  try { io.emit(`${collection}:DELETE`, { id }); } catch(e){}
  res.json({ success: true });
});

// Storage endpoints (GridFS + multer)
const upload = multer({ storage: multer.memoryStorage() });

// Ensure GridFSBucket after connection
let gridBucket = null;
mongoose.connection.once('open', () => {
  gridBucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
});

// Upload file: multipart form, fields: bucket, path, file
app.post('/storage/upload', upload.single('file'), async (req, res) => {
  try {
    if (!gridBucket) return res.status(500).json({ error: 'storage not ready' });
    const file = req.file;
    const { bucket = 'default', path = file?.originalname || 'file' } = req.body || {};
    if (!file) return res.status(400).json({ error: 'file required' });

    const uploadStream = gridBucket.openUploadStream(file.originalname, {
      contentType: file.mimetype,
      metadata: { bucket, path }
    });
    uploadStream.end(file.buffer);
    uploadStream.on('finish', (f) => {
      const id = f._id.toString();
      const publicUrl = `${req.protocol}://${req.get('host')}/storage/file/${id}`;
      return res.json({ data: { id, filename: f.filename, path: f.metadata.path, publicUrl } });
    });
    uploadStream.on('error', (err) => res.status(500).json({ error: err.message }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve file by id
app.get('/storage/file/:id', async (req, res) => {
  try {
    if (!gridBucket) return res.status(500).send('storage not ready');
    const { id } = req.params;
    const _id = ObjectId.isValid(id) ? new ObjectId(id) : null;
    if (!_id) return res.status(400).send('invalid id');
    const filesColl = mongoose.connection.db.collection('uploads.files');
    const fileDoc = await filesColl.findOne({ _id });
    if (!fileDoc) return res.status(404).send('not found');
    res.setHeader('Content-Type', fileDoc.contentType || 'application/octet-stream');
    const downloadStream = gridBucket.openDownloadStream(_id);
    downloadStream.on('error', () => res.status(404).end());
    downloadStream.pipe(res);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Get public URL by bucket+path
app.get('/storage/publicUrl', async (req, res) => {
  try {
    const { bucket = 'default', path } = req.query;
    if (!path) return res.status(400).json({ error: 'path required' });
    const filesColl = mongoose.connection.db.collection('uploads.files');
    const fileDoc = await filesColl.findOne({ 'metadata.bucket': bucket, 'metadata.path': String(path) });
    if (!fileDoc) return res.status(404).json({ data: { publicUrl: null } });
    const id = fileDoc._id.toString();
    const publicUrl = `${req.protocol}://${req.get('host')}/storage/file/${id}`;
    res.json({ data: { publicUrl } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create signed URL (simple passthrough to public URL for now)
app.get('/storage/signedUrl', async (req, res) => {
  try {
    const { bucket = 'default', path } = req.query;
    if (!path) return res.status(400).json({ error: 'path required' });
    const filesColl = mongoose.connection.db.collection('uploads.files');
    const fileDoc = await filesColl.findOne({ 'metadata.bucket': bucket, 'metadata.path': String(path) });
    if (!fileDoc) return res.status(404).json({ data: { signedUrl: null } });
    const id = fileDoc._id.toString();
    const signedUrl = `${req.protocol}://${req.get('host')}/storage/file/${id}`;
    res.json({ data: { signedUrl } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Placeholder for server-side functions that used to be Supabase Functions
app.post('/functions/:name', async (req, res) => {
  const { name } = req.params;
  // Implement function handlers as needed. For now, echo.
  res.json({ name, body: req.body });
});

server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
