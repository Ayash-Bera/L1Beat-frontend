import { CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { HealthStatus } from '../types';
import { format } from 'date-fns';
import { ThemeToggle } from './ThemeToggle';
import { useEffect, useState } from 'react';

interface StatusBarProps {
  health: HealthStatus | null;
}

export function StatusBar({ health }: StatusBarProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true); // Start with animation enabled

  useEffect(() => {
    // Initial animation
    const timer = setTimeout(() => setIsAnimating(false), 1000);

    // Cleanup
    return () => clearTimeout(timer);
  }, []); // Run once on mount

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

    return () => {
      window.removeEventListener('scroll', controlNavbar);
    };
  }, [lastScrollY]);

  const handleLogoClick = () => {
    if (!isAnimating) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 1000);
    }
  };

  const isHealthy = health?.status.toLowerCase() === 'ok' || health?.status.toLowerCase() === 'healthy';
  const timestamp = health ? new Date(health.timestamp) : new Date();
  const timeDiff = Math.floor((Date.now() - timestamp.getTime()) / 1000 / 60);
  
  return (
    <div className={`sticky top-0 z-50 transform transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4 gap-4">
            {/* Logo and Status Section */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleLogoClick}
                  className="relative transform transition-all duration-300 hover:scale-105 focus:outline-none group"
                >
                  <div className={`absolute inset-0 bg-red-500/20 dark:bg-red-500/30 rounded-lg filter blur-xl transition-opacity duration-500 ${isAnimating ? 'animate-heartbeat-glow' : 'opacity-0'}`} />
                  <img 
                    src="https://raw.githubusercontent.com/muhammetselimfe/L1Beat/refs/heads/main/public/l1_logo_main_2.png" 
                    alt="L1Beat" 
                    className={`h-10 w-auto relative ${isAnimating ? 'animate-heartbeat' : ''} transition-transform duration-300`}
                  />
                </button>
                <div className="h-8 w-px bg-gray-200 dark:bg-gray-700"></div>
              </div>
              
              <div className="flex items-center gap-3">
                {health ? (
                  <>
                    <div className={`p-1.5 rounded-lg ${isHealthy ? 'bg-green-100 dark:bg-green-500/20' : 'bg-red-100 dark:bg-red-500/20'}`}>
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
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          isHealthy 
                            ? 'bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-300' 
                            : 'bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300'
                        }`}>
                          {isHealthy ? 'Healthy' : 'Issues Detected'}
                        </span>
                      </div>
                      {!isHealthy && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                          Status: {health.status}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="animate-pulse">
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div className="h-4 w-32 bg-gray-200 dark:bg-dark-600 rounded animate-pulse"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Last Update and Theme Toggle */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <Clock className="w-4 h-4" />
                <span>Last Updated: {format(timestamp, 'h:mm a')}</span>
                {timeDiff > 5 && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-300">
                    {timeDiff} minutes ago
                  </span>
                )}
              </div>
              <div className="h-8 w-px bg-gray-200 dark:bg-gray-700"></div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}