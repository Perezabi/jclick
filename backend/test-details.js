const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();
const jwt = require('jsonwebtoken');

async function t() {
  await mongoose.connect(process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/schoolDB');
  const t = await User.findOne({ role: 'teacher' });
  const s = await User.findOne({ role: 'student', teacherId: t._id });
  const token = jwt.sign({ id: t._id, role: 'teacher' }, process.env.JWT_SECRET || 'mySuperSecretKeyThatIs32CharactersLongMinimumForSecurity123', { expiresIn: '1d' });
  
  const response = await fetch(`http://localhost:5000/api/teacher/student-details/${s._id}`, {
    headers: { 'Authorization': token }
  });
  const data = await response.json();
  console.log(data);
  process.exit(0);
}
t();
