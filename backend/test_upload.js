const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const mongoUri = 'mongodb+srv://akaygill64_db_user:dCwh5nUlliRVeiRr@tradenal.lgn3ep3.mongodb.net/?appName=Tradenal';
const jwtSecret = 'your-super-secret-jwt-key-min-32-characters-long';

async function run() {
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');
  
  const db = mongoose.connection.db;
  const userId = '6a4739314399b51c02ac5db8';
  
  // Get one trade
  const trade = await db.collection('trades').findOne({ userId: new mongoose.Types.ObjectId(userId) });
  if (!trade) {
    console.error('No trade found for user');
    await mongoose.disconnect();
    return;
  }
  console.log('Testing with Trade ID:', trade._id);

  // Generate JWT token
  const token = jwt.sign({ userId }, jwtSecret, { expiresIn: '1h' });
  console.log('Generated JWT token');

  // Create boundary and multipart payload manually
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  
  // Dummy image content
  const fileContent = 'dummy image content';
  const bodyParts = [
    `--${boundary}\r\n`,
    `Content-Disposition: form-data; name="screenshots"; filename="test.jpg"\r\n`,
    `Content-Type: image/jpeg\r\n\r\n`,
    `${fileContent}\r\n`,
    `--${boundary}\r\n`,
    `Content-Disposition: form-data; name="types"\r\n\r\n`,
    `before\r\n`,
    `--${boundary}--\r\n`
  ];
  
  const body = bodyParts.join('');
  
  console.log('Sending request to local backend...');
  try {
    const res = await fetch(`http://localhost:5000/api/trades/${trade._id}/screenshots`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: body
    });
    
    console.log('Response Status:', res.status);
    const text = await res.text();
    console.log('Response Text:', text);
  } catch (err) {
    console.error('Request failed:', err);
  }
  
  await mongoose.disconnect();
}

run().catch(console.error);
