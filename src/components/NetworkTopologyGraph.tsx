import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { getChains } from '../api';
import { Chain } from '../types';
import { Server, AlertTriangle, RefreshCw, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NodePosition {
  x: number;
  y: number;
  orbit: number;
  angle: number;
  visible: boolean;
}

interface Bullet {
  id: string;
  fromChainId: string;
  toChainId: string;
  progress: number;
  speed: number;
  size: number;
  color: string;
  visible: boolean;
}

const ORBIT_CONFIG = {
  count: 3,
  baseRadius: 80,
  radiusIncrement: 60,
  baseSpeed: 0.0008, // Very slow for inner orbit
  speedMultiplier: 1.8, // Each outer orbit is 1.8x faster
  visibilityThreshold: 0.15, // How far off-screen before hiding (0-1)
};

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
  const rotationAngles = useRef<number[]>([0, 0, 0]); // Track rotation for each orbit

  // Animation settings
  const BULLET_BASE_SPEED = 0.15;
  const MAX_BULLETS = 30;
  const BULLET_SPAWN_RATE = 0.03;

  useEffect(() => {
    async function fetchChains() {
      try {
        setLoading(true);
        const chainsData = await getChains();

        if (chainsData && chainsData.length > 0) {
          const validChains = chainsData.filter(chain =>
            (chain.validators && chain.validators.length > 0) ||
            chain.chainName.toLowerCase().includes('avalanche') ||
            chain.chainName.toLowerCase().includes('c-chain')
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

  // Find C-Chain for center positioning
  const cChain = useMemo(() => chains.find(chain =>
    chain.chainName.toLowerCase().includes('c-chain') ||
    chain.chainName.toLowerCase().includes('c chain')
  ), [chains]);

  // Randomly distribute chains across orbits
  const chainOrbits = useMemo(() => {
    if (!chains.length || !cChain) return new Map();

    const otherChains = chains.filter(chain => chain.chainId !== cChain.chainId);
    const orbits = new Map<string, number>();

    // Randomly assign each chain to an orbit
    otherChains.forEach(chain => {
      const orbit = Math.floor(Math.random() * ORBIT_CONFIG.count);
      orbits.set(chain.chainId, orbit);
    });

    return orbits;
  }, [chains, cChain]);

  // Calculate node sizes
  const getNodeSize = (chain: Chain, isCenter: boolean) => {
    if (isCenter) return 70;

    if (chain.tps && typeof chain.tps.value === 'number') {
      const tpsValue = chain.tps.value;
      if (tpsValue <= 0.1) return 35;
      const scaleFactor = Math.min(2, 1 + Math.log10(tpsValue) * 0.3);
      return 35 * scaleFactor;
    }

    return 35;
  };

  // Calculate positions for arc carousel
  const calculatePositions = useCallback(() => {
    if (!containerRef.current || chains.length === 0 || !cChain) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    setDimensions({ width, height });

    const centerX = width / 2;
    const centerY = height - 60; // Position C-Chain near bottom

    const newPositions = new Map<string, NodePosition>();

    // Position C-Chain at center bottom
    newPositions.set(cChain.chainId, {
      x: centerX,
      y: centerY,
      orbit: -1,
      angle: 0,
      visible: true
    });

    // Position other chains in orbits
    const otherChains = chains.filter(chain => chain.chainId !== cChain.chainId);

    // Group chains by orbit
    const orbitGroups: Chain[][] = [[], [], []];
    otherChains.forEach(chain => {
      const orbit = chainOrbits.get(chain.chainId) ?? 0;
      orbitGroups[orbit].push(chain);
    });

    // Calculate positions for each orbit
    orbitGroups.forEach((orbitChains, orbitIndex) => {
      if (orbitChains.length === 0) return;

      const radius = ORBIT_CONFIG.baseRadius + (orbitIndex * ORBIT_CONFIG.radiusIncrement);
      const currentRotation = rotationAngles.current[orbitIndex];

      orbitChains.forEach((chain, chainIndex) => {
        // Evenly distribute chains around the semicircle (180 degrees)
        const baseAngle = (chainIndex / orbitChains.length) * Math.PI;
        const totalAngle = baseAngle + currentRotation;

        // Calculate position
        const x = centerX + radius * Math.cos(totalAngle);
        const y = centerY - radius * Math.sin(totalAngle);

        // Check visibility (chains are visible when y-coordinate shows they're in the upper semicircle)
        const normalizedAngle = ((totalAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const isInVisibleRange = normalizedAngle >= 0 && normalizedAngle <= Math.PI;
        const distanceFromEdge = Math.min(
          Math.abs(normalizedAngle),
          Math.abs(normalizedAngle - Math.PI)
        ) / (Math.PI * ORBIT_CONFIG.visibilityThreshold);

        const visible = isInVisibleRange && distanceFromEdge > 1;

        newPositions.set(chain.chainId, {
          x,
          y,
          orbit: orbitIndex,
          angle: totalAngle,
          visible
        });
      });
    });

    setPositions(newPositions);
  }, [chains, cChain, chainOrbits]);

  // Animation loop for rotation and bullets
  useEffect(() => {
    if (chains.length === 0 || !cChain) return;

    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      if (deltaTime > 100) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      // Update orbit rotations
      for (let i = 0; i < ORBIT_CONFIG.count; i++) {
        const speed = ORBIT_CONFIG.baseSpeed * Math.pow(ORBIT_CONFIG.speedMultiplier, i);
        rotationAngles.current[i] += speed * deltaTime;
      }

      // Recalculate positions
      calculatePositions();

      // Update bullets
      setBullets(prevBullets => {
        const centerPosition = positions.get(cChain.chainId);
        if (!centerPosition) return prevBullets;

        const updatedBullets = prevBullets
          .map(bullet => {
            const newProgress = bullet.progress + (bullet.speed * deltaTime * 0.001);
            const fromPos = positions.get(bullet.fromChainId);
            const toPos = positions.get(bullet.toChainId);

            // Check if bullet should be visible based on connected nodes
            const visible = fromPos?.visible && toPos?.visible;

            return { ...bullet, progress: newProgress, visible };
          })
          .filter(bullet => bullet.progress < 1 && bullet.visible);

        // Spawn new bullets occasionally between visible chains
        if (updatedBullets.length < MAX_BULLETS && Math.random() < BULLET_SPAWN_RATE) {
          const visibleChains = chains.filter(chain => {
            const pos = positions.get(chain.chainId);
            return pos?.visible && chain.chainId !== cChain.chainId;
          });

          if (visibleChains.length > 0) {
            const randomChain = visibleChains[Math.floor(Math.random() * visibleChains.length)];
            const direction = Math.random() > 0.5 ? 'outgoing' : 'incoming';

            const newBullet: Bullet = {
              id: `bullet-${bulletIdCounter.current++}`,
              fromChainId: direction === 'outgoing' ? cChain.chainId : randomChain.chainId,
              toChainId: direction === 'outgoing' ? randomChain.chainId : cChain.chainId,
              progress: 0,
              speed: BULLET_BASE_SPEED * (0.8 + Math.random() * 0.4),
              size: 2 + Math.random() * 2,
              color: getRandomBulletColor(),
              visible: true
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
  }, [chains, cChain, positions, calculatePositions]);

  // Handle container resize
  useEffect(() => {
    calculatePositions();

    const handleResize = () => {
      calculatePositions();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [calculatePositions]);

  // Helper function for bullet colors
  const getRandomBulletColor = () => {
    const colors = [
      '#E84142', // Avalanche red
      '#3b82f6', '#60a5fa', '#93c5fd',
      '#6366f1', '#818cf8', '#a5b4fc',
      '#8b5cf6', '#a78bfa',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Handle chain click
  const handleChainClick = (chain: Chain) => {
    navigate(`/chain/${chain.chainId}`);
  };

  // Create curved path for connections
  const createCurvedPath = (fromPos: NodePosition, toPos: NodePosition) => {
    const midX = (fromPos.x + toPos.x) / 2;
    const midY = (fromPos.y + toPos.y) / 2 - 30; // Add curve by pulling up

    return `M ${fromPos.x} ${fromPos.y} Q ${midX} ${midY} ${toPos.x} ${toPos.y}`;
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
              bulletIdCounter.current = 0;
              setBullets([]);
            }}
            className="ml-2 p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800/30 transition-colors"
            title="Reset animation"
          >
            <Zap className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative bg-gradient-to-b from-gray-50 to-gray-100 dark:from-dark-900/70 dark:to-dark-900/90 rounded-lg border border-gray-100 dark:border-dark-700 h-[400px] w-full overflow-hidden"
      >
        {/* Background effect */}
        <div className="absolute inset-0">
          {/* Orbital guides (subtle) */}
          {cChain && positions.get(cChain.chainId) && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <radialGradient id="centerGlow" cx="50%" cy="100%" r="60%">
                  <stop offset="0%" stopColor="rgba(232, 65, 66, 0.15)" />
                  <stop offset="100%" stopColor="rgba(232, 65, 66, 0)" />
                </radialGradient>
              </defs>

              {/* Center glow */}
              <ellipse
                cx={positions.get(cChain.chainId)?.x}
                cy={positions.get(cChain.chainId)?.y}
                rx="120"
                ry="60"
                fill="url(#centerGlow)"
                className="animate-pulse-slow"
              />

              {/* Orbital guides */}
              {[0, 1, 2].map(orbit => {
                const centerPos = positions.get(cChain.chainId);
                if (!centerPos) return null;

                const radius = ORBIT_CONFIG.baseRadius + (orbit * ORBIT_CONFIG.radiusIncrement);
                return (
                  <path
                    key={orbit}
                    d={`M ${centerPos.x - radius} ${centerPos.y} A ${radius} ${radius} 0 0 0 ${centerPos.x + radius} ${centerPos.y}`}
                    fill="none"
                    stroke="rgba(156, 163, 175, 0.1)"
                    strokeWidth="1"
                    strokeDasharray="5,10"
                  />
                );
              })}
            </svg>
          )}
        </div>

        {/* Connections and bullets */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <filter id="bulletGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Draw connections */}
          {chains.map(chain => {
            const position = positions.get(chain.chainId);
            if (!position || !position.visible || chain.chainId === cChain?.chainId) return null;

            const centerPosition = positions.get(cChain?.chainId || '');
            if (!centerPosition) return null;

            const isHighlighted = hoveredChain?.chainId === chain.chainId || selectedChain?.chainId === chain.chainId;
            const opacity = position.visible ? (isHighlighted ? 0.8 : 0.4) : 0;

            return (
              <path
                key={`connection-${chain.chainId}`}
                d={createCurvedPath(centerPosition, position)}
                fill="none"
                stroke={isHighlighted ? '#E84142' : '#cbd5e1'}
                strokeWidth={isHighlighted ? "3" : "2"}
                opacity={opacity}
                strokeDasharray={isHighlighted ? "none" : "4,4"}
                className="transition-all duration-300"
              />
            );
          })}

          {/* Draw bullets */}
          {bullets.filter(bullet => bullet.visible).map(bullet => {
            const fromPosition = positions.get(bullet.fromChainId);
            const toPosition = positions.get(bullet.toChainId);

            if (!fromPosition || !toPosition) return null;

            // Calculate position along curved path
            const t = bullet.progress;
            const midX = (fromPosition.x + toPosition.x) / 2;
            const midY = (fromPosition.y + toPosition.y) / 2 - 30;

            // Quadratic Bezier curve interpolation
            const x = (1 - t) * (1 - t) * fromPosition.x + 2 * (1 - t) * t * midX + t * t * toPosition.x;
            const y = (1 - t) * (1 - t) * fromPosition.y + 2 * (1 - t) * t * midY + t * t * toPosition.y;

            return (
              <circle
                key={bullet.id}
                cx={x}
                cy={y}
                r={bullet.size}
                fill={bullet.color}
                filter="url(#bulletGlow)"
                opacity="0.8"
              />
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
          const shouldShow = isCenter || position.visible;

          if (!shouldShow) return null;

          const nodeSize = getNodeSize(chain, isCenter);

          return (
            <div
              key={chain.chainId}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 cursor-pointer
                ${isHovered || isSelected ? 'scale-110 z-20' : 'scale-100 z-10'}
                ${isCenter ? 'z-30' : ''}
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
              {/* Special styling for center node */}
              {isCenter && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-500/30 to-red-600/40 animate-pulse-slow"></div>
              )}

              {/* Node container */}
              <div className={`
                relative w-full h-full rounded-full flex items-center justify-center transition-all duration-300
                ${isCenter
                  ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/30'
                  : 'bg-white dark:bg-dark-800 shadow-md border border-gray-200 dark:border-gray-700'}
                ${isHovered || isSelected
                  ? 'shadow-xl' + (isCenter ? '' : ' border-blue-400 dark:border-blue-300')
                  : ''}
              `}>
                {/* TPS indicator for non-center nodes */}
                {!isCenter && chain.tps && (
                  <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-dark-800 ${chain.tps.value >= 1 ? 'bg-green-500' :
                      chain.tps.value >= 0.1 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                )}

                {/* Inner content */}
                <div className={`w-full h-full rounded-full flex items-center justify-center ${isCenter ? 'bg-white dark:bg-dark-800 m-1.5' : ''
                  }`}>
                  {chain.chainLogoUri ? (
                    <img
                      src={chain.chainLogoUri}
                      alt={chain.chainName}
                      className={`object-contain rounded-full ${isCenter ? 'w-3/4 h-3/4' : 'w-4/5 h-4/5'
                        }`}
                    />
                  ) : (
                    <Server className={`text-blue-600 dark:text-blue-400 ${isCenter ? 'w-1/2 h-1/2' : 'w-1/2 h-1/2'
                      }`} />
                  )}
                </div>
              </div>

              {/* Hover tooltip */}
              {(isHovered || isSelected) && (
                <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap
                  px-3 py-2 rounded-md text-xs font-medium bg-white dark:bg-dark-800 shadow-lg
                  border border-gray-200 dark:border-dark-700 text-gray-800 dark:text-gray-200
                  animate-fade-in z-40">
                  <div className="flex flex-col items-center">
                    <span className="font-semibold">{chain.chainName}</span>
                    {chain.tps && (
                      <span className={`text-xs ${chain.tps.value >= 1 ? 'text-green-500' :
                          chain.tps.value >= 0.1 ? 'text-yellow-500' : 'text-red-500'
                        }`}>
                        {chain.tps.value.toFixed(2)} TPS
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {chain.validators.length} validators
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Status bar */}
      <div className="mt-4 flex justify-between items-center">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Server className="w-4 h-4" />
          <span>Active chains: <span className="font-semibold">{chains.length}</span></span>
        </div>

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