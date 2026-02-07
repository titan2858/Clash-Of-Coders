const express = require('express');
const http = require('http'); 
const { Server } = require('socket.io'); 
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');

// Routes Imports
const authRoutes = require('./routes/authRoutes');
const gameRoutes = require('./routes/gameRoutes');
const userRoutes = require('./routes/userRoutes'); 
const aiRoutes = require('./routes/aiRoutes');

// Import the Socket Manager function we created in step 2
const socketManager = require('./socket/socketManager');


dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app); 




// --- DEBUGGING MIDDLEWARE ---
// This prints every incoming request to your backend terminal
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});     



// Setup Socket.io
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Make sure this matches your Frontend URL
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());
   
// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);

// Initialize Socket Logic
socketManager(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));