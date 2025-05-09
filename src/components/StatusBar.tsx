import { CheckCircle, XCircle, AlertTriangle, Menu, X, ExternalLink } from 'lucide-react';
import { HealthStatus } from '../types';
import { useEffect, useState } from 'react';
import { ThemeToggle } from './ThemeToggle';

interface StatusBarProps {
  health: HealthStatus | null;
}

export function StatusBar({ health }: StatusBarProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState<'blog' | 'acps' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const controlNavbar = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < lastScrollY || currentScrollY < 50) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', controlNavbar);
    return () => window.removeEventListener('scroll', controlNavbar);
  }, [lastScrollY]);

  const handleLogoClick = () => {
    if (!isAnimating) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 1000);
    }
  };

  const isHealthy = health?.status.toLowerCase() === 'ok' || health?.status.toLowerCase() === 'healthy';

  return (
    <div className={`sticky top-0 z-50 transform transition-transform duration-300 ${
      isVisible ? 'translate-y-0' : '-translate-y-full'
    }`}>
      {/* Alpha Warning Banner */}
      <div className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-b border-amber-200 dark:border-amber-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              L1Beat is currently in alpha. Data shown may be incomplete or inaccurate.
            </p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="bg-white/80 dark:bg-dark-800/80 backdrop-blur-lg border-b border-gray-200 dark:border-dark-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Health Status */}
            <div className="flex items-center gap-6">
              <button
                onClick={handleLogoClick}
                className="relative transform transition-all duration-300 hover:scale-105 focus:outline-none group"
              >
                <div
                  className={`absolute inset-0 bg-red-500/20 dark:bg-red-500/30 rounded-lg filter blur-xl transition-opacity duration-500 ${
                    isAnimating ? 'animate-heartbeat-glow' : 'opacity-0'
                  }`}
                />
                <img
                  src="https://raw.githubusercontent.com/muhammetselimfe/L1Beat/refs/heads/main/public/l1_logo_main_2.png"
                  alt="L1Beat"
                  className={`h-8 w-auto relative ${
                    isAnimating ? 'animate-heartbeat' : ''
                  } transition-transform duration-300`}
                />
              </button>
              
              {health && (
                <div className="hidden md:flex items-center gap-2 pl-6 border-l border-gray-200 dark:border-dark-700">
                  <div className={`p-1.5 rounded-lg ${
                    isHealthy 
                      ? 'bg-green-100 dark:bg-green-500/20' 
                      : 'bg-red-100 dark:bg-red-500/20'
                  }`}>
                    {isHealthy ? (
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <span className={`text-sm font-medium ${
                    isHealthy 
                      ? 'text-green-700 dark:text-green-400' 
                      : 'text-red-700 dark:text-red-400'
                  }`}>
                    {isHealthy ? 'All Systems Operational' : 'System Issues Detected'}
                  </span>
                </div>
              )}
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowTooltip('blog')}
                  onMouseLeave={() => setShowTooltip(null)}
                  className="relative px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Blog
                  {showTooltip === 'blog' && (
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded">
                      Coming soon
                    </div>
                  )}
                </button>
                
                <a
                  href="https://docs.avax.network/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Docs
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={() => setShowTooltip('acps')}
                  onMouseLeave={() => setShowTooltip(null)}
                  className="relative px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-sm"
                >
                  ACPs
                  {showTooltip === 'acps' && (
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded">
                      Coming soon
                    </div>
                  )}
                </button>
              </div>

              <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>
              <ThemeToggle />
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          <div className={`md:hidden transition-all duration-300 ease-in-out ${
            isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
          }`}>
            <div className="py-3 space-y-3">
              {health && (
                <div className="px-4 py-3 bg-gray-50 dark:bg-dark-700/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${
                      isHealthy 
                        ? 'bg-green-100 dark:bg-green-500/20' 
                        : 'bg-red-100 dark:bg-red-500/20'
                    }`}>
                      {isHealthy ? (
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <span className={`text-sm font-medium ${
                      isHealthy 
                        ? 'text-green-700 dark:text-green-400' 
                        : 'text-red-700 dark:text-red-400'
                    }`}>
                      {isHealthy ? 'All Systems Operational' : 'System Issues Detected'}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <button
                  onClick={() => {
                    setShowTooltip('blog');
                    setTimeout(() => setShowTooltip(null), 2000);
                  }}
                  className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-dark-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"
                >
                  <span>Blog</span>
                  {showTooltip === 'blog' && (
                    <span className="text-xs text-blue-500 dark:text-blue-400">Coming soon</span>
                  )}
                </button>

                <a
                  href="https://docs.avax.network/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-dark-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"
                >
                  <span>Docs</span>
                  <ExternalLink className="w-4 h-4" />
                </a>

                <button
                  onClick={() => {
                    setShowTooltip('acps');
                    setTimeout(() => setShowTooltip(null), 2000);
                  }}
                  className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-dark-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"
                >
                  <span>ACPs</span>
                  {showTooltip === 'acps' && (
                    <span className="text-xs text-blue-500 dark:text-blue-400">Coming soon</span>
                  )}
                </button>
              </div>

              <div className="px-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Theme</span>
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}