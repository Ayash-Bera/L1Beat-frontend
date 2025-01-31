import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useState } from 'react';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    setIsAnimating(true);
    toggleTheme();
    setTimeout(() => setIsAnimating(false), 500);
  };

  return (
    <button
      onClick={handleClick}
      className="theme-toggle"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun 
          className={`w-5 h-5 text-yellow-400 ${isAnimating ? 'theme-icon-enter' : ''}`}
        />
      ) : (
        <Moon 
          className={`w-5 h-5 text-indigo-500 ${isAnimating ? 'theme-icon-enter' : ''}`}
        />
      )}
    </button>
  );
}