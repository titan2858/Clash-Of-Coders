import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Zap, Trophy, ChevronDown } from 'lucide-react';
import { socket } from '../utils/socket';
import * as THREE from 'three';

const Dashboard = () => {
  const navigate = useNavigate();
  const [joinRoomId, setJoinRoomId] = useState('');
  const [username, setUsername] = useState('Guest');
  
  // Background Ref
  const mountRef = useRef(null);

  // --- 3D Background Logic ---
  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    const container = mountRef.current;
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 1000;
    const posArray = new Float32Array(particlesCount * 3);

    for(let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 20;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.03,
      color: 0x4f46e5,
      transparent: true,
      opacity: 0.8
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // Floating cubes for decoration
    const createCodeBlock = (x, y, z, color) => {
        const geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        const edges = new THREE.EdgesGeometry(geometry);
        const material = new THREE.LineBasicMaterial({ color: color, linewidth: 2 });
        const cube = new THREE.LineSegments(edges, material);
        cube.position.set(x, y, z);
        return cube;
    };
  
    const cubes = [
        createCodeBlock(-4, 2, -2, 0x3b82f6),
        createCodeBlock(4, -1, -3, 0x8b5cf6),
    ];
    cubes.forEach(cube => scene.add(cube));

    camera.position.z = 5;

    let time = 0;
    const animate = () => {
      requestAnimationFrame(animate);
      time += 0.005;
      particlesMesh.rotation.y = time * 0.05;
      particlesMesh.rotation.x = time * 0.02;
      
      cubes.forEach((cube, i) => {
          cube.rotation.x += 0.01;
          cube.rotation.y += 0.01;
          cube.position.y += Math.sin(time + i) * 0.005;
      });
      
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);
  // ---------------------------

  useEffect(() => {
    // Correctly retrieve user info from localStorage
    try {
      const userStr = localStorage.getItem('user');
      const directName = localStorage.getItem('username');
      const directEmail = localStorage.getItem('email');

      if (directName) {
          setUsername(directName);
      } else if (directEmail) {
          setUsername(directEmail.split('@')[0]);
      } else if (userStr) {
        const user = JSON.parse(userStr);
        const name = user.username || user.name || (user.email ? user.email.split('@')[0] : 'Guest');
        setUsername(name);
      }
    } catch (error) {
      console.error("Dashboard: Error parsing user data", error);
      setUsername('Guest');
    }
  }, []);

  const handleCreateRoom = () => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    if (!socket.connected) socket.connect();
    navigate(`/arena/${roomId}?isHost=true`);
  };

  const handleJoinRoom = () => {
    if (!joinRoomId) return;
    const cleanId = joinRoomId.trim().toUpperCase();
    if (!socket.connected) socket.connect();
    navigate(`/arena/${cleanId}`);
  };

  return (
    <div className="h-[calc(100vh-4rem)] relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      
      {/* 3D Background */}
      <div ref={mountRef} className="absolute inset-0 opacity-40 pointer-events-none" />

      {/* Main Content (Z-Index ensures it sits on top) */}
      <div className="relative z-10 p-8 max-w-6xl mx-auto text-white h-full overflow-y-auto">
        <h1 className="text-3xl font-bold mb-2">Welcome back, <span className="text-green-400">{username}</span></h1>
        <p className="text-slate-400 mb-8">Ready to compete?</p>

        <div className="grid md:grid-cols-2 gap-6">
            {/* Create Room Card */}
            <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-xl border border-slate-700 hover:border-orange-500 transition-colors shadow-xl">
            <div className="bg-orange-600/20 w-12 h-12 flex items-center justify-center rounded-lg mb-4">
                <Zap className="w-6 h-6 text-orange-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">Create Battle Room</h2>
            <p className="text-slate-400 mb-6 text-sm">Start a new 1v1 match and invite a friend.</p>
            <button 
                onClick={handleCreateRoom}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 rounded-lg font-bold transition-colors"
            >
                Create New Room
            </button>
            </div>

            {/* Join Room Card */}
            <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-xl border border-slate-700 hover:border-blue-500 transition-colors shadow-xl">
            <div className="bg-blue-600/20 w-12 h-12 flex items-center justify-center rounded-lg mb-4">
                <Users className="w-6 h-6 text-blue-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">Join Existing Room</h2>
            <p className="text-slate-400 mb-4 text-sm">Enter a Room ID to join a friend's game.</p>
            <div className="flex gap-2">
                <input 
                type="text" 
                placeholder="ROOM ID" 
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                className="flex-1 bg-slate-800/80 border border-slate-700 rounded-lg px-4 outline-none focus:border-blue-500 uppercase text-white placeholder-slate-500"
                />
                <button 
                onClick={handleJoinRoom}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition-colors"
                >
                Join
                </button>
            </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;