import React, { useEffect, useState, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { format } from 'date-fns';
import { RefreshCw, AlertTriangle, MessageSquare, Activity, Clock, Network, Server } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { GlowingEffect } from './ui/glowing-effect';
import { cn } from '../lib/utils';

// Get API base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

// Import the API function to get chains with logos
const getChains = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chains`);
    if (!response.ok) throw new Error('Failed to fetch chains');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching chains:', error);
    return [];
  }
};

interface TeleporterMessage {
  source: string;
  target: string;
  value: number;
}

interface TeleporterData {
  messages: TeleporterMessage[];
  metadata: {
    totalMessages: number;
    timeWindow?: number;
    timeWindowUnit?: string;
    updatedAt: string;
  };
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  displayName: string;
  totalMessages: number;
  color: string;
  radius: number;
  isCentral: boolean;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: GraphNode;
  target: GraphNode;
  value: number;
  width: number;
  color: string;
}

export function TeleporterForceDirectedGraph() {
  const navigate = useNavigate();
  const [data, setData] = useState<TeleporterData | null>(null);
  const [chains, setChains] = useState<any[]>([]); // Add chains state for API data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [hoveredLink, setHoveredLink] = useState<GraphLink | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly'>('daily');
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const { theme } = useTheme();

  // Function to format chain names for better readability
  const formatChainName = (name: string) => {
    if (!name) return 'Unknown';
    if (name === 'Avalanche (C-Chain)') return 'C-Chain';
    if (name === 'Dexalot L1') return 'Dexalot';
    if (name === 'zeroone Mainnet L1') return 'ZeroOne';
    if (name === 'Lamina1 L1') return 'Lamina1';
    if (name === 'PLYR PHI L1') return 'PLYR';
    return name.length > 15 ? name.substring(0, 15) + '...' : name;
  };

  // Get chain logo URL from API data (same as Network Topology)
  const getChainLogo = (chainName: string) => {
    // First check if we have API data for this chain
    const chainData = chains.find(chain =>
      chain.chainName === chainName ||
      chain.chainId === chainName
    );

    if (chainData && chainData.chainLogoUri) {
      return chainData.chainLogoUri;
    }

    // Return null if no logo (same as Network Topology)
    return null;
  };

  // Generate a consistent color for a chain
  const getChainColor = useCallback((chainName: string, isCentral: boolean = false) => {
    if (isCentral) {
      return theme === 'dark' ? '#E84142' : '#E84142'; // Avalanche red
    }

    // Predefined colors for common chains
    const colorMap: Record<string, string> = {
      'Henesys': theme === 'dark' ? '#3b82f6' : '#2563eb',
      'Dexalot L1': theme === 'dark' ? '#8b5cf6' : '#7c3aed',
      'zeroone Mainnet L1': theme === 'dark' ? '#06d6a0' : '#059669',
      'Lamina1 L1': theme === 'dark' ? '#f59e0b' : '#d97706',
      'PLYR PHI L1': theme === 'dark' ? '#ec4899' : '#db2777',
    };

    if (colorMap[chainName]) {
      return colorMap[chainName];
    }

    // Hash the chain name to get a consistent hue
    const hash = chainName.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

    const h = Math.abs(hash) % 360;
    const s = theme === 'dark' ? '80%' : '70%';
    const l = theme === 'dark' ? '60%' : '50%';

    return `hsl(${h}, ${s}, ${l})`;
  }, [theme]);

  // Transform data into graph nodes and links
  const graphData = React.useMemo(() => {
    if (!data || !data.messages.length) {
      return { nodes: [], links: [] };
    }

    // Collect all unique chains and their message totals
    const chainMap = new Map<string, number>();

    data.messages.forEach(msg => {
      chainMap.set(msg.source, (chainMap.get(msg.source) || 0) + msg.value);
      chainMap.set(msg.target, (chainMap.get(msg.target) || 0) + msg.value);
    });

    // Add chains from API that might not have messages yet
    chains.forEach(chain => {
      if (!chainMap.has(chain.chainName)) {
        chainMap.set(chain.chainName, 0); // Add with zero messages
      }
    });

    // Find max messages for scaling
    const maxMessages = Math.max(...Array.from(chainMap.values()), 1); // Ensure at least 1

    // Create nodes (including zero-value nodes)
    const nodes: GraphNode[] = Array.from(chainMap.entries()).map(([chainName, totalMessages]) => {
      const isCentral = chainName === 'Avalanche (C-Chain)';

      // Logarithmic scaling for node size, with minimum size for visibility
      const logScale = totalMessages > 0 ? Math.log(totalMessages + 1) / Math.log(maxMessages + 1) : 0.1;
      const baseRadius = isCentral ? 25 : 15;
      const minRadius = isCentral ? 20 : 12; // Minimum size for zero-value nodes
      const radius = Math.max(minRadius, baseRadius + (logScale * (isCentral ? 15 : 20)));

      return {
        id: chainName,
        name: chainName,
        displayName: formatChainName(chainName),
        totalMessages,
        color: getChainColor(chainName, isCentral),
        radius,
        isCentral,
        x: isCentral ? 0 : undefined,
        y: isCentral ? 0 : undefined,
      };
    });

    // Create links (only for non-zero messages)
    const maxLinkValue = Math.max(...data.messages.map(msg => msg.value), 1);
    const links: GraphLink[] = data.messages
      .filter(msg => msg.value > 0)
      .map(msg => {
        const source = nodes.find(n => n.id === msg.source)!;
        const target = nodes.find(n => n.id === msg.target)!;

        // More subtle link width scaling
        const logScale = Math.log(msg.value + 1) / Math.log(maxLinkValue + 1);
        const width = Math.max(0.5, logScale * 4); // Thinner, more elegant lines

        // Gradient color from source to target
        const color = source.color;

        return {
          source,
          target,
          value: msg.value,
          width,
          color,
        };
      });

    return { nodes, links };
  }, [data, getChainColor, chains]);

  // Initialize and update the force simulation
  const initializeSimulation = useCallback(() => {
    if (!svgRef.current || !containerRef.current || !graphData.nodes.length) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    // Create main SVG group with zoom behavior
    const svg = d3.select(svgRef.current);
    const g = svg.append('g');

    // Setup zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Center the view
    svg.call(zoom.transform, d3.zoomIdentity.translate(width / 2, height / 2));

    // Create force simulation
    const simulation = d3.forceSimulation<GraphNode>(graphData.nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(graphData.links)
        .id(d => d.id)
        .distance(d => {
          // Shorter distances for high-value connections
          const logValue = Math.log(d.value + 1);
          return Math.max(50, 150 - logValue * 10);
        })
        .strength(0.5)
      )
      .force('charge', d3.forceManyBody()
        .strength(d => d.isCentral ? -800 : -300)
      )
      .force('center', d3.forceCenter(0, 0))
      .force('collision', d3.forceCollide()
        .radius(d => d.radius + 5)
        .strength(0.7)
      );

    simulationRef.current = simulation;

    // Create gradient definitions
    const defs = g.append('defs');

    // Create gradients for links
    graphData.links.forEach((link, i) => {
      const gradientId = `link-gradient-${i}`;
      const gradient = defs.append('linearGradient')
        .attr('id', gradientId)
        .attr('gradientUnits', 'userSpaceOnUse');

      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', link.source.color)
        .attr('stop-opacity', 0.8);

      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', link.target.color)
        .attr('stop-opacity', 0.6);

      (link as any).gradientId = gradientId;
    });

    // Create glow filters
    const glowFilter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');

    glowFilter.append('feGaussianBlur')
      .attr('stdDeviation', '3')
      .attr('result', 'coloredBlur');

    const merge = glowFilter.append('feMerge');
    merge.append('feMergeNode').attr('in', 'coloredBlur');
    merge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Create links
    const linkGroup = g.append('g').attr('class', 'links');
    const links = linkGroup.selectAll('line')
      .data(graphData.links)
      .enter()
      .append('line')
      .attr('stroke', d => `url(#${(d as any).gradientId})`)
      .attr('stroke-width', d => d.width)
      .attr('stroke-opacity', 0.6)
      .style('cursor', 'pointer')
      .on('mouseover', function (event, d) {
        d3.select(this)
          .attr('stroke-opacity', 0.9)
          .attr('stroke-width', d.width * 1.5);

        // Dim other links
        links.filter(link => link !== d)
          .attr('stroke-opacity', 0.2);

        setHoveredLink(d);
        setTooltipPosition({ x: event.pageX, y: event.pageY });
      })
      .on('mousemove', function (event) {
        setTooltipPosition({ x: event.pageX, y: event.pageY });
      })
      .on('mouseout', function () {
        // Reset links with smooth transition
        links
          .attr('stroke-opacity', 0.4)
          .attr('stroke-width', d => d.width)
          .attr('filter', null);

        setHoveredLink(null);
      });

    // Create nodes
    const nodeGroup = g.append('g').attr('class', 'nodes');
    const nodes = nodeGroup.selectAll('g')
      .data(graphData.nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(d3.drag<SVGGElement, GraphNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      );

    // Add node circles with logos (glassmorphic style like Network Topology)
    nodes.each(function (d) {
      const node = d3.select(this);
      const logoUrl = getChainLogo(d.name);

      // Create clipPath for circular logo
      const clipId = `clip-${d.id.replace(/[^a-zA-Z0-9]/g, '')}`;
      defs.append('clipPath')
        .attr('id', clipId)
        .append('circle')
        .attr('r', d.radius - 4); // Slightly smaller for border effect

      if (logoUrl) {
        // Glassmorphic background circle
        node.append('circle')
          .attr('r', d.radius)
          .attr('fill', theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.9)')
          .attr('stroke', theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)')
          .attr('stroke-width', 1.5)
          .attr('filter', 'url(#backdropBlur)')
          .style('backdrop-filter', 'blur(10px)');

        // Inner shadow circle for depth
        node.append('circle')
          .attr('r', d.radius - 2)
          .attr('fill', 'none')
          .attr('stroke', theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)')
          .attr('stroke-width', 1);

        // Logo image
        node.append('image')
          .attr('href', logoUrl)
          .attr('x', -(d.radius - 6))
          .attr('y', -(d.radius - 6))
          .attr('width', (d.radius - 6) * 2)
          .attr('height', (d.radius - 6) * 2)
          .attr('clip-path', `url(#${clipId})`)
          .style('pointer-events', 'none')
          .on('error', function () {
            // Fallback if image fails to load
            d3.select(this).remove();
            addServerIconFallback(node, d);
          });

        // Subtle glow effect for central node
        if (d.isCentral) {
          node.append('circle')
            .attr('r', d.radius + 3)
            .attr('fill', 'none')
            .attr('stroke', '#E84142')
            .attr('stroke-width', 2)
            .attr('stroke-opacity', 0.4)
            .attr('filter', 'url(#glow)');
        }
      } else {
        // No logo available - use Server icon fallback with glassmorphic style
        addServerIconFallback(node, d);
      }
    });

    // Create backdrop blur filter for glassmorphism
    const backdropBlur = defs.append('filter')
      .attr('id', 'backdropBlur')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');

    backdropBlur.append('feGaussianBlur')
      .attr('in', 'SourceGraphic')
      .attr('stdDeviation', '2');

    // Helper function to add Server icon fallback with glassmorphic style
    function addServerIconFallback(node: any, d: GraphNode) {
      // Glassmorphic background circle
      node.append('circle')
        .attr('r', d.radius)
        .attr('fill', theme === 'dark' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(219, 234, 254, 0.8)') // blue glassmorphic
        .attr('stroke', theme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.3)')
        .attr('stroke-width', 1.5)
        .attr('filter', 'url(#backdropBlur)')
        .style('backdrop-filter', 'blur(10px)');

      // Inner highlight for glassmorphic effect
      node.append('circle')
        .attr('r', d.radius - 2)
        .attr('fill', 'none')
        .attr('stroke', theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.7)')
        .attr('stroke-width', 1);

      // Server icon (SVG path equivalent to Lucide's Server icon)
      const serverIconSize = d.radius * 0.4;
      node.append('path')
        .attr('d', 'M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18 M16 10a2 2 0 0 1-2-2 M12 10a2 2 0 0 1-2-2 M8 10a2 2 0 0 1-2-2')
        .attr('fill', 'none')
        .attr('stroke', theme === 'dark' ? '#60a5fa' : '#3b82f6') // blue-400 : blue-500
        .attr('stroke-width', 1.5)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .attr('transform', `scale(${serverIconSize / 24}) translate(-12, -12)`)
        .style('pointer-events', 'none');

      // Subtle glow for central node
      if (d.isCentral) {
        node.append('circle')
          .attr('r', d.radius + 3)
          .attr('fill', 'none')
          .attr('stroke', '#E84142')
          .attr('stroke-width', 2)
          .attr('stroke-opacity', 0.4)
          .attr('filter', 'url(#glow)');
      }
    }

    // Add hover effects to all node elements
    nodes.selectAll('circle, image, path')
      .on('mouseover', function (event, d) {
        d3.select(this.parentNode).selectAll('circle')
          .attr('filter', 'url(#glow)')
          .attr('stroke-opacity', 0.8);

        // Highlight connected links with elegant animation
        links
          .attr('stroke-opacity', link =>
            link.source === d || link.target === d ? 0.9 : 0.15
          )
          .attr('stroke-width', link =>
            link.source === d || link.target === d ? Math.min(link.width * 1.5, 5) : link.width
          )
          .attr('filter', link =>
            link.source === d || link.target === d ? `url(#${link.glow})` : null
          );

        setHoveredNode(d);
        setTooltipPosition({ x: event.pageX, y: event.pageY });
      })
      .on('mousemove', function (event) {
        setTooltipPosition({ x: event.pageX, y: event.pageY });
      })
      .on('mouseout', function (event, d) {
        d3.select(this.parentNode).selectAll('circle')
          .attr('filter', null)
          .attr('stroke-opacity', 0.3);

        links
          .attr('stroke-opacity', 0.6)
          .attr('stroke-width', d => d.width);

        setHoveredNode(null);
      })
      .on('click', function (event, d) {
        setSelectedNode(selectedNode === d ? null : d);
        event.stopPropagation();
      });

    // Update positions on simulation tick
    simulation.on('tick', () => {
      links
        .attr('x1', d => (d.source as GraphNode).x!)
        .attr('y1', d => (d.source as GraphNode).y!)
        .attr('x2', d => (d.target as GraphNode).x!)
        .attr('y2', d => (d.target as GraphNode).y!);

      nodes
        .attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Add background click to clear selection
    svg.on('click', () => {
      setSelectedNode(null);
    });

  }, [graphData, theme, selectedNode, chains]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch chains data (for logos) and generate sample teleporter data
      const chainsData = await getChains();
      const sampleData = generateSampleData();

      setChains(chainsData);
      setData(sampleData);
    } catch (err) {
      console.error(`Failed to fetch ${timeframe} data:`, err);
      setError(`Failed to load ${timeframe} data`);
    } finally {
      setLoading(false);
    }
  };

  // Generate comprehensive sample data
  const generateSampleData = (): TeleporterData => {
    const chains = [
      'Avalanche (C-Chain)', 'Henesys', 'Dexalot L1', 'zeroone Mainnet L1',
      'Lamina1 L1', 'PLYR PHI L1', 'cognet', 'NUMINE Mainnet', 'KOROSHI L1',
      'StratosX L1', 'Nexus L1', 'Velocity Chain', 'Quantum L1', 'Echo Network',
      'Pulse Chain', 'Infinity L1', 'Matrix Network', 'Stellar L1', 'Nova Chain',
      'Cosmos L1', 'Orbit Network', 'Flux Chain', 'Prism L1', 'Vertex Network'
    ];

    const messages: TeleporterMessage[] = [];

    // High volume pairs (like your real data)
    messages.push(
      { source: 'Henesys', target: 'Avalanche (C-Chain)', value: 5785 },
      { source: 'Avalanche (C-Chain)', target: 'Henesys', value: 6065 },
      { source: 'Dexalot L1', target: 'Avalanche (C-Chain)', value: 2436 },
      { source: 'Avalanche (C-Chain)', target: 'Dexalot L1', value: 2993 }
    );

    // Medium volume pairs
    chains.slice(4, 12).forEach((chain, i) => {
      messages.push(
        { source: chain, target: 'Avalanche (C-Chain)', value: 150 - i * 15 },
        { source: 'Avalanche (C-Chain)', target: chain, value: 120 - i * 10 }
      );
    });

    // Low volume pairs
    chains.slice(12).forEach((chain, i) => {
      messages.push(
        { source: chain, target: 'Avalanche (C-Chain)', value: Math.max(1, 28 - i * 2) },
        { source: 'Avalanche (C-Chain)', target: chain, value: Math.max(1, 22 - i * 2) }
      );
    });

    // Some cross-chain communication
    for (let i = 0; i < 15; i++) {
      const source = chains[Math.floor(Math.random() * chains.length)];
      const target = chains[Math.floor(Math.random() * chains.length)];
      if (source !== target) {
        messages.push({ source, target, value: Math.floor(Math.random() * 50) + 1 });
      }
    }

    const totalMessages = messages.reduce((sum, msg) => sum + msg.value, 0);

    return {
      messages,
      metadata: {
        totalMessages,
        timeWindow: timeframe === 'daily' ? 24 : 7,
        timeWindowUnit: timeframe === 'daily' ? 'hours' : 'days',
        updatedAt: new Date().toISOString()
      }
    };
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [timeframe]);

  useEffect(() => {
    initializeSimulation();

    const handleResize = () => {
      setTimeout(initializeSimulation, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, [initializeSimulation, chains]); // Add chains dependency

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getTimeSinceUpdate = (): string => {
    if (!data?.metadata.updatedAt) return 'Unknown';
    const updateTime = new Date(data.metadata.updatedAt);
    const now = new Date();
    const diffMs = now.getTime() - updateTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  };

  if (loading) {
    return (
      <div className="relative h-full">
        <div className="relative h-full rounded-xl border border-border p-2">
          <GlowingEffect
            spread={35}
            glow={true}
            disabled={false}
            proximity={100}
            inactiveZone={0.15}
            borderWidth={2}
            movementDuration={2}
          />
          <div className={cn(
            "relative h-full overflow-hidden rounded-lg border border-border",
            "bg-card text-card-foreground shadow-sm"
          )}>
            <div className="h-[500px] flex flex-col items-center justify-center">
              <RefreshCw className="h-12 w-12 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">Loading network graph...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data || error) {
    return (
      <div className="relative h-full">
        <div className="relative h-full rounded-xl border border-border p-2">
          <GlowingEffect
            spread={35}
            glow={true}
            disabled={false}
            proximity={100}
            inactiveZone={0.15}
            borderWidth={2}
            movementDuration={2}
          />
          <div className={cn(
            "relative h-full overflow-hidden rounded-lg border border-border",
            "bg-card text-card-foreground shadow-sm"
          )}>
            <div className="h-[500px] flex flex-col items-center justify-center">
              <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
              <p className="text-muted-foreground text-center mb-4">
                {error || 'No network data available'}
              </p>
              <button
                onClick={fetchData}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90"
              >
                <RefreshCw className="-ml-1 mr-2 h-4 w-4" />
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      {/* Outer container with glowing effect */}
      <div className="relative h-full rounded-xl border border-border p-2">
        <GlowingEffect
          spread={35}
          glow={true}
          disabled={false}
          proximity={100}
          inactiveZone={0.15}
          borderWidth={2}
          movementDuration={2}
        />

        {/* Inner content container */}
        <div className={cn(
          "relative h-full overflow-hidden rounded-lg border border-border",
          "bg-card text-card-foreground shadow-sm"
        )}>
          <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Network className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">
                  Network Flow Graph
                </h3>
              </div>

              <div className="flex items-center gap-3">
                {/* Timeframe toggle */}
                <div className="bg-muted rounded-full p-1 flex items-center">
                  <button
                    onClick={() => setTimeframe('daily')}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${timeframe === 'daily'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                  >
                    Daily
                  </button>
                  <button
                    onClick={() => setTimeframe('weekly')}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${timeframe === 'weekly'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                  >
                    Weekly
                  </button>
                </div>

                <button
                  onClick={fetchData}
                  className="p-1.5 rounded-full bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  title="Refresh data"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Graph Container */}
            <div
              ref={containerRef}
              className="relative bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg border border-border overflow-hidden"
              style={{ height: '500px' }}
            >
              <svg
                ref={svgRef}
                className="w-full h-full"
                style={{ background: 'transparent' }}
              />

              {/* Tooltip for nodes */}
              {hoveredNode && (
                <div
                  className="fixed z-50 bg-popover text-popover-foreground p-3 rounded-lg shadow-lg border border-border text-sm pointer-events-none max-w-xs"
                  style={{
                    left: `${tooltipPosition.x + 10}px`,
                    top: `${tooltipPosition.y - 80}px`,
                    transform: 'translate(-50%, -100%)'
                  }}
                >
                  <div className="font-medium text-popover-foreground mb-1">
                    {hoveredNode.displayName}
                  </div>
                  <div className="text-muted-foreground">
                    Total messages: <span className="font-semibold">{hoveredNode.totalMessages.toLocaleString()}</span>
                  </div>
                  <div className="text-muted-foreground">
                    {((hoveredNode.totalMessages / data.metadata.totalMessages) * 100).toFixed(1)}% of network
                  </div>
                  {hoveredNode.isCentral && (
                    <div className="text-xs text-primary mt-1">
                      Central Hub
                    </div>
                  )}
                </div>
              )}

              {/* Tooltip for links */}
              {hoveredLink && (
                <div
                  className="fixed z-50 bg-popover text-popover-foreground p-3 rounded-lg shadow-lg border border-border text-sm pointer-events-none max-w-xs"
                  style={{
                    left: `${tooltipPosition.x + 10}px`,
                    top: `${tooltipPosition.y - 80}px`,
                    transform: 'translate(-50%, -100%)'
                  }}
                >
                  <div className="font-medium text-popover-foreground mb-1">
                    {formatChainName(hoveredLink.source.name)} → {formatChainName(hoveredLink.target.name)}
                  </div>
                  <div className="text-muted-foreground">
                    Messages: <span className="font-semibold">{hoveredLink.value.toLocaleString()}</span>
                  </div>
                  <div className="text-muted-foreground">
                    {((hoveredLink.value / data.metadata.totalMessages) * 100).toFixed(2)}% of total
                  </div>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center bg-gradient-to-r from-primary to-primary/80 rounded-lg overflow-hidden shadow-lg">
                <div className="px-3 py-2 flex items-center gap-2">
                  <div className="bg-primary-foreground/20 rounded-full p-1.5">
                    <MessageSquare className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-primary-foreground/70 font-medium">Total Messages</span>
                    <span className="text-lg font-bold text-primary-foreground">{formatNumber(data.metadata.totalMessages)}</span>
                  </div>
                </div>
                <div className="h-full w-px bg-primary-foreground/20"></div>
                <div className="px-3 py-2 flex items-center gap-2">
                  <div className="bg-primary-foreground/20 rounded-full p-1.5">
                    <Network className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-primary-foreground/70 font-medium">Active Chains</span>
                    <span className="text-sm font-bold text-primary-foreground">{graphData.nodes.length}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-full shadow-sm border border-border">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {getTimeSinceUpdate()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeleporterForceDirectedGraph;