const Match = require('../models/Match');
const User = require('../models/User');
const { executeCode } = require('../utils/jdoodle');
const { v4: uuidv4 } = require('uuid');

// RAM Cache
const activeGames = {};
  
// Helper function to calculate rank
const calculateRank = (wins) => {
    if (wins >= 50) return 'Grandmaster';
    if (wins >= 25) return 'Hacker';
    if (wins >= 10) return 'Coder';
    if (wins >= 3) return 'Apprentice';
    return 'Novice';
};  

//  Create a new game room
const createRoom = async (req, res) => 
{
  const { userId } = req.body;
  try {
    const roomId = uuidv4().slice(0, 6).toUpperCase();
    const p1 = userId ? userId.toString() : 'guest';
    
    const match = await Match.create({
      roomId,
      player1: p1,
      status: 'waiting',
      createdAt: Date.now()
    });

    res.status(201).json({ success: true, roomId, match });
  } 
  catch (error) 
  {
    console.error("Create Room Error:", error);
    res.status(500).json({ message: "Error creating room" });
  }
};

//  Start game (API fallback)
const startGame = async (req, res) => {
  res.status(200).json({ message: "Start game via socket" });
};

// Run Code (Public Test Cases - No Score)
const runCode = async (req, res) => 
{
  const { roomId, sourceCode, language } = req.body;
  const cleanRoomId = roomId ? roomId.trim() : "";

  let gameData = activeGames[cleanRoomId];
  if (!gameData) 
  {
      try 
      {
        const match = await Match.findOne({ roomId: cleanRoomId });
        if (match && match.testCases && match.testCases.length > 0) 
        {
            gameData = { problemId: match.problemId, testCases: match.testCases };
            activeGames[cleanRoomId] = gameData;
        }
      } 
      catch(e) 
      { 
        return res.status(500).json({ message: "DB Error" });
      }
  }

  if (!gameData || !gameData.testCases.length) 
  {
      return res.status(404).json({ message: "No test cases found for this room" });
  }

  const testCase = gameData.testCases[0]; 

  try 
  {
      const result = await executeCode(sourceCode, language, testCase.input);
      
      if (result.error) 
      {
          return res.status(200).json({ success: false, error: result.error });
      }

      const actual = (result.stdout || "").toString().trim();
      const expected = (testCase.expectedOutput || "").toString().trim();
      const passed = actual === expected;

      res.json({ 
          success: true, 
          result: {
              input: testCase.input,
              actual: actual,
              expected: expected,
              passed: passed
          }
      });

  } 
  catch (error) 
  {
      console.error("[RUN] Error:", error);
      res.status(500).json({ message: "Execution failed" });
  }
};

// Submit Code (Hidden Test Cases - Ranked)
const submitCode = async (req, res) => {
  const { roomId, userId, sourceCode, language } = req.body;
  const cleanRoomId = roomId ? roomId.trim() : "";

  console.log(`[SUBMIT] Processing submission for Room: ${cleanRoomId}`);

  let gameData = activeGames[cleanRoomId];
  
  if (!gameData) 
  {
      try 
      {
        const match = await Match.findOne({ roomId: cleanRoomId });
        
        if (!match) return res.status(404).json({ message: "Game session not found" });
        if (!match.testCases || match.testCases.length === 0) return res.status(404).json({ message: "Game corrupted (No test cases)" });

        gameData = { problemId: match.problemId, testCases: match.testCases };
        activeGames[cleanRoomId] = gameData;
      } 
      catch (dbError) 
      { 
          return res.status(500).json({ message: "Database error" }); 
      }
  }

  try 
  {
      let allPassed = true;
      const results = [];

      for (const [index, testCase] of gameData.testCases.entries()) {
        const result = await executeCode(sourceCode, language, testCase.input);
        
        if (result.error) return res.status(200).json({ success: false, isWin: false, results: [], error: result.error });

        const actual = (result.stdout || "").toString().trim();
        const expected = (testCase.expectedOutput || "").toString().trim();
        const passed = actual === expected;

        if (!passed) allPassed = false;

        results.push({
          id: index + 1,
          passed: passed,
          input: testCase.input,
          actual: actual, 
          expected: expected 
        });
      }

      // Win Condition
      if (allPassed) {
        const match = await Match.findOne({ roomId: cleanRoomId });
        
        // Ensure match isn't already finished by someone else
        if (match && match.status !== 'finished') {
          match.status = 'finished';
          match.winner = userId;
          await match.save();
          
          //  Update Stats for BOTH Players ---
          const players = [match.player1, match.player2];
          
          // Use Promise.all to update both users in parallel
          await Promise.all(players.map(async (pid) => {
              if (!pid || pid === 'guest' || pid === 'guest_user') return;

              try {
                  const user = await User.findById(pid);
                  if (user) {
                      // Increment matches played for EVERYONE (Winner and Loser)
                      user.matchesPlayed = (user.matchesPlayed || 0) + 1;
                      
                      // If this is the winner, increment wins and check rank
                      if (pid === userId) {
                          user.wins = (user.wins || 0) + 1;
                          user.rank = calculateRank(user.wins);
                      }
                      
                      await user.save();
                      console.log(`[STATS] Updated stats for user ${pid}`);
                  }
              } catch (err) {
                  console.error(`[STATS] Failed to update user ${pid}:`, err);
              }
          }));

          return res.json({ success: true, results, isWin: true });
        }
      }

      res.json({ success: true, results, isWin: false });

  } catch (error) {
      console.error("[SUBMIT] Execution Error:", error);
      res.status(500).json({ message: "Error processing submission" });
  }
};

module.exports = { createRoom, startGame, submitCode, runCode };