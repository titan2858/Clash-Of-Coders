import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Swords, Clock, Trophy, Zap, Target, Crown, ChevronDown } from 'lucide-react';

const Rules = () => {
  const mountRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = (e) => {
      setScrollY(e.target.scrollTop);
    };
    const container = document.querySelector('.scroll-container');
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    const container = mountRef.current;
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Particle system for background
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

    // Floating code blocks
    const createCodeBlock = (x, y, z, color) => {
      const geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
      const edges = new THREE.EdgesGeometry(geometry);
      const material = new THREE.LineBasicMaterial({ color: color, linewidth: 2 });
      const cube = new THREE.LineSegments(edges, material);
      cube.position.set(x, y, z);
      return cube;
    };

    const cubes = [
      createCodeBlock(-3, 2, 0, 0x3b82f6),
      createCodeBlock(3, -2, -2, 0x8b5cf6),
      createCodeBlock(0, 0, -3, 0x06b6d4),
      createCodeBlock(-2, -1, -1, 0x10b981),
      createCodeBlock(2, 1, -2, 0xf59e0b)
    ];

    cubes.forEach(cube => scene.add(cube));

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x4f46e5, 1);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    camera.position.z = 8;

    let time = 0;
    const animate = () => {
      requestAnimationFrame(animate);
      time += 0.01;

      // Rotate particles slowly
      particlesMesh.rotation.y = time * 0.05;
      particlesMesh.rotation.x = time * 0.02;

      // Animate code blocks
      cubes.forEach((cube, i) => {
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
        cube.position.y += Math.sin(time + i) * 0.01;
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

  const rules = [
    { icon: Target, title: "Same Problem", desc: "Both players receive identical coding challenges", color: "from-blue-500 to-cyan-500" },
    { icon: Clock, title: "30 Minutes", desc: "Race against time to solve the problem", color: "from-purple-500 to-pink-500" },
    { icon: Zap, title: "First to Solve", desc: "First submission with 100% accuracy wins", color: "from-orange-500 to-red-500" },
    { icon: Trophy, title: "Hidden Tests", desc: "Secret test cases determine the real winner", color: "from-green-500 to-emerald-500" }
  ];

  const ranks = [
    { name: "Bronze", range: "0-1000", color: "bg-amber-700" },
    { name: "Silver", range: "1000-1500", color: "bg-gray-400" },
    { name: "Gold", range: "1500-2000", color: "bg-yellow-400" },
    { name: "Platinum", range: "2000-2500", color: "bg-cyan-400" },
    { name: "Diamond", range: "2500-3000", color: "bg-blue-400" },
    { name: "Grandmaster", range: "3000+", color: "bg-purple-500" }
  ];

  return (
    <div className="h-[calc(100vh-4rem)] relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* 3D Background */}
      <div ref={mountRef} className="absolute inset-0 opacity-40" />

      {/* Content */}
      <div className="scroll-container relative h-full overflow-y-auto">
        {/* Hero Section */}
        <div className="min-h-screen flex flex-col items-center justify-center px-8 text-center relative">
          <div 
            className="space-y-6 animate-in fade-in duration-1000"
            style={{ transform: `translateY(${scrollY * 0.3}px)` }}
          >
            <div className="inline-block">
              <Swords className="w-20 h-20 text-purple-500 mx-auto mb-4 animate-pulse" />
            </div>
            <h1 className="text-7xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 animate-in slide-in-from-bottom duration-1000">
              WHY CLASH OF CODERS?
            </h1>
            <p className="text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed animate-in slide-in-from-bottom duration-1000 delay-200">
              Traditional coding is <span className="text-gray-400">solitary</span>. 
              CLash of Coders changes this. Think fast, optimize under pressure, and compete in real-time.
            </p>
            <div className="flex gap-4 justify-center pt-8 animate-in slide-in-from-bottom duration-1000 delay-300">
              <div className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-bold">
                BETTER
              </div>
              <div className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-bold">
                FASTER
              </div>
            </div>
          </div>
          <ChevronDown className="absolute bottom-8 w-8 h-8 text-gray-600 animate-bounce" />
        </div>

        {/* Rules Cards */}
        <div className="py-20 px-8">
          <h2 className="text-5xl font-black text-center mb-16 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500">
            ⚔️ BATTLE RULES
          </h2>
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6">
            {rules.map((rule, i) => {
              const Icon = rule.icon;
              return (
                <div 
                  key={i}
                  className="group relative bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl p-8 rounded-2xl border border-slate-700/50 hover:border-purple-500/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20"
                  style={{ 
                    animationDelay: `${i * 100}ms`,
                    animation: 'slideInRight 0.6s ease-out forwards'
                  }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${rule.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-500`} />
                  <div className="relative z-10">
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${rule.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2 text-white">{rule.title}</h3>
                    <p className="text-gray-400 text-lg">{rule.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Timeout Rule */}
          <div className="max-w-4xl mx-auto mt-8 bg-gradient-to-r from-red-950/50 to-orange-950/50 backdrop-blur-xl p-8 rounded-2xl border border-red-700/50">
            <h3 className="text-2xl font-bold text-orange-400 mb-3 flex items-center gap-3">
              <Clock className="w-7 h-7" /> Timeout Scenario
            </h3>
            <p className="text-gray-300 text-lg">
              If time runs out, the player with the most passed test cases wins. 
              Partial solutions count—every test case matters!
            </p>
          </div>
        </div>

        {/* Elo System */}
        <div className="py-20 px-8 bg-gradient-to-b from-transparent via-purple-950/20 to-transparent">
          <h2 className="text-5xl font-black text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
            🚀 ELO RATING SYSTEM
          </h2>
          <p className="text-center text-gray-400 text-xl mb-12 max-w-3xl mx-auto">
            Just like Chess, gain rating points for wins, lose them for defeats. 
            Beat higher-ranked players for bigger rewards. Climb the ranks!
          </p>
          
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-4">
            {ranks.map((rank, i) => (
              <div 
                key={i}
                className="group relative bg-slate-900/50 backdrop-blur-xl p-6 rounded-xl border border-slate-700/50 hover:scale-105 transition-all duration-300"
                style={{ 
                  animationDelay: `${i * 50}ms`,
                  animation: 'fadeIn 0.5s ease-out forwards'
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-4 h-4 rounded-full ${rank.color} group-hover:scale-150 transition-transform duration-300`} />
                  <Crown className={`w-5 h-5 text-gray-600 group-hover:text-${rank.color.split('-')[1]}-400 transition-colors`} />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{rank.name}</h3>
                <p className="text-sm text-gray-500 font-mono">{rank.range} Elo</p>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="py-20 px-8 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">
              READY TO BATTLE?
            </h2>
            <p className="text-xl text-gray-400">
              Join thousands of developers competing in real-time coding battles.
            </p>
            <button className="px-12 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xl font-bold rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:shadow-purple-500/50">
              START BATTLING NOW
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .scroll-container::-webkit-scrollbar {
          width: 8px;
        }

        .scroll-container::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
        }

        .scroll-container::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #8b5cf6, #ec4899);
          border-radius: 4px;
        }

        .scroll-container::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #7c3aed, #db2777);
        }
      `}</style>
    </div>
  );
};

export default Rules;