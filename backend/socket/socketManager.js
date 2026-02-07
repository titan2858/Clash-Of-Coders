const { getAizuProblem } = require('../utils/aizuFetcher');
const Match = require('../models/Match'); 

// Fallback problems
const LOCAL_PROBLEMS = [
    {
        problemId: "1",
        title: "Two Sum (Fallback)",
        description: "<h3>Two Sum</h3><p>Return indices of the two numbers such that they add up to target.</p><h3>Sample Input 1</h3><pre>2 7 11 15\n9</pre>",
        starterCode: { javascript: "function twoSum(nums, target) { return [0, 1]; }" },
        testCases: [{ input: "2 7 11 15\n9", expectedOutput: "0 1" }]
    }
];

const GAME_DURATION_MS = 30 * 60 * 1000;

const socketManager = (io) => {
    // In-Memory State (For fast access during game)
    const rooms = {}; 

    io.on('connection', (socket) => {
        console.log(`User Connected: ${socket.id}`);

        socket.on('join_room', async ({ roomId, username, userId }) => {
            
            // Initialize room wrapper in memory if it doesn't exist
            if (!rooms[roomId]) {
                rooms[roomId] = {
                    players: [],
                    gameState: 'waiting',
                    problem: null,
                    startTime: null,
                    hostId: null
                };
            }

            // ---------------------------------------------------------
            // 🔒 CONCURRENCY LOCK: ATOMIC DATABASE TRANSACTION
            // ---------------------------------------------------------
            // Check if this is a reconnection (user already in memory)
            const isReconnecting = rooms[roomId].players.some(p => p.username === username);

            // If it's a NEW player trying to join, enforce the DB Lock
            if (!isReconnecting) {
                try {
                    const dbResult = await Match.updateOne(
                        { 
                            roomId: roomId, 
                            // THE GUARD: Only update if index 1 (2nd player) does not exist
                            "players.1": { $exists: false } 
                        },
                        { 
                            // THE ACTION: Add player and set initial status
                            $push: { players: userId || 'guest' },
                            $setOnInsert: { status: 'waiting', createdAt: Date.now() }
                        },
                        { upsert: true } // Create room if it doesn't exist
                    );

                    // LOGIC: If we found a room but didn't modify it, it means the Guard failed (Room Full)
                    // Note: 'upsertedCount' handles the creation case.
                    if (dbResult.matchedCount > 0 && dbResult.modifiedCount === 0) {
                        console.log(`[Concurrency] Blocked user ${username} from room ${roomId} (DB Full)`);
                        socket.emit('error', { message: 'Room is full! (Database Locked)' });
                        return; // ⛔ STOP EXECUTION HERE
                    }
                } catch (err) {
                    console.error("Atomic Join Error:", err);
                    // In production, you might want to return here. For dev, we might log and continue.
                }
            }
            // ---------------------------------------------------------
            // END ATOMIC TRANSACTION
            // ---------------------------------------------------------


            // --- Standard Socket Logic Below ---

            if (rooms[roomId].gameState === 'waiting') {
                rooms[roomId].players = rooms[roomId].players.filter(p => p.connected);
            }

            // If socket is already mapped, ignore
            if (rooms[roomId].players.some(p => p.id === socket.id)) return;

            let existingPlayerIndex = -1;
            if (username !== 'Guest') {
                existingPlayerIndex = rooms[roomId].players.findIndex(p => p.username === username);
            } else {
                existingPlayerIndex = rooms[roomId].players.findIndex(p => p.username === 'Guest' && !p.connected);
            }

            if (existingPlayerIndex !== -1) {
                // HANDLE RECONNECT
                rooms[roomId].players[existingPlayerIndex].id = socket.id;
                rooms[roomId].players[existingPlayerIndex].connected = true;
                if (userId) rooms[roomId].players[existingPlayerIndex].userId = userId;
                
                socket.join(roomId);
                console.log(`User ${username} reconnected to room ${roomId}`);
                
                if (rooms[roomId].gameState === 'starting') {
                    const elapsed = Date.now() - rooms[roomId].startTime;
                    const remaining = Math.max(0, 60000 - elapsed);
                    socket.emit('match_found', { duration: remaining, players: rooms[roomId].players });
                }
                else if (rooms[roomId].gameState === 'playing' && rooms[roomId].problem) {
                     const pData = rooms[roomId].problem;
                     const gameElapsed = Date.now() - rooms[roomId].gameStartTime;
                     const gameRemaining = Math.max(0, GAME_DURATION_MS - gameElapsed);

                     socket.emit('game_start', {
                        problem: { ...pData, examples: pData.testCases },
                        players: rooms[roomId].players,
                        gameDuration: gameRemaining
                    });
                }
            } else {
                // HANDLE NEW JOIN (We passed the DB Check above)
                
                // Secondary Memory Check (Just in case DB lagged, though unlikely with await)
                if (rooms[roomId].players.length >= 2) {
                    socket.emit('error', { message: 'Room is full!' });
                    return;
                }
                
                socket.join(roomId);
                const isFirstPlayer = rooms[roomId].players.length === 0;
                
                rooms[roomId].players.push({ 
                    id: socket.id, 
                    username, 
                    userId: userId || 'guest', 
                    score: 0, 
                    connected: true,
                    isHost: isFirstPlayer 
                });
                
                if (isFirstPlayer) rooms[roomId].hostId = socket.id;
                console.log(`User ${username} added to room ${roomId}`);
            }

            // START GAME LOGIC
            if (rooms[roomId].players.length === 2 && rooms[roomId].gameState === 'waiting') {
                rooms[roomId].gameState = 'starting';
                rooms[roomId].startTime = Date.now();
                
                const COUNTDOWN_TIME = 60000; 
                console.log(`Room ${roomId}: Match found. Starting countdown.`);
                
                io.to(roomId).emit('match_found', { 
                    duration: COUNTDOWN_TIME,
                    players: rooms[roomId].players
                });

                // Fetch Problem Async
                (async () => {
                    try {
                        if (!rooms[roomId].problem) {
                            let problemData = null;
                            let retries = 2;
                            while (retries >= 0 && !problemData) {
                                try { problemData = await getAizuProblem(); } catch (e) {}
                                retries--;
                            }
                            if (!problemData) problemData = LOCAL_PROBLEMS[0];

                            rooms[roomId].problem = problemData; 
                            
                            const p1 = rooms[roomId].players[0];
                            const p2 = rooms[roomId].players[1];

                            // Update DB with Problem Details
                            await Match.findOneAndUpdate(
                                { roomId }, 
                                { 
                                    status: 'playing',
                                    problemId: problemData.problemId,
                                    testCases: problemData.testCases, 
                                    startTime: Date.now() + COUNTDOWN_TIME,
                                    player1: p1.userId,
                                    player2: p2.userId,
                                    player1Username: p1.username,
                                    player2Username: p2.username
                                },
                                { upsert: true, new: true }
                            );
                        }
                    } catch (e) { console.error("Fetch Error:", e); }
                })();

                // Start Game Timer
                setTimeout(() => {
                    if (!rooms[roomId]) return;

                    rooms[roomId].gameState = 'playing';
                    rooms[roomId].gameStartTime = Date.now();
                    const pData = rooms[roomId].problem || LOCAL_PROBLEMS[0];

                    io.to(roomId).emit('game_start', {
                        problem: {
                            id: pData.problemId,
                            title: pData.title,
                            description: pData.description,
                            starterCode: pData.starterCode,
                            examples: pData.testCases
                        },
                        players: rooms[roomId].players,
                        gameDuration: GAME_DURATION_MS 
                    });

                    // Game Over Timeout
                    setTimeout(() => {
                        if (rooms[roomId] && rooms[roomId].gameState === 'playing') {
                            const hostPlayer = rooms[roomId].players.find(p => p.isHost);
                            const winnerId = hostPlayer ? hostPlayer.id : rooms[roomId].players[0].id;
                            const dbWinnerId = hostPlayer ? hostPlayer.userId : rooms[roomId].players[0].userId;

                            rooms[roomId].gameState = 'finished';
                            Match.findOneAndUpdate({ roomId }, { status: 'finished', winner: dbWinnerId }).exec();

                            io.to(roomId).emit('game_over', { winnerId: winnerId, reason: 'timeout' });
                        }
                    }, GAME_DURATION_MS);

                }, COUNTDOWN_TIME);
            }
        });

        // Other Events
        socket.on('update_progress', ({ roomId, progress }) => {
            socket.to(roomId).emit('opponent_progress', { progress });
        });

        socket.on('submission_success', ({ roomId }) => {
            if (rooms[roomId]) rooms[roomId].gameState = 'finished';
            io.to(roomId).emit('game_over', { winnerId: socket.id, reason: 'submission' });
        });

        socket.on('disconnect', () => {
            for (const roomId in rooms) {
                const room = rooms[roomId];
                const playerIndex = room.players.findIndex(p => p.id === socket.id);
                if (playerIndex !== -1) {
                    room.players[playerIndex].connected = false;
                    if (room.gameState === 'waiting') room.players.splice(playerIndex, 1);
                }
            }
        });
    });
};

module.exports = socketManager;