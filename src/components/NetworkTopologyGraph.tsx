import React, { useEffect, useState, useRef, useMemo } from 'react';
import { getChains } from '../api';
import { Chain } from '../types';
import { Server, AlertTriangle, RefreshCw, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NodePosition {
  x: number;
  y: number;
  angle?: number;
  originalX?: number;
  originalY?: number;
}

interface Bullet {
  id: string;
  fromChainId: string;
  toChainId: string;
  progress: number;
  speed: number;
  size: number;
  color: string;
  direction: 'outgoing' | 'incoming';
}

export function NetworkTopologyGraph() {
  const navigate = useNavigate();
  const [chains, setChains] = useState<Chain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [positions, setPositions] = useState<Map<string, NodePosition>>(new Map());
  const [hoveredChain, setHoveredChain] = useState<Chain | null>(null);
  const [selectedChain, setSelectedChain] = useState<Chain | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const bulletIdCounter = useRef(0);

  // Bullet animation settings
  const BULLET_BASE_SPEED = 0.15;
  const MAX_BULLETS = 50;
  const BULLET_SPAWN_RATE = 0.05;

  useEffect(() => {
    async function fetchChains() {
      try {
        setLoading(true);
        const chainsData = await getChains();
        
        if (chainsData && chainsData.length > 0) {
          // Filter chains to only include those with at least one validator
          const validChains = chainsData.filter(chain => 
            chain.validators && chain.validators.length > 0
          );
          
          if (validChains.length > 0) {
            setChains(validChains);
            setError(null);
          } else {
            setError('No chains with validators available');
          }
        } else {
          setError('No chain data available');
        }
      } catch (err) {
        console.error('Failed to fetch chains for topology graph:', err);
        setError('Failed to load network data');
      } finally {
        setLoading(false);
      }
    }

    fetchChains();
  }, []);

  // Find C-Chain for highlighting
  const cChain = useMemo(() => chains.find(chain => 
    chain.chainName.toLowerCase().includes('c-chain') || 
    chain.chainName.toLowerCase().includes('c chain')
  ), [chains]);

  // Calculate node sizes based on TPS
  const getNodeSize = (chain: Chain, isCenter: boolean) => {
    // Base sizes
    const baseCenterSize = 80;
    const baseNodeSize = 50;
    
    // If it's the center node, use a larger base size
    if (isCenter) {
      return baseCenterSize;
    }
    
    // If the chain has TPS data, scale the node size accordingly
    if (chain.tps && typeof chain.tps.value === 'number') {
      // Scale factor based on TPS value
      // Use a logarithmic scale to prevent extremely large nodes
      const tpsValue = chain.tps.value;
      
      if (tpsValue <= 0.1) return baseNodeSize; // Minimum size
      
      // Logarithmic scaling for better visualization
      const scaleFactor = Math.min(2.5, 1 + Math.log10(tpsValue) * 0.5);
      return baseNodeSize * scaleFactor;
    }
    
    // Default size if no TPS data
    return baseNodeSize;
  };

  // Calculate initial positions
  useEffect(() => {
    function calculatePositions() {
      if (!containerRef.current || chains.length === 0) return;
      
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      
      setDimensions({ width, height });
      
      // If C-Chain not found, use the first chain as center
      const centerChain = cChain || chains[0];
      const centerX = width / 2;
      const centerY = height / 2;
      
      const newPositions = new Map<string, NodePosition>();
      
      // Place center chain
      newPositions.set(centerChain.chainId, { 
        x: centerX, 
        y: centerY,
        originalX: centerX,
        originalY: centerY
      });
      
      // Place other chains in a circle around the center
      const otherChains = chains.filter(chain => chain.chainId !== centerChain.chainId);
      const radius = Math.min(width, height) * 0.35; // 35% of the smaller dimension
      
      otherChains.forEach((chain, index) => {
        const angle = (2 * Math.PI * index) / otherChains.length;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        
        newPositions.set(chain.chainId, { 
          x, 
          y, 
          angle,
          originalX: x,
          originalY: y
        });
      });
      
      setPositions(newPositions);
    }

    calculatePositions();

    const handleResize = () => {
      calculatePositions();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [chains, cChain]);

  // Bullet animation loop
  useEffect(() => {
    if (chains.length === 0 || positions.size === 0) return;

    const centerChainId = cChain?.chainId || chains[0].chainId;
    
    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // Skip if delta time is too large (tab was inactive)
      if (deltaTime > 100) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      // Update existing bullets
      setBullets(prevBullets => {
        const updatedBullets = prevBullets
          .map(bullet => {
            // Update bullet progress
            const newProgress = bullet.progress + (bullet.speed * deltaTime * 0.001);
            return { ...bullet, progress: newProgress };
          })
          .filter(bullet => bullet.progress < 1); // Remove bullets that completed their journey
        
        // Randomly spawn new bullets if we're under the limit
        if (updatedBullets.length < MAX_BULLETS && Math.random() < BULLET_SPAWN_RATE) {
          // Get other chains (not the center)
          const otherChains = chains.filter(chain => chain.chainId !== centerChainId);
          
          if (otherChains.length > 0) {
            // Randomly select a chain
            const randomChain = otherChains[Math.floor(Math.random() * otherChains.length)];
            
            // Randomly decide direction (incoming or outgoing)
            const direction = Math.random() > 0.5 ? 'outgoing' : 'incoming';
            
            // Create a new bullet
            const newBullet: Bullet = {
              id: `bullet-${bulletIdCounter.current++}`,
              fromChainId: direction === 'outgoing' ? centerChainId : randomChain.chainId,
              toChainId: direction === 'outgoing' ? randomChain.chainId : centerChainId,
              progress: 0,
              speed: BULLET_BASE_SPEED * (0.8 + Math.random() * 0.4), // Random speed variation
              size: 2 + Math.random() * 2, // Random size between 2-4px
              color: getRandomBulletColor(),
              direction
            };
            
            return [...updatedBullets, newBullet];
          }
        }
        
        return updatedBullets;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [chains, positions, cChain]);

  // Helper function to get random bullet color
  const getRandomBulletColor = () => {
    const colors = [
      '#3b82f6', // blue-500
      '#60a5fa', // blue-400
      '#93c5fd', // blue-300
      '#6366f1', // indigo-500
      '#818cf8', // indigo-400
      '#a5b4fc', // indigo-300
      '#8b5cf6', // violet-500
      '#a78bfa', // violet-400
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Handle chain node click
  const handleChainClick = (chain: Chain) => {
    navigate(`/chain/${chain.chainId}`);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-md p-6 h-full">
        <div className="h-[400px] flex flex-col items-center justify-center">
          <RefreshCw className="h-12 w-12 text-blue-500 animate-spin mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading network topology...</p>
        </div>
      </div>
    );
  }

  if (error || chains.length === 0) {
    return (
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-md p-6 h-full">
        <div className="h-[400px] flex flex-col items-center justify-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
          <p className="text-gray-600 dark:text-gray-300 text-center mb-4">
            {error || 'No network data available'}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw className="-ml-1 mr-2 h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-dark-800 rounded-lg shadow-md p-6 h-full">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Network Topology
          </h3>
          <div className="ml-2 px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
            <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
              {chains.length} Chains
            </span>
          </div>
          <button 
            onClick={() => {
              // Reset bullet counter and add a burst of bullets
              bulletIdCounter.current = 0;
              const centerChainId = cChain?.chainId || chains[0].chainId;
              const otherChains = chains.filter(chain => chain.chainId !== centerChainId);
              
              const newBullets: Bullet[] = [];
              
              // Create a burst of bullets in both directions
              otherChains.forEach(chain => {
                // Outgoing bullet
                newBullets.push({
                  id: `bullet-${bulletIdCounter.current++}`,
                  fromChainId: centerChainId,
                  toChainId: chain.chainId,
                  progress: 0,
                  speed: BULLET_BASE_SPEED * (0.8 + Math.random() * 0.4),
                  size: 2 + Math.random() * 2,
                  color: getRandomBulletColor(),
                  direction: 'outgoing'
                });
                
                // Incoming bullet
                newBullets.push({
                  id: `bullet-${bulletIdCounter.current++}`,
                  fromChainId: chain.chainId,
                  toChainId: centerChainId,
                  progress: 0,
                  speed: BULLET_BASE_SPEED * (0.8 + Math.random() * 0.4),
                  size: 2 + Math.random() * 2,
                  color: getRandomBulletColor(),
                  direction: 'incoming'
                });
              });
              
              setBullets(newBullets);
            }}
            className="ml-2 p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800/30 transition-colors"
            title="Animate network"
          >
            <Zap className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div 
        ref={containerRef} 
        className="relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-900/70 dark:to-dark-900/90 rounded-lg border border-gray-100 dark:border-dark-700 h-[400px] w-full overflow-hidden"
      >
        {/* Particle background effect */}
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 30 }).map((_, i) => (
            <div 
              key={`particle-${i}`}
              className="absolute rounded-full bg-blue-500/10 dark:bg-blue-500/5"
              style={{
                width: `${Math.random() * 6 + 2}px`,
                height: `${Math.random() * 6 + 2}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${Math.random() * 20 + 10}s linear infinite`,
                animationDelay: `-${Math.random() * 20}s`,
              }}
            />
          ))}
        </div>
        
        {/* Draw connections between nodes */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {/* Draw a subtle grid pattern */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(156, 163, 175, 0.1)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Draw a subtle glow around the center node */}
          {cChain && positions.get(cChain.chainId) && (
            <circle
              cx={positions.get(cChain.chainId)?.x}
              cy={positions.get(cChain.chainId)?.y}
              r="70"
              fill="url(#centerGlow)"
              className="animate-pulse-slow"
            />
          )}
          
          {/* Radial gradient for center node */}
          <defs>
            <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <stop offset="0%" stopColor="rgba(59, 130, 246, 0.3)" />
              <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
            </radialGradient>
            
            {/* Bullet glow filter */}
            <filter id="bulletGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          
          {/* Draw connections */}
          {chains.map(chain => {
            const position = positions.get(chain.chainId);
            if (!position) return null;
            
            // Only draw lines from center to other nodes
            if (chain.chainId === cChain?.chainId) return null;
            
            const centerPosition = positions.get(cChain?.chainId || chains[0].chainId);
            if (!centerPosition) return null;
            
            const isHighlighted = hoveredChain?.chainId === chain.chainId || selectedChain?.chainId === chain.chainId;
            
            // Calculate line thickness based on TPS
            let lineThickness = 1;
            if (chain.tps && typeof chain.tps.value === 'number') {
              // Scale line thickness based on TPS, with a minimum of 1 and maximum of 4
              lineThickness = Math.max(1, Math.min(4, 1 + Math.log10(chain.tps.value + 1)));
            }
            
            return (
              <g key={`connection-${chain.chainId}`}>
                {/* Main connection line */}
                <line 
                  x1={centerPosition.x}
                  y1={centerPosition.y}
                  x2={position.x}
                  y2={position.y}
                  stroke={
                    isHighlighted
                      ? '#3b82f6' // blue-500
                      : '#cbd5e1' // gray-300
                  }
                  strokeWidth={isHighlighted ? lineThickness + 1 : lineThickness}
                  strokeDasharray={isHighlighted ? "none" : "4,4"}
                  className="transition-all duration-300"
                />
              </g>
            );
          })}
          
          {/* Draw bullets */}
          {bullets.map(bullet => {
            const fromPosition = positions.get(bullet.fromChainId);
            const toPosition = positions.get(bullet.toChainId);
            
            if (!fromPosition || !toPosition) return null;
            
            // Calculate current position based on progress
            const x = fromPosition.x + (toPosition.x - fromPosition.x) * bullet.progress;
            const y = fromPosition.y + (toPosition.y - fromPosition.y) * bullet.progress;
            
            // Calculate trail effect (smaller bullets behind the main one)
            const trailLength = 3; // Number of trail elements
            const trailElements = [];
            
            for (let i = 1; i <= trailLength; i++) {
              const trailProgress = Math.max(0, bullet.progress - (i * 0.03));
              if (trailProgress <= 0) continue;
              
              const trailX = fromPosition.x + (toPosition.x - fromPosition.x) * trailProgress;
              const trailY = fromPosition.y + (toPosition.y - fromPosition.y) * trailProgress;
              const trailOpacity = 0.7 - (i * 0.2);
              const trailSize = bullet.size * (1 - (i * 0.2));
              
              trailElements.push(
                <circle
                  key={`${bullet.id}-trail-${i}`}
                  cx={trailX}
                  cy={trailY}
                  r={trailSize}
                  fill={bullet.color}
                  opacity={trailOpacity}
                />
              );
            }
            
            return (
              <g key={bullet.id}>
                {/* Trail elements */}
                {trailElements}
                
                {/* Main bullet */}
                <circle
                  cx={x}
                  cy={y}
                  r={bullet.size}
                  fill={bullet.color}
                  filter="url(#bulletGlow)"
                />
              </g>
            );
          })}
        </svg>
        
        {/* Render chain nodes */}
        {chains.map(chain => {
          const position = positions.get(chain.chainId);
          if (!position) return null;
          
          const isCenter = chain.chainId === cChain?.chainId;
          const isHovered = chain.chainId === hoveredChain?.chainId;
          const isSelected = chain.chainId === selectedChain?.chainId;
          
          // Calculate node size based on TPS
          const nodeSize = getNodeSize(chain, isCenter);
          
          // Calculate TPS indicator size and color
          let tpsIndicatorSize = 0;
          let tpsIndicatorColor = 'bg-gray-400';
          
          if (chain.tps && typeof chain.tps.value === 'number') {
            const tpsValue = chain.tps.value;
            
            if (tpsValue >= 1) {
              tpsIndicatorSize = 8;
              tpsIndicatorColor = 'bg-green-500';
            } else if (tpsValue >= 0.1) {
              tpsIndicatorSize = 6;
              tpsIndicatorColor = 'bg-yellow-500';
            } else {
              tpsIndicatorSize = 4;
              tpsIndicatorColor = 'bg-red-500';
            }
          }
          
          return (
            <div
              key={chain.chainId}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 cursor-pointer
                ${isHovered || isSelected ? 'scale-110 z-10' : 'scale-100 z-0'}
                ${isCenter ? 'z-20' : ''}
              `}
              style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: `${nodeSize}px`,
                height: `${nodeSize}px`,
              }}
              onMouseEnter={() => setHoveredChain(chain)}
              onMouseLeave={() => setHoveredChain(null)}
              onClick={() => handleChainClick(chain)}
            >
              {/* Pulsing background for center node */}
              {isCenter && (
                <div className="absolute inset-0 rounded-full bg-blue-500/20 dark:bg-blue-500/30 animate-pulse-slow"></div>
              )}
              
              {/* Node container */}
              <div className={`
                relative w-full h-full rounded-full flex items-center justify-center
                ${isCenter 
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20 dark:shadow-blue-500/40' 
                  : 'bg-white dark:bg-dark-800 shadow-md border border-gray-200 dark:border-gray-700'}
                ${isHovered || isSelected 
                  ? 'shadow-xl' + (isCenter ? '' : ' border-blue-400 dark:border-blue-300') 
                  : ''}
                transition-all duration-300
              `}>
                {/* Ripple effect for hovered/selected nodes */}
                {(isHovered || isSelected) && !isCenter && (
                  <div className="absolute -inset-4 rounded-full border-2 border-blue-400/50 dark:border-blue-400/30 animate-ripple"></div>
                )}
                
                {/* TPS indicator dot */}
                {!isCenter && tpsIndicatorSize > 0 && (
                  <div 
                    className={`absolute -top-1 -right-1 rounded-full ${tpsIndicatorColor} border-2 border-white dark:border-dark-800`}
                    style={{
                      width: `${tpsIndicatorSize}px`,
                      height: `${tpsIndicatorSize}px`,
                    }}
                  ></div>
                )}
                
                {/* Inner circle for center node */}
                {isCenter && (
                  <div className="absolute inset-2 rounded-full bg-white dark:bg-dark-800 flex items-center justify-center">
                    {chain.chainLogoUri ? (
                      <img 
                        src={chain.chainLogoUri} 
                        alt={chain.chainName}
                        className="w-4/5 h-4/5 object-contain rounded-full"
                      />
                    ) : (
                      <div className="w-4/5 h-4/5 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 rounded-full">
                        <Server className="w-1/2 h-1/2 text-blue-600 dark:text-blue-400" />
                      </div>
                    )}
                  </div>
                )}
                
                {/* Regular node content */}
                {!isCenter && (
                  <>
                    {chain.chainLogoUri ? (
                      <img 
                        src={chain.chainLogoUri} 
                        alt={chain.chainName}
                        className="w-3/4 h-3/4 object-contain rounded-full"
                      />
                    ) : (
                      <div className="w-3/4 h-3/4 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 rounded-full">
                        <Server className="w-1/2 h-1/2 text-blue-600 dark:text-blue-400" />
                      </div>
                    )}
                  </>
                )}
              </div>
              
              {/* Chain name label - only show on hover or when selected */}
              {(isHovered || isSelected) && (
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap
                  px-2 py-1 rounded-md text-xs font-medium bg-white dark:bg-dark-800 shadow-md
                  border border-gray-100 dark:border-dark-700 text-gray-800 dark:text-gray-200
                  animate-fade-in z-30">
                  <div className="flex flex-col items-center">
                    <span>{chain.chainName}</span>
                    {chain.tps && (
                      <span className={`text-xs ${
                        chain.tps.value >= 1 ? 'text-green-500' : 
                        chain.tps.value >= 0.1 ? 'text-yellow-500' : 'text-red-500'
                      }`}>
                        {chain.tps.value.toFixed(2)} TPS
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Chain count legend */}
      <div className="mt-3 flex justify-between items-center">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Server className="w-4 h-4" />
          <span>Active chains: <span className="font-semibold">{chains.length}</span></span>
        </div>
        
        {/* TPS color legend */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-600 dark:text-gray-400">High TPS (≥1)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Medium TPS (≥0.1)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Low TPS (&lt;0.1)</span>
          </div>
        </div>
      </div>
    </div>
  );
}