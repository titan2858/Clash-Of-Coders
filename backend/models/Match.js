const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema({
    roomId: 
    {
        type: String,
        required: true,
        unique: true
    },
    player1: 
    {
        type: String
    },
    player2: 
    {
        type: String
    },
    player1Username: 
    {
        type: String,
        default: 'Guest'
    },
    player2Username: 
    {
        type: String,
        default: 'Guest'
    },
    winner: 
    {
        type: String
    },
    problemId: 
    {
        type: String
    },
    testCases: [{
        input: { type: String },
        expectedOutput: { type: String }
    }],
    status: 
    {
        type: String,
        enum: ['waiting', 'playing', 'finished', 'aborted'],
        default: 'waiting'
    },        
    startTime: 
    {
        type: Date
    },
    endTime: 
    {
        type: Date
    }
}, { timestamps: true });

module.exports = mongoose.model('Match', MatchSchema);