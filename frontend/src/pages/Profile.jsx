import React, { useState, useEffect } from 'react';
import { 
  User, Mail, MapPin, Calendar, BookOpen, Trophy, 
  Target, Zap, Edit2, Save, X, Loader2, Swords 
} from 'lucide-react';
import { getUserProfile, updateUserProfile } from '../utils/api';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [matches, setMatches] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
        let userId = localStorage.getItem('userId') || localStorage.getItem('_id');
        
        if (!userId) {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    const localUser = JSON.parse(userStr);
                    userId = localUser._id || localUser.id;
                } catch(e) {}
            }
        }

        if (!userId) {
            setLoading(false);
            return;
        }

        const response = await getUserProfile(userId);
        setUser(response.data.user);
        setMatches(response.data.matches);
        setFormData(response.data.user); 
    } catch (error) {
        console.error("Failed to load profile", error);
    } finally {
        setLoading(false);
    }
  };

  const handleUpdate = async () => {
      try {
          const response = await updateUserProfile({
              userId: user._id,
              ...formData
          });
          setUser(response.data.user);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          setIsEditing(false);
      } catch (error) {
          alert("Failed to update profile");
      }
  };

  // Helper for Rank Colors
  const getRankColor = (rank) => {
    switch(rank) {
        case 'Grandmaster': return 'bg-purple-600 text-white border border-purple-400';
        case 'Hacker': return 'bg-red-600 text-white border border-red-400';
        case 'Coder': return 'bg-orange-500 text-white border border-orange-300';
        case 'Apprentice': return 'bg-blue-500 text-white border border-blue-300';
        default: return 'bg-gray-600 text-gray-200 border border-gray-500'; // Novice
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (!user) return <div className="min-h-screen bg-[#0f172a] text-white p-8">User not found. Please log in again.</div>;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: USER CARD */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-[#1e293b] rounded-2xl p-6 border border-slate-700 relative">
            <div className="absolute top-4 right-4">
                {isEditing ? (
                    <div className="flex gap-2">
                        <button onClick={handleUpdate} className="p-2 bg-green-600 rounded-full hover:bg-green-500"><Save className="w-4 h-4" /></button>
                        <button onClick={() => setIsEditing(false)} className="p-2 bg-red-600 rounded-full hover:bg-red-500"><X className="w-4 h-4" /></button>
                    </div>
                ) : (
                    <button onClick={() => setIsEditing(true)} className="p-2 bg-slate-700 rounded-full hover:bg-slate-600"><Edit2 className="w-4 h-4 text-gray-300" /></button>
                )}
            </div>

            <div className="flex flex-col items-center">
              <div className="w-24 h-24 bg-gradient-to-tr from-orange-500 to-red-600 rounded-full flex items-center justify-center text-3xl font-bold mb-4">
                {user.username ? user.username[0].toUpperCase() : 'U'}
              </div>
              
              {isEditing ? (
                  <input className="bg-[#0f172a] text-center border border-slate-600 rounded px-2 py-1 mb-1 text-xl font-bold w-full" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} />
              ) : (
                  <h2 className="text-2xl font-bold">{user.username}</h2>
              )}
              
              <span className={`px-4 py-1.5 rounded-full text-xs font-bold mt-2 shadow-lg ${getRankColor(user.rank)}`}>
                {user.rank}
              </span>
            </div>

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3 text-slate-300">
                <Mail className="w-5 h-5 text-slate-500" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <Calendar className="w-5 h-5 text-slate-500" />
                {isEditing ? (
                    <input type="number" className="bg-[#0f172a] border border-slate-600 rounded px-2 py-1 w-full" value={formData.age} onChange={(e) => setFormData({...formData, age: e.target.value})} placeholder="Age" />
                ) : (
                    <span>{user.age ? `${user.age} Years Old` : 'Age not set'}</span>
                )}
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <BookOpen className="w-5 h-5 text-slate-500" />
                {isEditing ? (
                    <input className="bg-[#0f172a] border border-slate-600 rounded px-2 py-1 w-full" value={formData.college} onChange={(e) => setFormData({...formData, college: e.target.value})} placeholder="College" />
                ) : (
                    <span>{user.college || 'College not set'}</span>
                )}
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <MapPin className="w-5 h-5 text-slate-500" />
                {isEditing ? (
                    <input className="bg-[#0f172a] border border-slate-600 rounded px-2 py-1 w-full" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="Address" />
                ) : (
                    <span>{user.address || 'Address not set'}</span>
                )}
              </div>
            </div>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-700 text-center">
              <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{user.wins}</div>
              <div className="text-xs text-slate-400">Wins</div>
            </div>
            <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-700 text-center">
              <Target className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{user.matchesPlayed}</div>
              <div className="text-xs text-slate-400">Matches</div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: MATCH HISTORY */}
        <div className="md:col-span-2">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-500" /> Match History
          </h3>

          <div className="space-y-4">
            {matches.length === 0 ? (
                <div className="text-slate-500 text-center py-10 bg-[#1e293b] rounded-xl">No matches played yet.</div>
            ) : (
                matches.map((match) => {
                    let opponentName = "Unknown";
                    if (match.player1 === user._id) {
                        opponentName = match.player2Username || "Opponent";
                    } else {
                        opponentName = match.player1Username || "Opponent";
                    }

                    return (
                        <div key={match._id} className="bg-[#1e293b] p-4 rounded-xl border border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between hover:border-orange-500/50 transition-colors gap-4">
                            <div className="flex-1">
                                <div className="font-bold text-lg mb-1 flex items-center gap-2">
                                    {match.problemId || "Unknown Problem"}
                                </div>
                                <div className="text-sm text-slate-400 flex items-center gap-2">
                                    <Swords className="w-4 h-4" /> vs <span className="text-white font-medium">{opponentName}</span>
                                </div>
                                <div className="text-xs text-slate-500 font-mono mt-1">Room: {match.roomId}</div>
                            </div>
                            
                            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                                <div className="text-xs text-slate-500">
                                    {match.createdAt ? new Date(match.createdAt).toLocaleDateString() : 'Just now'}
                                </div>
                                {match.winner === user._id ? (
                                    <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold border border-green-500/50">VICTORY</span>
                                ) : (
                                    <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/50">DEFEAT</span>
                                )}
                            </div>
                        </div>
                    );
                })
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;