import { useState } from 'react';
import { Mail, Lock, Chrome, Github, Twitter } from 'lucide-react';
// import RippleGrid from './RippleGrid';
import Hyperspeed from './Hyperspeed';
import Particles from './Particles';

interface LoginScreenProps {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState('michael@salesly.ai');
  const [password, setPassword] = useState('demo123');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30">

      // the component will fill the height/width of its parent container, edit the CSS to change this
      // the options below are the default values

      <Hyperspeed
        effectOptions={{
          onSpeedUp: () => { },
          onSlowDown: () => { },
          distortion: 'turbulentDistortion',
          length: 400,
          roadWidth: 10,
          islandWidth: 2,
          lanesPerRoad: 4,
          fov: 90,
          fovSpeedUp: 150,
          speedUp: 2,
          carLightsFade: 0.4,
          totalSideLightSticks: 20,
          lightPairsPerRoadWay: 40,
          shoulderLinesWidthPercentage: 0.05,
          brokenLinesWidthPercentage: 0.1,
          brokenLinesLengthPercentage: 0.5,
          lightStickWidth: [0.12, 0.5],
          lightStickHeight: [1.3, 1.7],
          movingAwaySpeed: [60, 80],
          movingCloserSpeed: [-120, -160],
          carLightsLength: [400 * 0.03, 400 * 0.2],
          carLightsRadius: [0.05, 0.14],
          carWidthPercentage: [0.3, 0.5],
          carShiftX: [-0.8, 0.8],
          carFloorSeparation: [0, 5],
          colors: {
            roadColor: 0x080808,
            islandColor: 0x0a0a0a,
            background: 0x000000,
            shoulderLines: 0xFFFFFF,
            brokenLines: 0xFFFFFF,
            leftCars: [0xD856BF, 0x6750A2, 0xC247AC],
            rightCars: [0x03B3C3, 0x0E5EA5, 0x324555],
            sticks: 0x03B3C3,
          }
        }}
      />
      </div>

      <div className="w-full max-w-5xl relative z-10">
        <div className="flex gap-6 items-stretch">
          <div className="hidden lg:flex lg:w-96 bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden relative animate-float animate-glow">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-purple-500/20 blur-3xl animate-pulse opacity-60"></div>
            <div className="absolute inset-0 bg-gradient-to-tl from-pink-500/10 via-transparent to-cyan-500/10 blur-2xl"></div>
            <div className="absolute inset-0 z-5">
              <Particles
                particleCount={400}
                particleSpread={10}
                speed={0.2}
                particleColors={['#00d4ff', '#00ffff', '#0099ff', '#66ccff']}
                alphaParticles={true}
                particleBaseSize={120}
                sizeRandomness={1.2}
                cameraDistance={12}
                disableRotation={false}
              />
            </div>
            <img
              src="/images/login_logo.png"
              alt="Logo"
              className="w-full h-full object-cover relative z-10 mix-blend-screen"
            />
          </div>

          <div className="flex-1 bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700 shadow-2xl p-8 animate-glow" style={{ animationDelay: '1s' }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  id="username"
                  type="email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#004AAD] focus:border-transparent transition-all"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#004AAD] focus:border-transparent transition-all"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center text-slate-400 cursor-pointer">
                <input type="checkbox" className="mr-2 rounded border-slate-700 bg-slate-800 text-[#004AAD] focus:ring-[#004AAD]" defaultChecked />
                Remember me
              </label>
              <a href="#" className="text-[#004AAD] hover:text-[#003380] transition-colors">
                Forgot password?
              </a>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-3 bg-[#004AAD] text-white rounded-lg font-semibold hover:bg-[#003380] transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Sign In
              </button>
              <button
                type="button"
                className="flex items-center justify-center w-12 h-12 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-all duration-200 group"
              >
                <Chrome className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
              </button>
              <button
                type="button"
                className="flex items-center justify-center w-12 h-12 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-all duration-200 group"
              >
                <Github className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
              </button>
              <button
                type="button"
                className="flex items-center justify-center w-12 h-12 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-all duration-200 group"
              >
                <Twitter className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <a href="#" className="text-[#004AAD] hover:text-[#003380] font-medium transition-colors">
              Sign up
            </a>
          </p>
          </div>
        </div>
      </div>
    </div>
  );
}
