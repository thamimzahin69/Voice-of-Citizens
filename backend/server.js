const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // Loads the variables from your .env file

// Initialize the Express app
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Allows your React frontend to communicate with this backend
app.use(express.json()); // Allows your server to accept and read JSON data (like vote submissions!)

// Connect to MongoDB
const uri = process.env.MONGO_URI;
mongoose.connect(uri)
  .then(() => {
    console.log('🗳️  MongoDB database connection established successfully!');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
  });

// A simple test route
app.get('/', (req, res) => {
  res.send('Welcome to the Voice of Citizens API!');
});

// A simple API route for the frontend to fetch
app.get('/api/test', (req, res) => {
  res.json({ 
    message: "Connection successful! 🚀", 
    project: "Voice of Citizens",
    status: "Backend is talking to Frontend!"
  });
});

// Start the server
app.listen(port, () => {
  console.log(`🚀 Server is running on port: ${port}`);
});