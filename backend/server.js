const dns = require('dns'); // 👈 1. ADD THIS: Import the built-in DNS module
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

// 👈 2. ADD THIS: Force Node to use Google's DNS to bypass the SRV block
dns.setServers(['8.8.8.8', '8.8.4.4']); 

const authRoutes = require('./routes/auth');
const electionRoutes = require('./routes/elections');
const dashboardRoutes = require('./routes/dashboard');
const faqRoutes = require('./routes/faq');
const complaintRoutes = require('./routes/complaints');
const adminRoutes = require('./routes/admin');
const ballotRoutes = require('./routes/ballot');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/elections', electionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/faq', faqRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ballots', ballotRoutes);

// Simple health check endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Connection successful! ',
    project: 'Voice of Citizens',
    status: 'Backend is talking to Frontend!',
  });
});

// Catch-all route
app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
});

app.use(errorHandler);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('🗳️  MongoDB database connection established successfully!');
    app.listen(port, () => {
      console.log(`🚀 Server is running on port: ${port}`);
    });
  })
  .catch((err) => {
    console.error(' MongoDB connection error:', err);
  });
