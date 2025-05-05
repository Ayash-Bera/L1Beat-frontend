import { CheckCircle, XCircle, AlertTriangle, Menu, X } from 'lucide-react';
import { HealthStatus } from '../types';
import { useEffect, useState } from 'react';
import { ThemeToggle } from './ThemeToggle';

interface StatusBarProps {
  health: HealthStatus | null;
}

export function StatusBar({ health }: StatusBarProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [showTooltip, setShowTooltip] = useState<'blog' | 'acps' | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimating(false), 1000);
    return () => clearTimeout(timer);
  }, []);

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
    <div
      className={`sticky top-0 z-50 transform transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      {/* Alpha Warning Banner */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-100 dark:border-yellow-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              L1Beat is currently in alpha. Data shown may be incomplete or inaccurate.
            </p>
          </div>
        </div>
      </div>

      {/* Main Status Bar */}
      <div className="bg-white shadow-sm border-b backdrop-blur-sm bg-opacity-90 dark:bg-dark-800/75 dark:border-dark-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center justify-between h-16">
              {/* Left Side: Logo and Status */}
              <div className="flex items-center gap-6 pl-8">
                {/* Logo */}
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
                    className={`h-10 w-auto relative ${
                      isAnimating ? 'animate-heartbeat' : ''
                    } transition-transform duration-300 block`}
                  />
                </button>
                {/* System Health */}
                {health ? (
                  <div className="hidden md:flex items-center gap-3">
                    <div
                      className={`p-1.5 rounded-lg ${
                        isHealthy
                          ? 'bg-green-100 dark:bg-green-500/20'
                          : 'bg-red-100 dark:bg-red-500/20'
                      }`}
                    >
                      {isHealthy ? (
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          System Status:
                        </span>
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            isHealthy
                              ? 'bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-300'
                              : 'bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300'
                          }`}
                        >
                          {isHealthy ? 'Healthy' : 'Issues Detected'}
                        </span>
                      </div>
                      {!isHealthy && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                          Status: {health.status}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="hidden md:flex items-center gap-3">
                    <div className="animate-pulse">
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div className="h-4 w-32 bg-gray-200 dark:bg-dark-600 rounded animate-pulse"></div>
                  </div>
                )}
              </div>

              {/* Mobile Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden inline-flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                ) : (
                  <Menu className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                )}
              </button>
            </div>

            {/* Right Side: Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-3 mr-4">
                {/* Blog Button */}
                <div className="relative">
                  <button
                    onClick={() => setShowTooltip('blog')}
                    onMouseLeave={() => setShowTooltip(null)}
                    className="inline-flex items-center px-4 py-2 rounded-md font-medium text-sm text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow transform hover:-translate-y-0.5"
                  >
                    Blog
                  </button>
                  {showTooltip === 'blog' && (
                    <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded shadow-lg whitespace-nowrap">
                      Coming soon!
                    </div>
                  )}
                </div>

                {/* ACPs Button */}
                <div className="relative">
                  <button
                    onClick={() => setShowTooltip('acps')}
                    onMouseLeave={() => setShowTooltip(null)}
                    className="inline-flex items-center px-4 py-2 rounded-md font-medium text-sm bg-white dark:bg-dark-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-dark-600 transition-all duration-200 shadow-sm hover:shadow transform hover:-translate-y-0.5"
                  >
                    ACPs
                  </button>
                  {showTooltip === 'acps' && (
                    <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded shadow-lg whitespace-nowrap">
                      Coming soon!
                    </div>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="h-8 w-px bg-gray-200 dark:bg-gray-700"></div>

              {/* Theme Toggle */}
              <div className="pr-12">
                <ThemeToggle />
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          <div
            className={`md:hidden transition-all duration-300 ease-in-out ${
              isMobileMenuOpen
                ? 'max-h-96 opacity-100'
                : 'max-h-0 opacity-0 pointer-events-none'
            } overflow-hidden`}
          >
            <div className="py-4 space-y-2">
              {/* Mobile System Status */}
              {health && (
                <div className="px-4 py-3 bg-gray-50 dark:bg-dark-700/50 rounded-lg mb-4">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-1.5 rounded-lg ${
                        isHealthy
                          ? 'bg-green-100 dark:bg-green-500/20'
                          : 'bg-red-100 dark:bg-red-500/20'
                      }`}
                    >
                      {isHealthy ? (
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      System Status: {isHealthy ? 'Healthy' : 'Issues Detected'}
                    </span>
                  </div>
                </div>
              )}

              {/* Mobile Navigation Items */}
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setShowTooltip('blog');
                    setTimeout(() => setShowTooltip(null), 2000);
                  }}
                  className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-dark-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                >
                  <span>Blog</span>
                  {showTooltip === 'blog' && (
                    <span className="text-xs text-blue-500 dark:text-blue-400">Coming soon</span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowTooltip('acps');
                    setTimeout(() => setShowTooltip(null), 2000);
                  }}
                  className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-dark-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                >
                  <span>ACPs</span>
                  {showTooltip === 'acps' && (
                    <span className="text-xs text-blue-500 dark:text-blue-400">Coming soon</span>
                  )}
                </button>
              </div>

              {/* Mobile Theme Toggle */}
              <div className="px-4 pt-4 mt-4 border-t border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Theme
                  </span>
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