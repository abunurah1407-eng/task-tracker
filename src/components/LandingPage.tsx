import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Users, Zap, CheckCircle2, BarChart3, Clock, Target, ArrowRight, Sparkles } from 'lucide-react';
import etecLogoUrl from '/etec-logo.svg';

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const success = await login(email, password);
    if (!success) {
      setError('Invalid email or password. Use password: password123 for testing');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Add entrance animations
    const elements = document.querySelectorAll('.animate-on-load');
    elements.forEach((el, index) => {
      setTimeout(() => {
        el.classList.add('animate-fade-in-up');
        if (el instanceof HTMLElement) {
          el.style.opacity = '1';
        }
      }, index * 100);
    });
  }, []);

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden flex flex-col">
      {/* Cybersecurity Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        {/* Hexagon Grid Pattern */}
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hexagons" width="50" height="43.4" patternUnits="userSpaceOnUse" patternTransform="translate(0,0) scale(1,1)">
              <polygon points="24.8,22 37.3,14.2 37.3,5.8 24.8,-2 12.3,5.8 12.3,14.2" fill="none" stroke="#3b82f6" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hexagons)" />
        </svg>
      </div>

      {/* Circuit Lines Pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="circuit" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M0,50 L100,50 M50,0 L50,100" stroke="#10b981" strokeWidth="0.5" fill="none"/>
              <circle cx="50" cy="50" r="2" fill="#10b981"/>
              <circle cx="0" cy="50" r="1.5" fill="#3b82f6"/>
              <circle cx="100" cy="50" r="1.5" fill="#3b82f6"/>
              <circle cx="50" cy="0" r="1.5" fill="#3b82f6"/>
              <circle cx="50" cy="100" r="1.5" fill="#3b82f6"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#circuit)" />
        </svg>
      </div>

      {/* Animated Grid Overlay */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="w-full h-full" style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Enhanced Header */}
      <header className="relative z-30 bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 shadow-lg flex-shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 animate-on-load">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <h1 className="text-lg font-bold text-white leading-tight">الادارة العامة للامن السبراني</h1>
              <p className="text-xs text-slate-300 leading-tight">ادارة عمليات الامن السبراني</p>
            </div>
          </div>
          <div className="flex items-center gap-4 animate-on-load">
            <a href="https://etec.gov.sa" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
              <img src={etecLogoUrl} alt="ETEC Logo" className="h-12 w-auto drop-shadow-lg brightness-0 invert" />
            </a>
          </div>
        </div>
      </header>

      <div className="relative z-10 flex-1 flex items-center justify-center p-3 overflow-hidden">
        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center h-full">
          {/* Left Side - Branding */}
          <div className="text-white space-y-3 animate-on-load text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-2 mb-2">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg shadow-xl animate-pulse-slow">
                <Target className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl lg:text-3xl font-extrabold text-white">
                Task Tracker
              </h1>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl lg:text-4xl font-extrabold leading-tight text-white animate-slide-in-left">
                Streamline Your
                <span className="block bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent animate-gradient">
                  Task Management
                </span>
              </h2>
              
              <p className="text-sm lg:text-base text-slate-300 leading-relaxed max-w-lg mx-auto lg:mx-0">
                Enhanced task tracking and management system designed for cybersecurity teams.
                Track, manage, and collaborate on tasks with enterprise-grade security.
              </p>
            </div>

            {/* Key Benefits */}
            <div className="flex flex-wrap gap-1.5 pt-1 justify-center lg:justify-start">
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/20 shadow-lg hover:bg-white/20 transition-all animate-fade-in-delay-1 hover:scale-105">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                <span className="text-[10px] font-medium text-white">Real-time Updates</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/20 shadow-lg hover:bg-white/20 transition-all animate-fade-in-delay-2 hover:scale-105">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                <span className="text-[10px] font-medium text-white">Team Collaboration</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/20 shadow-lg hover:bg-white/20 transition-all animate-fade-in-delay-3 hover:scale-105">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                <span className="text-[10px] font-medium text-white">Advanced Analytics</span>
              </div>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="group bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/20 shadow-lg hover:shadow-xl hover:bg-white/20 transition-all duration-300 hover:-translate-y-1 animate-fade-in-delay-1">
                <div className="p-1.5 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg w-fit mb-2 group-hover:scale-110 transition-transform shadow-lg">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-bold text-sm mb-0.5 text-white">Secure</h3>
                <p className="text-[10px] text-slate-300 leading-tight">Enterprise security</p>
              </div>
              <div className="group bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/20 shadow-lg hover:shadow-xl hover:bg-white/20 transition-all duration-300 hover:-translate-y-1 animate-fade-in-delay-2">
                <div className="p-1.5 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg w-fit mb-2 group-hover:scale-110 transition-transform shadow-lg">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-bold text-sm mb-0.5 text-white">Collaborative</h3>
                <p className="text-[10px] text-slate-300 leading-tight">Team management</p>
              </div>
              <div className="group bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/20 shadow-lg hover:shadow-xl hover:bg-white/20 transition-all duration-300 hover:-translate-y-1 animate-fade-in-delay-3">
                <div className="p-1.5 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg w-fit mb-2 group-hover:scale-110 transition-transform shadow-lg">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-bold text-sm mb-0.5 text-white">Fast</h3>
                <p className="text-[10px] text-slate-300 leading-tight">Real-time sync</p>
              </div>
              <div className="group bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/20 shadow-lg hover:shadow-xl hover:bg-white/20 transition-all duration-300 hover:-translate-y-1 animate-fade-in-delay-4">
                <div className="p-1.5 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg w-fit mb-2 group-hover:scale-110 transition-transform shadow-lg">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-bold text-sm mb-0.5 text-white">Analytics</h3>
                <p className="text-[10px] text-slate-300 leading-tight">Insights & reports</p>
              </div>
            </div>
          </div>

        {/* Right Side - Login Form */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-5 lg:p-7 border border-white/30 shadow-2xl animate-on-load animate-fade-in-up">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-5 h-5 text-main animate-spin-slow" />
              <h3 className="text-xl font-bold text-gray-900">Welcome Back</h3>
            </div>
            <p className="text-gray-600 text-sm">Sign in to access your dashboard</p>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-gray-900 font-semibold mb-2 text-sm">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-main focus:border-main transition-all"
                  placeholder="admin@etec.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-gray-900 font-semibold mb-2 text-sm">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-main focus:border-main transition-all"
                  placeholder="Enter your password"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Test: admin@etec.com, director@etec.com, faisal@etec.com
              </p>
            </div>
            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-800 px-4 py-2.5 rounded-lg flex items-center gap-2 animate-shake">
                <span className="text-red-600">⚠</span>
                <span className="text-sm">{error}</span>
              </div>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-main text-white font-bold py-3 px-6 rounded-lg hover:bg-main-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group hover:scale-105"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
        </div>
      </div>
    </div>
  );
}
