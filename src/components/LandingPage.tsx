import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Users, Zap, CheckCircle2, BarChart3, Clock, Target, ArrowRight, Sparkles } from 'lucide-react';
import etecLogoUrl from '/etec-logo.svg';

export default function LandingPage() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adUsername, setAdUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginWithAD } = useAuth();

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

  const handleADLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const success = await loginWithAD(adUsername);
    if (!success) {
      setError('AD authentication failed. Try: admin, director, faisal, or abeer');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">

      {/* Logo in top right corner */}
      <div className="absolute top-6 right-6 z-20">
        <img src={etecLogoUrl} alt="ETEC Logo" className="h-16 w-auto drop-shadow-lg" />
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4 py-12">
        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Branding */}
          <div className="text-gray-900 space-y-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-main rounded-lg shadow-lg">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-5xl font-extrabold text-gray-900">
                Task Tracker
              </h1>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-6xl font-extrabold leading-tight text-gray-900">
                Streamline Your
                <span className="block text-gray-700">
                  Task Management
                </span>
              </h2>
              
              <p className="text-xl text-gray-700 leading-relaxed max-w-lg">
                Enhanced task tracking and management system designed for teams.
                Track, manage, and collaborate on tasks with ease and efficiency.
              </p>
            </div>

            {/* Key Benefits */}
            <div className="flex flex-wrap gap-4 pt-4">
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200 shadow-sm">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Real-time Updates</span>
              </div>
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200 shadow-sm">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Team Collaboration</span>
              </div>
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200 shadow-sm">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Advanced Analytics</span>
              </div>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-2 gap-4 pt-6">
              <div className="group bg-white rounded-2xl p-6 border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="p-3 bg-main rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-gray-900">Secure</h3>
                <p className="text-sm text-gray-600 leading-relaxed">Enterprise-grade security with AD integration</p>
              </div>
              <div className="group bg-white rounded-2xl p-6 border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="p-3 bg-main rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-gray-900">Collaborative</h3>
                <p className="text-sm text-gray-600 leading-relaxed">Seamless team management and coordination</p>
              </div>
              <div className="group bg-white rounded-2xl p-6 border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="p-3 bg-main rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-gray-900">Fast</h3>
                <p className="text-sm text-gray-600 leading-relaxed">Lightning-fast performance and real-time sync</p>
              </div>
              <div className="group bg-white rounded-2xl p-6 border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="p-3 bg-main rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-gray-900">Analytics</h3>
                <p className="text-sm text-gray-600 leading-relaxed">Comprehensive insights and reporting</p>
              </div>
            </div>
          </div>

        {/* Right Side - Login Form */}
        <div className="bg-white rounded-3xl p-8 lg:p-10 border border-gray-200 shadow-2xl animate-fade-in-up">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-main" />
              <h3 className="text-2xl font-bold text-gray-900">Welcome Back</h3>
            </div>
            <p className="text-gray-600 text-sm">Sign in to access your dashboard</p>
          </div>

          <div className="flex gap-3 mb-8 bg-gray-100 p-1.5 rounded-xl">
            <button
              onClick={() => {
                setIsLoginMode(true);
                setError('');
              }}
              className={`flex-1 py-2.5 px-4 rounded-lg font-semibold transition-all duration-200 ${
                isLoginMode
                  ? 'bg-main text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Email Login
            </button>
            <button
              onClick={() => {
                setIsLoginMode(false);
                setError('');
              }}
              className={`flex-1 py-2.5 px-4 rounded-lg font-semibold transition-all duration-200 ${
                !isLoginMode
                  ? 'bg-white text-cyan-600 shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              AD Login
            </button>
          </div>

          {isLoginMode ? (
            <form onSubmit={handleEmailLogin} className="space-y-5">
              <div>
                <label className="block text-gray-900 font-semibold mb-2.5 text-sm">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-main focus:border-main transition-all"
                    placeholder="admin@etec.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-900 font-semibold mb-2.5 text-sm">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-main focus:border-main transition-all"
                    placeholder="Enter your password"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Test accounts: admin@etec.com, director@etec.com, faisal@etec.com
                </p>
              </div>
              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center gap-2">
                  <span className="text-red-600">⚠</span>
                  <span className="text-sm">{error}</span>
                </div>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-main text-white font-bold py-3.5 px-6 rounded-xl hover:bg-main-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
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
          ) : (
            <form onSubmit={handleADLogin} className="space-y-5">
              <div>
                <label className="block text-gray-900 font-semibold mb-2.5 text-sm">
                  AD Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={adUsername}
                    onChange={(e) => setAdUsername(e.target.value)}
                    required
                    className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-main focus:border-main transition-all"
                    placeholder="Enter your AD username"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Test: admin, director, faisal, or abeer
                </p>
              </div>
              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center gap-2">
                  <span className="text-red-600">⚠</span>
                  <span className="text-sm">{error}</span>
                </div>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-main text-white font-bold py-3.5 px-6 rounded-xl hover:bg-main-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In with AD</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
