// It uses Mongoose to connect your Node.js app to the MongoDB Atlas cloud.

const mongoose = require('mongoose');  

const connectDB = async () => 
{
  try 
  {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  }  
  catch (error) 
  {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};
  
module.exports = connectDB;