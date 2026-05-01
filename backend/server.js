const dns = require('dns'); // 👈 1. ADD THIS: Import the built-in DNS module
const fs = require('fs');
const path = require('path');
const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

dotenv.config();

// 👈 2. ADD THIS: Force Node to use Google's DNS to bypass the SRV block
dns.setServers(['8.8.8.8', '8.8.4.4']); 

const authRoutes = require('./routes/auth');
const electionRoutes = require('./routes/elections');
const dashboardRoutes = require('./routes/dashboard');
const faqRoutes = require('./routes/faq');
const complaintRoutes = require('./routes/complaints');
const activityLogRoutes = require('./routes/activityLogs');
const chatRoutes = require('./routes/chats');
const adminRoutes = require('./routes/admin');
const ballotRoutes = require('./routes/ballot');
const errorHandler = require('./middleware/errorHandler');
const registerChatSocket = require('./services/chatSocket');

const app = express();
const port = process.env.PORT || 5000;
const clientOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: clientOrigin,
    credentials: true,
  },
});

app.set('io', io);
registerChatSocket(io);

app.use(cors({ origin: clientOrigin, credentials: true }));
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
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/chats', chatRoutes);
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

// API 404s should stay JSON errors instead of falling through to the frontend.
app.use('/api', (req, res) => {
  res.status(404).json({ message: `API route not found: ${req.originalUrl}` });
});

const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');
const frontendIndexPath = path.join(frontendDistPath, 'index.html');

if (fs.existsSync(frontendIndexPath)) {
  app.use(express.static(frontendDistPath));
}

// Catch-all route for client-side navigation in production builds.
app.get('/{*splat}', (req, res) => {
  if (fs.existsSync(frontendIndexPath)) {
    return res.sendFile(frontendIndexPath);
  }

  return res.status(404).json({
    message: 'Frontend build not found. Run the frontend dev server or build the frontend first.',
  });
});

app.use(errorHandler);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('🗳️  MongoDB database connection established successfully!');
    server.listen(port, () => {
      console.log(`🚀 Server is running on port: ${port}`);
    });
  })
  .catch((err) => {
    console.error(' MongoDB connection error:', err);
  });
