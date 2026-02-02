import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Users, Zap, CheckCircle2, BarChart3, Target, ArrowRight, Sparkles } from 'lucide-react';
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
      setError('Invalid email or password');
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
      <header className="relative z-30 bg-gradient-to-r from-slate-950 via-indigo-950/98 via-blue-950/95 to-slate-950 backdrop-blur-xl border-b-2 border-cyan-400/60 shadow-2xl flex-shrink-0 overflow-hidden">
        {/* Advanced Hexagonal Security Grid */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="advancedHex" x="0" y="0" width="80" height="69.28" patternUnits="userSpaceOnUse">
                <polygon points="40,4 60,18 60,46 40,60 20,46 20,18" fill="none" stroke="#06b6d4" strokeWidth="1" opacity="0.5"/>
                <polygon points="40,4 50,11 50,25 40,32 30,25 30,11" fill="none" stroke="#3b82f6" strokeWidth="0.8" opacity="0.4"/>
                <circle cx="40" cy="32" r="2" fill="#06b6d4" opacity="0.6"/>
                <circle cx="50" cy="18" r="1.5" fill="#3b82f6" opacity="0.5"/>
                <circle cx="30" cy="18" r="1.5" fill="#3b82f6" opacity="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#advancedHex)" />
          </svg>
        </div>
        
        {/* Complex Network Topology */}
        <div className="absolute inset-0 opacity-25">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            {/* Primary network paths */}
            <path d="M0,20 L150,20 L200,12 L350,12 L400,20 L600,20 L650,12 L800,12" 
                  stroke="#06b6d4" strokeWidth="2" fill="none" opacity="0.5" strokeDasharray="5,3"/>
            <path d="M0,40 L120,40 L180,32 L320,32 L380,40 L580,40 L640,32 L800,32" 
                  stroke="#3b82f6" strokeWidth="2" fill="none" opacity="0.5" strokeDasharray="5,3"/>
            
            {/* Secondary data streams */}
            <path d="M50,15 Q200,10 350,15 T650,15" 
                  stroke="#22d3ee" strokeWidth="1.5" fill="none" opacity="0.4"/>
            <path d="M100,35 Q250,30 400,35 T700,35" 
                  stroke="#60a5fa" strokeWidth="1.5" fill="none" opacity="0.4"/>
            
            {/* Network nodes with glow */}
            <circle cx="200" cy="12" r="4" fill="#06b6d4" opacity="0.7">
              <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite"/>
            </circle>
            <circle cx="400" cy="20" r="4" fill="#3b82f6" opacity="0.7">
              <animate attributeName="opacity" values="0.7;1;0.7" dur="2.5s" repeatCount="indefinite"/>
            </circle>
            <circle cx="180" cy="32" r="4" fill="#06b6d4" opacity="0.7">
              <animate attributeName="opacity" values="0.7;1;0.7" dur="1.8s" repeatCount="indefinite"/>
            </circle>
            <circle cx="380" cy="40" r="4" fill="#3b82f6" opacity="0.7">
              <animate attributeName="opacity" values="0.7;1;0.7" dur="2.2s" repeatCount="indefinite"/>
            </circle>
            
            {/* Interconnecting security lines */}
            <line x1="200" y1="12" x2="180" y2="32" stroke="#06b6d4" strokeWidth="1.5" opacity="0.4"/>
            <line x1="400" y1="20" x2="380" y2="40" stroke="#3b82f6" strokeWidth="1.5" opacity="0.4"/>
            <line x1="200" y1="12" x2="400" y2="20" stroke="#22d3ee" strokeWidth="1" opacity="0.3" strokeDasharray="3,3"/>
          </svg>
        </div>
        
        {/* Animated Scanning Beams */}
        <div className="absolute inset-0 opacity-15">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>
          <div className="absolute top-1/3 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        {/* Vertical Security Beams */}
        <div className="absolute inset-0 opacity-25">
          <div className="absolute top-0 left-[15%] w-0.5 h-full bg-gradient-to-b from-transparent via-cyan-400/60 to-transparent"></div>
          <div className="absolute top-0 left-[35%] w-0.5 h-full bg-gradient-to-b from-transparent via-blue-400/60 to-transparent"></div>
          <div className="absolute top-0 right-[35%] w-0.5 h-full bg-gradient-to-b from-transparent via-blue-400/60 to-transparent"></div>
          <div className="absolute top-0 right-[15%] w-0.5 h-full bg-gradient-to-b from-transparent via-cyan-400/60 to-transparent"></div>
        </div>
        
        {/* Data Particles Effect */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="25" r="1.5" fill="#06b6d4">
              <animate attributeName="cy" values="25;15;25" dur="3s" repeatCount="indefinite"/>
            </circle>
            <circle cx="300" cy="30" r="1.5" fill="#3b82f6">
              <animate attributeName="cy" values="30;20;30" dur="2.5s" repeatCount="indefinite"/>
            </circle>
            <circle cx="500" cy="20" r="1.5" fill="#22d3ee">
              <animate attributeName="cy" values="20;10;20" dur="3.5s" repeatCount="indefinite"/>
            </circle>
            <circle cx="700" cy="35" r="1.5" fill="#60a5fa">
              <animate attributeName="cy" values="35;25;35" dur="2.8s" repeatCount="indefinite"/>
            </circle>
          </svg>
        </div>
        
        {/* Glowing Corner Accents */}
        <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-cyan-500/25 via-cyan-400/15 to-transparent blur-3xl"></div>
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-blue-500/25 via-blue-400/15 to-transparent blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-cyan-500/25 via-cyan-400/15 to-transparent blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-tl from-blue-500/25 via-blue-400/15 to-transparent blur-3xl"></div>
        
        {/* Security Matrix Code Effect */}
        <div className="absolute inset-0 opacity-8">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="matrixCode" x="0" y="0" width="100" height="20" patternUnits="userSpaceOnUse">
                <text x="5" y="15" fontSize="12" fill="#06b6d4" opacity="0.3" fontFamily="monospace">01</text>
                <text x="25" y="15" fontSize="12" fill="#3b82f6" opacity="0.3" fontFamily="monospace">10</text>
                <text x="45" y="15" fontSize="12" fill="#22d3ee" opacity="0.3" fontFamily="monospace">11</text>
                <text x="65" y="15" fontSize="12" fill="#60a5fa" opacity="0.3" fontFamily="monospace">00</text>
                <text x="85" y="15" fontSize="12" fill="#06b6d4" opacity="0.3" fontFamily="monospace">01</text>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#matrixCode)" />
          </svg>
        </div>
        
        {/* Radial Security Rings */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20%" cy="50%" r="30" fill="none" stroke="#06b6d4" strokeWidth="1" opacity="0.3"/>
            <circle cx="20%" cy="50%" r="50" fill="none" stroke="#3b82f6" strokeWidth="1" opacity="0.2"/>
            <circle cx="80%" cy="50%" r="30" fill="none" stroke="#06b6d4" strokeWidth="1" opacity="0.3"/>
            <circle cx="80%" cy="50%" r="50" fill="none" stroke="#3b82f6" strokeWidth="1" opacity="0.2"/>
          </svg>
        </div>
        
        {/* Binary Data Stream */}
        <div className="absolute inset-0 opacity-12">
          <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"></div>
          <div className="absolute top-1/2 left-[10%] w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
          <div className="absolute top-1/2 left-[30%] w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
          <div className="absolute top-1/2 left-[50%] w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
          <div className="absolute top-1/2 left-[70%] w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.9s' }}></div>
          <div className="absolute top-1/2 left-[90%] w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '1.2s' }}></div>
        </div>
        
        {/* Advanced Security Wave Patterns */}
        <div className="absolute inset-0 opacity-15">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="waveGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3"/>
                <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.4"/>
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.3"/>
              </linearGradient>
              <linearGradient id="waveGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
                <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.4"/>
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.3"/>
              </linearGradient>
            </defs>
            <path d="M0,10 Q200,5 400,10 T800,10" fill="none" stroke="url(#waveGradient1)" strokeWidth="1.5" opacity="0.5"/>
            <path d="M0,45 Q200,50 400,45 T800,45" fill="none" stroke="url(#waveGradient2)" strokeWidth="1.5" opacity="0.5"/>
          </svg>
        </div>
        
        {/* Encryption Key Symbols */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(15%, 25%)">
              <path d="M0,0 L8,0 L8,4 L12,4 L12,8 L0,8 Z" fill="none" stroke="#06b6d4" strokeWidth="1" opacity="0.4"/>
              <circle cx="12" cy="6" r="2" fill="none" stroke="#06b6d4" strokeWidth="1" opacity="0.4"/>
            </g>
            <g transform="translate(85%, 25%)">
              <path d="M0,0 L8,0 L8,4 L12,4 L12,8 L0,8 Z" fill="none" stroke="#3b82f6" strokeWidth="1" opacity="0.4"/>
              <circle cx="12" cy="6" r="2" fill="none" stroke="#3b82f6" strokeWidth="1" opacity="0.4"/>
            </g>
            <g transform="translate(50%, 70%)">
              <path d="M0,0 L8,0 L8,4 L12,4 L12,8 L0,8 Z" fill="none" stroke="#22d3ee" strokeWidth="1" opacity="0.4"/>
              <circle cx="12" cy="6" r="2" fill="none" stroke="#22d3ee" strokeWidth="1" opacity="0.4"/>
            </g>
          </svg>
        </div>
        
        {/* Digital Pulse Rings */}
        <div className="absolute inset-0 opacity-8">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10%" cy="50%" r="20" fill="none" stroke="#06b6d4" strokeWidth="1" opacity="0.3">
              <animate attributeName="r" values="20;40;20" dur="3s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.3;0.1;0.3" dur="3s" repeatCount="indefinite"/>
            </circle>
            <circle cx="90%" cy="50%" r="20" fill="none" stroke="#3b82f6" strokeWidth="1" opacity="0.3">
              <animate attributeName="r" values="20;40;20" dur="3.5s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.3;0.1;0.3" dur="3.5s" repeatCount="indefinite"/>
            </circle>
          </svg>
        </div>
        
        {/* Cross-Hatch Security Grid */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="crossHatch" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="30" y2="30" stroke="#06b6d4" strokeWidth="0.5" opacity="0.2"/>
                <line x1="30" y1="0" x2="0" y2="30" stroke="#3b82f6" strokeWidth="0.5" opacity="0.2"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#crossHatch)" />
          </svg>
        </div>
        
        {/* Active Security Indicators */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-2 left-2 w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
          <div className="absolute top-2 left-5 w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
          <div className="absolute top-2 right-5 w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
        </div>
        
        {/* Firewall Protection Layers */}
        <div className="absolute inset-0 opacity-12">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="firewallPattern" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="50" height="50" fill="none" stroke="#ef4444" strokeWidth="1" opacity="0.2"/>
                <line x1="0" y1="25" x2="50" y2="25" stroke="#ef4444" strokeWidth="0.5" opacity="0.15"/>
                <line x1="25" y1="0" x2="25" y2="50" stroke="#ef4444" strokeWidth="0.5" opacity="0.15"/>
                <circle cx="25" cy="25" r="3" fill="#ef4444" opacity="0.2"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#firewallPattern)" />
          </svg>
        </div>
        
        {/* Encryption Layers */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(25%, 20%)">
              <rect x="0" y="0" width="8" height="12" fill="none" stroke="#06b6d4" strokeWidth="1.5" opacity="0.4"/>
              <circle cx="8" cy="6" r="2.5" fill="none" stroke="#06b6d4" strokeWidth="1.5" opacity="0.4"/>
              <line x1="4" y1="4" x2="4" y2="8" stroke="#06b6d4" strokeWidth="1" opacity="0.3"/>
            </g>
            <g transform="translate(75%, 20%)">
              <rect x="0" y="0" width="8" height="12" fill="none" stroke="#3b82f6" strokeWidth="1.5" opacity="0.4"/>
              <circle cx="8" cy="6" r="2.5" fill="none" stroke="#3b82f6" strokeWidth="1.5" opacity="0.4"/>
              <line x1="4" y1="4" x2="4" y2="8" stroke="#3b82f6" strokeWidth="1" opacity="0.3"/>
            </g>
          </svg>
        </div>
        
        {/* Threat Detection Radar Sweep */}
        <div className="absolute inset-0 opacity-8">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(50%, 50%)">
              <circle cx="0" cy="0" r="25" fill="none" stroke="#22d3ee" strokeWidth="1" opacity="0.3" strokeDasharray="2,2"/>
              <circle cx="0" cy="0" r="15" fill="none" stroke="#06b6d4" strokeWidth="1" opacity="0.3" strokeDasharray="2,2"/>
              <line x1="0" y1="0" x2="25" y2="0" stroke="#06b6d4" strokeWidth="1" opacity="0.4">
                <animateTransform attributeName="transform" type="rotate" values="0;360" dur="8s" repeatCount="indefinite"/>
              </line>
            </g>
          </svg>
        </div>
        
        {/* Security Protocol Indicators */}
        <div className="absolute inset-0 opacity-15">
          <div className="absolute top-1/4 left-[5%] text-[8px] text-cyan-400/40 font-mono">HTTPS</div>
          <div className="absolute top-1/4 right-[5%] text-[8px] text-blue-400/40 font-mono">TLS 1.3</div>
          <div className="absolute bottom-1/4 left-[5%] text-[8px] text-cyan-400/40 font-mono">AES-256</div>
          <div className="absolute bottom-1/4 right-[5%] text-[8px] text-blue-400/40 font-mono">2FA</div>
        </div>
        
        {/* Data Encryption Flow */}
        <div className="absolute inset-0 opacity-12">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,28 L100,28 L150,22 L250,22 L300,28 L500,28 L550,22 L700,22" 
                  stroke="#06b6d4" strokeWidth="1.5" fill="none" opacity="0.4" strokeDasharray="3,2">
              <animate attributeName="stroke-dashoffset" values="0;-10" dur="2s" repeatCount="indefinite"/>
            </path>
            <path d="M0,22 L80,22 L130,28 L230,28 L280,22 L480,22 L530,28 L680,28" 
                  stroke="#3b82f6" strokeWidth="1.5" fill="none" opacity="0.4" strokeDasharray="3,2">
              <animate attributeName="stroke-dashoffset" values="0;-10" dur="2.5s" repeatCount="indefinite"/>
            </path>
          </svg>
        </div>
        
        {/* Security Status Bars */}
        <div className="absolute bottom-0 left-0 right-0 h-1 opacity-20">
          <div className="absolute left-0 w-1/3 h-full bg-gradient-to-r from-green-500 via-green-400 to-transparent"></div>
          <div className="absolute left-1/3 w-1/3 h-full bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
          <div className="absolute right-0 w-1/3 h-full bg-gradient-to-l from-green-500 via-green-400 to-transparent"></div>
        </div>
        
        {/* Network Security Nodes */}
        <div className="absolute inset-0 opacity-15">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <g>
              <circle cx="15%" cy="30%" r="3" fill="#06b6d4" opacity="0.6">
                <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite"/>
              </circle>
              <circle cx="15%" cy="30%" r="6" fill="none" stroke="#06b6d4" strokeWidth="1" opacity="0.3">
                <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite"/>
              </circle>
            </g>
            <g>
              <circle cx="85%" cy="30%" r="3" fill="#3b82f6" opacity="0.6">
                <animate attributeName="opacity" values="0.6;1;0.6" dur="2.3s" repeatCount="indefinite"/>
              </circle>
              <circle cx="85%" cy="30%" r="6" fill="none" stroke="#3b82f6" strokeWidth="1" opacity="0.3">
                <animate attributeName="r" values="6;10;6" dur="2.3s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.3;0;0.3" dur="2.3s" repeatCount="indefinite"/>
              </circle>
            </g>
            <g>
              <circle cx="50%" cy="70%" r="3" fill="#22d3ee" opacity="0.6">
                <animate attributeName="opacity" values="0.6;1;0.6" dur="1.8s" repeatCount="indefinite"/>
              </circle>
              <circle cx="50%" cy="70%" r="6" fill="none" stroke="#22d3ee" strokeWidth="1" opacity="0.3">
                <animate attributeName="r" values="6;10;6" dur="1.8s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.3;0;0.3" dur="1.8s" repeatCount="indefinite"/>
              </circle>
            </g>
          </svg>
        </div>
        
        {/* Attack Attempts - Red Threat Arrows */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            {/* Attack arrows from outside */}
            <g>
              <line x1="0" y1="15" x2="100" y2="15" stroke="#ef4444" strokeWidth="2" opacity="0.5" markerEnd="url(#arrowhead-red)">
                <animate attributeName="x2" values="100;150;100" dur="3s" repeatCount="indefinite"/>
              </line>
              <line x1="0" y1="35" x2="120" y2="35" stroke="#f87171" strokeWidth="1.5" opacity="0.4" markerEnd="url(#arrowhead-red)">
                <animate attributeName="x2" values="120;170;120" dur="3.5s" repeatCount="indefinite"/>
              </line>
              <line x1="800" y1="20" x2="700" y2="20" stroke="#ef4444" strokeWidth="2" opacity="0.5" markerEnd="url(#arrowhead-red-left)">
                <animate attributeName="x2" values="700;650;700" dur="2.8s" repeatCount="indefinite"/>
              </line>
              <line x1="800" y1="40" x2="680" y2="40" stroke="#f87171" strokeWidth="1.5" opacity="0.4" markerEnd="url(#arrowhead-red-left)">
                <animate attributeName="x2" values="680;630;680" dur="3.2s" repeatCount="indefinite"/>
              </line>
            </g>
            <defs>
              <marker id="arrowhead-red" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <polygon points="0 0, 10 3, 0 6" fill="#ef4444" opacity="0.6"/>
              </marker>
              <marker id="arrowhead-red-left" markerWidth="10" markerHeight="10" refX="1" refY="3" orient="auto">
                <polygon points="10 0, 0 3, 10 6" fill="#ef4444" opacity="0.6"/>
              </marker>
            </defs>
          </svg>
        </div>
        
        {/* Defense Shields - Blocking Attacks */}
        <div className="absolute inset-0 opacity-25">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            {/* Protective shields blocking attacks */}
            <g transform="translate(20%, 50%)">
              <path d="M0,0 L15,-8 L15,8 Z" fill="#10b981" opacity="0.6" stroke="#10b981" strokeWidth="1"/>
              <circle cx="0" cy="0" r="12" fill="none" stroke="#10b981" strokeWidth="2" opacity="0.4">
                <animate attributeName="r" values="12;18;12" dur="2s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.4;0.2;0.4" dur="2s" repeatCount="indefinite"/>
              </circle>
            </g>
            <g transform="translate(80%, 50%)">
              <path d="M0,0 L15,-8 L15,8 Z" fill="#10b981" opacity="0.6" stroke="#10b981" strokeWidth="1"/>
              <circle cx="0" cy="0" r="12" fill="none" stroke="#10b981" strokeWidth="2" opacity="0.4">
                <animate attributeName="r" values="12;18;12" dur="2.3s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.4;0.2;0.4" dur="2.3s" repeatCount="indefinite"/>
              </circle>
            </g>
            <g transform="translate(50%, 25%)">
              <path d="M0,0 L15,-8 L15,8 Z" fill="#22c55e" opacity="0.6" stroke="#22c55e" strokeWidth="1"/>
              <circle cx="0" cy="0" r="10" fill="none" stroke="#22c55e" strokeWidth="2" opacity="0.4">
                <animate attributeName="r" values="10;16;10" dur="1.8s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.4;0.2;0.4" dur="1.8s" repeatCount="indefinite"/>
              </circle>
            </g>
          </svg>
        </div>
        
        {/* Intrusion Prevention System (IPS) */}
        <div className="absolute inset-0 opacity-15">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            {/* Blocked attack indicators */}
            <g transform="translate(25%, 20%)">
              <rect x="-3" y="-3" width="6" height="6" fill="#ef4444" opacity="0.5" rx="1">
                <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite"/>
              </rect>
              <line x1="-8" y1="0" x2="-3" y2="0" stroke="#ef4444" strokeWidth="1.5" opacity="0.4" strokeDasharray="2,2"/>
              <line x1="3" y1="0" x2="8" y2="0" stroke="#10b981" strokeWidth="1.5" opacity="0.5"/>
              <text x="10" y="4" fontSize="8" fill="#10b981" opacity="0.6" fontFamily="monospace">BLOCKED</text>
            </g>
            <g transform="translate(75%, 20%)">
              <rect x="-3" y="-3" width="6" height="6" fill="#ef4444" opacity="0.5" rx="1">
                <animate attributeName="opacity" values="0.5;1;0.5" dur="1.8s" repeatCount="indefinite"/>
              </rect>
              <line x1="3" y1="0" x2="-3" y2="0" stroke="#ef4444" strokeWidth="1.5" opacity="0.4" strokeDasharray="2,2"/>
              <line x1="-3" y1="0" x2="-8" y2="0" stroke="#10b981" strokeWidth="1.5" opacity="0.5"/>
              <text x="-50" y="4" fontSize="8" fill="#10b981" opacity="0.6" fontFamily="monospace">BLOCKED</text>
            </g>
          </svg>
        </div>
        
        {/* Threat Neutralization */}
        <div className="absolute inset-0 opacity-18">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            {/* Threat being neutralized */}
            <g transform="translate(30%, 60%)">
              <circle cx="0" cy="0" r="4" fill="#ef4444" opacity="0.6">
                <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite"/>
              </circle>
              <circle cx="0" cy="0" r="8" fill="none" stroke="#10b981" strokeWidth="1.5" opacity="0.5">
                <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite"/>
              </circle>
              <line x1="-6" y1="-6" x2="6" y2="6" stroke="#10b981" strokeWidth="1.5" opacity="0.6"/>
              <line x1="6" y1="-6" x2="-6" y2="6" stroke="#10b981" strokeWidth="1.5" opacity="0.6"/>
            </g>
            <g transform="translate(70%, 60%)">
              <circle cx="0" cy="0" r="4" fill="#f87171" opacity="0.6">
                <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2.3s" repeatCount="indefinite"/>
              </circle>
              <circle cx="0" cy="0" r="8" fill="none" stroke="#22c55e" strokeWidth="1.5" opacity="0.5">
                <animate attributeName="r" values="8;12;8" dur="2.3s" repeatCount="indefinite"/>
              </circle>
              <line x1="-6" y1="-6" x2="6" y2="6" stroke="#22c55e" strokeWidth="1.5" opacity="0.6"/>
              <line x1="6" y1="-6" x2="-6" y2="6" stroke="#22c55e" strokeWidth="1.5" opacity="0.6"/>
            </g>
          </svg>
        </div>
        
        {/* Active Defense Status */}
        <div className="absolute top-1 right-4 opacity-30">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-[8px] text-green-400 font-mono">DEFENSE ACTIVE</span>
          </div>
        </div>
        
        {/* Central Security Hub - Middle of Banner */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30 pointer-events-none z-20">
          <svg width="120" height="60" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60">
            <g transform="translate(60, 30)">
              {/* Main security core */}
              <circle cx="0" cy="0" r="8" fill="#06b6d4" opacity="0.7">
                <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite"/>
              </circle>
              <circle cx="0" cy="0" r="15" fill="none" stroke="#06b6d4" strokeWidth="2" opacity="0.6">
                <animate attributeName="r" values="15;20;15" dur="3s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.6;0.4;0.6" dur="3s" repeatCount="indefinite"/>
              </circle>
              <circle cx="0" cy="0" r="25" fill="none" stroke="#3b82f6" strokeWidth="1.5" opacity="0.5" strokeDasharray="4,4">
                <animateTransform attributeName="transform" type="rotate" values="0;360" dur="20s" repeatCount="indefinite"/>
              </circle>
              
              {/* Protection rings */}
              <circle cx="0" cy="0" r="30" fill="none" stroke="#10b981" strokeWidth="1" opacity="0.4" strokeDasharray="2,2">
                <animate attributeName="r" values="30;35;30" dur="4s" repeatCount="indefinite"/>
              </circle>
              
              {/* Security rays */}
              <line x1="0" y1="0" x2="0" y2="-30" stroke="#06b6d4" strokeWidth="1.5" opacity="0.6">
                <animate attributeName="opacity" values="0.6;0.9;0.6" dur="2s" repeatCount="indefinite"/>
              </line>
              <line x1="0" y1="0" x2="30" y2="0" stroke="#06b6d4" strokeWidth="1.5" opacity="0.6">
                <animate attributeName="opacity" values="0.6;0.9;0.6" dur="2s" repeatCount="indefinite" begin="0.5s"/>
              </line>
              <line x1="0" y1="0" x2="0" y2="30" stroke="#06b6d4" strokeWidth="1.5" opacity="0.6">
                <animate attributeName="opacity" values="0.6;0.9;0.6" dur="2s" repeatCount="indefinite" begin="1s"/>
              </line>
              <line x1="0" y1="0" x2="-30" y2="0" stroke="#06b6d4" strokeWidth="1.5" opacity="0.6">
                <animate attributeName="opacity" values="0.6;0.9;0.6" dur="2s" repeatCount="indefinite" begin="1.5s"/>
              </line>
              
              {/* Diagonal protection lines */}
              <line x1="0" y1="0" x2="21" y2="-21" stroke="#3b82f6" strokeWidth="1" opacity="0.5">
                <animate attributeName="opacity" values="0.5;0.8;0.5" dur="2.5s" repeatCount="indefinite"/>
              </line>
              <line x1="0" y1="0" x2="21" y2="21" stroke="#3b82f6" strokeWidth="1" opacity="0.5">
                <animate attributeName="opacity" values="0.5;0.8;0.5" dur="2.5s" repeatCount="indefinite" begin="0.6s"/>
              </line>
              <line x1="0" y1="0" x2="-21" y2="21" stroke="#3b82f6" strokeWidth="1" opacity="0.5">
                <animate attributeName="opacity" values="0.5;0.8;0.5" dur="2.5s" repeatCount="indefinite" begin="1.2s"/>
              </line>
              <line x1="0" y1="0" x2="-21" y2="-21" stroke="#3b82f6" strokeWidth="1" opacity="0.5">
                <animate attributeName="opacity" values="0.5;0.8;0.5" dur="2.5s" repeatCount="indefinite" begin="1.8s"/>
              </line>
            </g>
          </svg>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 animate-on-load">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-600 rounded-lg shadow-lg flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-white stroke-2" />
            </div>
            <div className="text-right">
              <h1 className="text-xl font-bold text-white leading-tight">الإدارة العامة للأمن السيبراني</h1>
              <h1 className="text-xl font-bold text-white leading-tight mt-0.5">إدارة عمليات الأمن السيبراني</h1>
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
                  <ShieldCheck className="w-4 h-4 text-white" />
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
                  placeholder="Enter your email"
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
            <div className="text-center mt-4">
              <Link
                to="/forgot-password"
                className="text-sm text-gray-600 hover:text-main transition-colors"
              >
                Forgot your password?
              </Link>
            </div>
          </form>
        </div>
        </div>
      </div>
    </div>
  );
}
