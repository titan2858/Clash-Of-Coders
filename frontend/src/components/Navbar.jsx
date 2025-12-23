import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, Swords, Code, BookOpen, LogOut } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [username, setUsername] = useState('Guest');

  // --- FIX: Robust Username Fetching Logic ---
  useEffect(() => {
    const loadUser = () => {
      try {
        // 1. Try reading the separate 'username' key first
        const directName = localStorage.getItem('username');
        if (directName) {
            setUsername(directName);
            return;
        }

        // 2. Try reading the 'user' object
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          // Check all possible fields
          const name = user.username || user.name || (user.email ? user.email.split('@')[0] : 'Guest');
          setUsername(name);
        } else {
            setUsername('Guest');
        }
      } catch (error) {
        console.error("Navbar: Error parsing user data", error);
        setUsername('Guest');
      }
    };

    loadUser();
    // Listen for storage events (updates across tabs)
    window.addEventListener('storage', loadUser);
    return () => window.removeEventListener('storage', loadUser);
  }, [location]); // Re-run when location changes (e.g. login -> dashboard)

  const isActive = (path) => location.pathname === path ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white hover:bg-white/5";

  const handleLogout = () => {
    localStorage.clear();
    navigate('/auth');
  };

  return (
    <nav className="h-16 bg-[#1e1e1e] border-b border-gray-800 flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
          CLASH OF CODERS
        </h1>
      </div>

      <div className="flex items-center gap-2 bg-[#252526] p-1 rounded-lg border border-gray-700">
        <Link to="/dashboard" className={`flex items-center gap-2 px-4 py-2 rounded-md transition font-medium text-sm ${isActive('/dashboard')}`}>
          <Swords size={18} /> Battle
        </Link>
        <Link to="/practice" className={`flex items-center gap-2 px-4 py-2 rounded-md transition font-medium text-sm ${isActive('/practice')}`}>
          <Code size={18} /> Practice
        </Link>
        <Link to="/rules" className={`flex items-center gap-2 px-4 py-2 rounded-md transition font-medium text-sm ${isActive('/rules')}`}>
          <BookOpen size={18} /> Rules
        </Link>
        <Link to="/profile" className={`flex items-center gap-2 px-4 py-2 rounded-md transition font-medium text-sm ${isActive('/profile')}`}>
          <User size={18} /> Profile
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {/* Updated display to use state variable */}
        <span className="text-gray-400 text-sm hidden md:block">Hi, <span className="text-white font-semibold">{username}</span></span>
        <button 
          onClick={handleLogout}
          className="p-2 hover:bg-red-500/10 text-gray-500 hover:text-red-500 rounded-full transition"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;