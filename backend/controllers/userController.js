const User = require('../models/User');
const Match = require('../models/Match');

//    Get User Profile & Stats
//    GET /api/users/:id
const getUserProfile = async (req, res) => 
{
  try 
  {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Fetch Match History
    // We look for matches where this user was either player1 or player2
    const matches = await Match.find({
      $or: [{ player1: req.params.id }, { player2: req.params.id }],
      status: 'finished'
    }).sort({ endTime: -1 }).limit(20); // Last 20 matches

    res.json({ user, matches });
  } 
  catch (error)   
  {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  } 
};

//   Update User Profile
//   PUT /api/users/update
 const updateUserProfile = async   (req, res) => 
{
  const { userId, username, age, college, address, bio } = req.body;

  try 
  {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Update fields
    user.username = username || user.username;
    user.age = age || user.age;
    user.college = college || user.college;
    user.address = address || user.address;
    user.bio = bio || user.bio;

    const updatedUser = await user.save();

    res.json({
      success: true,
      user: {
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        age: updatedUser.age,
        college: updatedUser.college,
        address: updatedUser.address,
        rank: updatedUser.rank,
        wins: updatedUser.wins,
        matchesPlayed: updatedUser.matchesPlayed,
        bio: updatedUser.bio
      }
    });
  } 
  catch (error) 
  {
    console.error("Update Error:", error);
    res.status(500).json({ message: 'Update failed' });
  }
};

module.exports = { getUserProfile, updateUserProfile };