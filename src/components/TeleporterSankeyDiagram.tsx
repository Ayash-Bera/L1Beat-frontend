import React, { useEffect, useState, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';
import { format } from 'date-fns';
import { RefreshCw, AlertTriangle, MessageSquare, ArrowUpDown, Activity, Clock } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { GlowingEffect } from './ui/glowing-effect';
import { cn } from '../lib/utils';

// Get API base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

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
    startDate?: string;
    endDate?: string;
    updatedAt: string;
  };
}

interface SankeyNode extends d3.SankeyNode<SankeyNode, SankeyLink> {
  name: string;
  id: string;
  color?: string;
  displayName?: string;
  originalName?: string;
}

interface SankeyLink extends d3.SankeyLink<SankeyNode, SankeyLink> {
  source: SankeyNode;
  target: SankeyNode;
  value: number;
  gradient?: string;
}

export function TeleporterSankeyDiagram() {
  const navigate = useNavigate();
  const [data, setData] = useState<TeleporterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredLink, setHoveredLink] = useState<SankeyLink | null>(null);
  const [hoveredNode, setHoveredNode] = useState<SankeyNode | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [selectedChain, setSelectedChain] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly'>('daily');
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  // Track theme changes and force redraw
  const [, forceUpdate] = useState({});

  // This effect runs when theme changes and forces a complete redraw
  useEffect(() => {
    if (data && svgRef.current) {
      console.log("Theme changed to:", theme, "- forcing chart redraw");
      // Clear the SVG
      d3.select(svgRef.current).selectAll('*').remove();
      // Force a component update by setting a new empty object reference
      forceUpdate({});
    }
  }, [theme, data]);

  // Listen for theme change events from ThemeToggle
  useEffect(() => {
    const handleThemeChange = (event: CustomEvent) => {
      console.log("Theme change event received:", event.detail);
      if (data && svgRef.current) {
        // Clear the SVG
        d3.select(svgRef.current).selectAll('*').remove();
        // Force a component update
        forceUpdate({});
      }
    };

    window.addEventListener('themeChanged', handleThemeChange as EventListener);

    return () => {
      window.removeEventListener('themeChanged', handleThemeChange as EventListener);
    };
  }, [data]);

  // This effect directly updates text colors when theme changes
  useEffect(() => {
    if (svgRef.current) {
      // Find all node labels in the diagram and update their fill color directly
      const nodeLabels = d3.select(svgRef.current).selectAll('.node-label');
      nodeLabels.attr('fill', theme === 'dark' ? '#ffffff' : '#000000');

      console.log(`Directly updated ${nodeLabels.size()} node labels to ${theme === 'dark' ? 'white' : 'black'}`);
    }
  }, [theme]);

  // Create a single, definitive function to force text colors
  const forceTextColors = useCallback(() => {
    const textColor = theme === 'dark' ? '#ffffff' : '#000000';
    const secondaryTextColor = theme === 'dark' ? 'rgba(226, 232, 240, 0.7)' : 'rgba(30, 41, 59, 0.7)';

    // Force direct DOM updates to ensure color consistency
    document.querySelectorAll('.node-label').forEach(el => {
      el.setAttribute('fill', textColor);
    });

    document.querySelectorAll('.value-label, .diagram-title').forEach(el => {
      el.setAttribute('fill', secondaryTextColor);
    });
  }, [theme]);

  // Apply text colors immediately after any state change that might affect them
  useEffect(() => {
    // Use setTimeout to ensure this runs after any React updates
    const timer = setTimeout(forceTextColors, 0);
    return () => clearTimeout(timer);
  }, [theme, hoveredNode, hoveredLink, forceTextColors]);

  // Apply text colors when the diagram is first drawn or redrawn
  useEffect(() => {
    if (data && svgRef.current) {
      const timer = setTimeout(forceTextColors, 50);
      return () => clearTimeout(timer);
    }
  }, [data, forceTextColors]);

  // This effect ensures text colors are fixed AFTER tooltip renders
  useEffect(() => {
    // This runs immediately when hoveredNode or hoveredLink changes
    const fixColorsAfterTooltip = () => {
      // Use RAF to ensure this runs after DOM updates
      requestAnimationFrame(() => {
        const textColor = theme === 'dark' ? '#ffffff' : '#000000';

        // Force all node labels to have the correct theme color
        document.querySelectorAll('.node-label').forEach(el => {
          el.setAttribute('fill', textColor);
        });

        // Only run in light theme - this is for additional safety
        if (theme === 'light') {
          // Make absolutely sure text is black in light theme
          setTimeout(() => {
            document.querySelectorAll('.node-label').forEach(el => {
              el.setAttribute('fill', '#000000');
            });
          }, 10);
        }
      });
    };

    fixColorsAfterTooltip();
    // Set a series of delayed fixes to catch any late DOM updates
    const t1 = setTimeout(fixColorsAfterTooltip, 50);
    const t2 = setTimeout(fixColorsAfterTooltip, 100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [hoveredNode, hoveredLink, theme]);

  // Function to format chain names for better readability
  const formatChainName = (name: string) => {
    if (!name) return 'Unknown';

    // Special case for specific chains
    if (name === 'Avalanche (C-Chain)') return 'C-Chain';
    if (name === 'Dexalot L1') return 'Dexalot';
    if (name === 'zeroone Mainnet L1') return 'ZeroOne';
    if (name === 'Lamina1 L1') return 'Lamina1';
    if (name === 'PLYR PHI L1') return 'PLYR';

    // For other chains, just return the name
    return name;
  };

  // Generate a consistent color for a chain
  const getChainColor = useCallback((chainName: string) => {
    // Predefined colors for common chains
    const colorMap: Record<string, string> = {
      'Avalanche (C-Chain)': theme === 'dark' ? '#E84142' : '#E84142', // Avalanche red
      'C-Chain': theme === 'dark' ? '#E84142' : '#E84142', // Avalanche red
      'Dexalot L1': theme === 'dark' ? '#2775CA' : '#2775CA', // Blue
      'Dexalot': theme === 'dark' ? '#2775CA' : '#2775CA', // Blue
      'zeroone Mainnet L1': theme === 'dark' ? '#8A2BE2' : '#8A2BE2', // Purple
      'ZeroOne': theme === 'dark' ? '#8A2BE2' : '#8A2BE2', // Purple
      'Lamina1 L1': theme === 'dark' ? '#00BFFF' : '#00BFFF', // Deep sky blue
      'Lamina1': theme === 'dark' ? '#00BFFF' : '#00BFFF', // Deep sky blue
      'PLYR PHI L1': theme === 'dark' ? '#32CD32' : '#32CD32', // Lime green
      'PLYR': theme === 'dark' ? '#32CD32' : '#32CD32', // Lime green
    };

    // Return predefined color if available
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

  // Function to find chain ID from chain name
  const findChainId = (chainName: string) => {
    // Map of known chain names to their IDs
    const chainMap: Record<string, string> = {
      'Avalanche (C-Chain)': 'C',
      'C-Chain': 'C',
      'Dexalot L1': 'dexalot',
      'Dexalot': 'dexalot',
      'zeroone Mainnet L1': 'zeroone',
      'ZeroOne': 'zeroone',
      'Lamina1 L1': 'lamina1',
      'Lamina1': 'lamina1',
      'PLYR PHI L1': 'plyr',
      'PLYR': 'plyr',
    };

    return chainMap[chainName] || null;
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the appropriate endpoint based on the selected timeframe
      const endpoint = timeframe === 'daily'
        ? `${API_BASE_URL}/api/teleporter/messages/daily-count`
        : `${API_BASE_URL}/api/teleporter/messages/weekly-count`;

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const rawData = await response.json();

      // Process the API response format
      if (!rawData || !rawData.data || !Array.isArray(rawData.data)) {
        throw new Error('Invalid data format: Missing data array');
      }

      // Transform the data to our expected format
      const messages = rawData.data.map((item: any) => ({
        source: item.sourceChain || 'Unknown',
        target: item.destinationChain || 'Unknown',
        value: Number(item.messageCount) || 0
      }));

      // Sort messages by value in descending order
      messages.sort((a, b) => b.value - a.value);

      const totalMessages = rawData.metadata?.totalMessages ||
        messages.reduce((sum, msg) => sum + msg.value, 0);

      const processedData: TeleporterData = {
        messages,
        metadata: {
          totalMessages,
          timeWindow: timeframe === 'daily' ? 24 : 7,
          timeWindowUnit: timeframe === 'daily' ? 'hours' : 'days',
          updatedAt: rawData.metadata?.updatedAt || new Date().toISOString()
        }
      };

      setData(processedData);
    } catch (err) {
      console.error(`Failed to fetch ${timeframe} Teleporter messages:`, err);

      // Use sample data for demonstration when there's an error
      const sampleData = generateSampleData();
      setData(sampleData);
      setError(`Using sample data - API connection failed for ${timeframe} data`);
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  // Generate sample data for demonstration
  const generateSampleData = (): TeleporterData => {
    // Different sample data based on timeframe
    const dailySampleMessages = [
      { source: 'Dexalot L1', target: 'Avalanche (C-Chain)', value: 408 },
      { source: 'Avalanche (C-Chain)', target: 'Dexalot L1', value: 362 },
      { source: 'Avalanche (C-Chain)', target: 'zeroone Mainnet L1', value: 24 },
      { source: 'Lamina1 L1', target: 'Avalanche (C-Chain)', value: 17 },
      { source: 'zeroone Mainnet L1', target: 'Avalanche (C-Chain)', value: 16 },
      { source: 'Avalanche (C-Chain)', target: '898b8aa8', value: 12 },
      { source: 'Avalanche (C-Chain)', target: 'PLYR PHI L1', value: 6 },
      { source: 'PLYR PHI L1', target: 'Avalanche (C-Chain)', value: 2 }
    ];

    const weeklySampleMessages = [
      { source: 'Dexalot L1', target: 'Avalanche (C-Chain)', value: 2845 },
      { source: 'Avalanche (C-Chain)', target: 'Dexalot L1', value: 2532 },
      { source: 'Avalanche (C-Chain)', target: 'zeroone Mainnet L1', value: 168 },
      { source: 'zeroone Mainnet L1', target: 'Avalanche (C-Chain)', value: 112 },
      { source: 'Lamina1 L1', target: 'Avalanche (C-Chain)', value: 119 },
      { source: 'Avalanche (C-Chain)', target: 'Lamina1 L1', value: 84 },
      { source: 'Avalanche (C-Chain)', target: '898b8aa8', value: 84 },
      { source: 'Avalanche (C-Chain)', target: 'PLYR PHI L1', value: 42 },
      { source: 'PLYR PHI L1', target: 'Avalanche (C-Chain)', value: 14 }
    ];

    const messages = timeframe === 'daily' ? dailySampleMessages : weeklySampleMessages;
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

    // Reset selected chain when changing timeframe
    setSelectedChain(null);

    // Refresh data every 15 minutes
    const interval = setInterval(fetchData, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchData, timeframe]);

  // Handle node click to navigate to chain details
  const handleNodeClick = (node: SankeyNode) => {
    // Extract the original chain name from the node
    const chainName = node.originalName;
    if (!chainName) return;

    // Find the chain ID based on the chain name
    const chainId = findChainId(chainName);
    if (chainId) {
      navigate(`/chain/${chainId}`);
    } else {
      // If we can't find a chain ID, just toggle the filter
      setSelectedChain(selectedChain === node.name ? null : node.name);
    }
  };

  // Draw the Sankey diagram
  useEffect(() => {
    if (!data || !svgRef.current || !containerRef.current) return;

    // Clear previous diagram
    d3.select(svgRef.current).selectAll('*').remove();

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = Math.max(400, container.clientHeight);

    // Set up margins
    const margin = { top: 20, right: 30, bottom: 20, left: 30 };
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', containerWidth)
      .attr('height', containerHeight)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    try {
      // Check if we have enough data to create a diagram
      if (data.messages.length === 0) {
        throw new Error('No message data available');
      }

      // Create a map of unique source and target nodes
      const nodesMap = new Map();

      // Add all sources and targets to the map with unique IDs
      data.messages.forEach((msg) => {
        const sourceKey = `source-${msg.source}`;
        const targetKey = `target-${msg.target}`;

        if (!nodesMap.has(sourceKey)) {
          nodesMap.set(sourceKey, {
            name: sourceKey,
            displayName: formatChainName(msg.source),
            originalName: msg.source,
            isSource: true,
            color: getChainColor(msg.source)
          });
        }

        if (!nodesMap.has(targetKey)) {
          nodesMap.set(targetKey, {
            name: targetKey,
            displayName: formatChainName(msg.target),
            originalName: msg.target,
            isSource: false,
            color: getChainColor(msg.target)
          });
        }
      });

      // Convert the map to an array of nodes
      const nodes = Array.from(nodesMap.values());

      // Create links with references to node indices
      const links = data.messages.map(msg => {
        const sourceKey = `source-${msg.source}`;
        const targetKey = `target-${msg.target}`;

        return {
          source: sourceKey,
          target: targetKey,
          value: msg.value
        };
      });

      // Filter links and nodes based on selected chain
      let filteredLinks = links;
      let filteredNodes = nodes;

      if (selectedChain) {
        filteredLinks = links.filter(link =>
          link.source === selectedChain || link.target === selectedChain
        );

        // Get all node names that are in the filtered links
        const nodeNames = new Set();
        filteredLinks.forEach(link => {
          nodeNames.add(link.source);
          nodeNames.add(link.target);
        });

        filteredNodes = nodes.filter(node => nodeNames.has(node.name));
      }

      // Create the Sankey generator
      const sankeyGenerator = sankey<any, any>()
        .nodeId(d => d.name)
        .nodeWidth(25)
        .nodePadding(15)
        .extent([[0, 0], [width, height]]);

      // Generate the Sankey data
      const sankeyData = sankeyGenerator({
        nodes: filteredNodes,
        links: filteredLinks
      });

      // Add a subtle grid pattern
      const defs = svg.append('defs');

      // Create a pattern for the background
      defs.append('pattern')
        .attr('id', 'grid')
        .attr('width', 20)
        .attr('height', 20)
        .attr('patternUnits', 'userSpaceOnUse')
        .append('path')
        .attr('d', 'M 20 0 L 0 0 0 20')
        .attr('fill', 'none')
        .attr('stroke', theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)')
        .attr('stroke-width', 0.5);

      // Add background grid
      svg.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', 'url(#grid)')
        .attr('opacity', 0.5);

      // Create gradients for links
      sankeyData.links.forEach((link, i) => {
        const gradientId = `link-gradient-${i}`;

        const gradient = defs.append('linearGradient')
          .attr('id', gradientId)
          .attr('gradientUnits', 'userSpaceOnUse')
          .attr('x1', link.source.x1)
          .attr('x2', link.target.x0);

        // Start color (source node color)
        gradient.append('stop')
          .attr('offset', '0%')
          .attr('stop-color', link.source.color);

        // End color (target node color)
        gradient.append('stop')
          .attr('offset', '100%')
          .attr('stop-color', link.target.color);

        // Add gradient ID to link for reference
        link.gradient = gradientId;
      });

      // Draw the links with animations
      const linkGroup = svg.append('g')
        .attr('class', 'links')
        .attr('fill', 'none')
        .attr('stroke-opacity', 0.4);

      const links_g = linkGroup.selectAll('g')
        .data(sankeyData.links)
        .enter()
        .append('g')
        .attr('class', 'link-group');

      // Add link paths
      const linkPaths = links_g.append('path')
        .attr('d', sankeyLinkHorizontal())
        .attr('stroke', d => `url(#${d.gradient})`)
        .attr('stroke-width', d => Math.max(1, d.width))
        .attr('opacity', d =>
          selectedChain ?
            (d.source.name === selectedChain || d.target.name === selectedChain ? 0.8 : 0.2) :
            0.6
        )
        .style('transition', 'opacity 0.3s ease, stroke-width 0.3s ease')
        .style('cursor', 'pointer');

      // Add interaction to links
      linkPaths
        .on('mouseover', function (event, d) {
          // Highlight the link
          d3.select(this)
            .attr('stroke-opacity', 0.8)
            .attr('stroke-width', d => Math.max(1, d.width + 2));

          // Set hovered link for tooltip
          setHoveredLink(d);
          setTooltipPosition({ x: event.pageX, y: event.pageY });

          // CRITICAL: Force all node labels to have the correct theme color IMMEDIATELY
          const textColor = theme === 'dark' ? '#ffffff' : '#000000';
          document.querySelectorAll('.node-label').forEach(el => {
            el.setAttribute('fill', textColor);
          });

          // Also apply after a delay to catch any late renders
          setTimeout(() => {
            document.querySelectorAll('.node-label').forEach(el => {
              el.setAttribute('fill', textColor);
            });
          }, 50);
        })
        .on('mousemove', function (event) {
          setTooltipPosition({ x: event.pageX, y: event.pageY });
        })
        .on('mouseout', function () {
          // Reset link style
          d3.select(this)
            .attr('stroke-opacity', 0.4)
            .attr('stroke-width', d => Math.max(1, d.width));

          setHoveredLink(null);

          // CRITICAL: Force all node labels to have the correct theme color IMMEDIATELY
          const textColor = theme === 'dark' ? '#ffffff' : '#000000';
          document.querySelectorAll('.node-label').forEach(el => {
            el.setAttribute('fill', textColor);
          });

          // Also apply after a delay to catch any late renders
          setTimeout(() => {
            document.querySelectorAll('.node-label').forEach(el => {
              el.setAttribute('fill', textColor);
            });
          }, 50);
        });

      // Draw the nodes
      const nodeGroup = svg.append('g')
        .attr('class', 'nodes');

      const nodes_g = nodeGroup.selectAll('g')
        .data(sankeyData.nodes)
        .enter()
        .append('g')
        .attr('class', 'node-group')
        .attr('transform', d => `translate(${d.x0},${d.y0})`)
        .style('cursor', 'pointer')
        .on('click', function (event, d) {
          handleNodeClick(d);
          event.stopPropagation();
        })
        .on('mouseover', function (event, d) {
          setHoveredNode(d);
          setTooltipPosition({ x: event.pageX, y: event.pageY });

          // CRITICAL: Force all node labels to have the correct theme color IMMEDIATELY
          const textColor = theme === 'dark' ? '#ffffff' : '#000000';
          document.querySelectorAll('.node-label').forEach(el => {
            el.setAttribute('fill', textColor);
          });

          // Also apply after a delay to catch any late renders
          setTimeout(() => {
            document.querySelectorAll('.node-label').forEach(el => {
              el.setAttribute('fill', textColor);
            });
          }, 50);
        })
        .on('mousemove', function (event) {
          setTooltipPosition({ x: event.pageX, y: event.pageY });
        })
        .on('mouseout', function () {
          setHoveredNode(null);

          // CRITICAL: Force all node labels to have the correct theme color IMMEDIATELY
          const textColor = theme === 'dark' ? '#ffffff' : '#000000';
          document.querySelectorAll('.node-label').forEach(el => {
            el.setAttribute('fill', textColor);
          });

          // Also apply after a delay to catch any late renders
          setTimeout(() => {
            document.querySelectorAll('.node-label').forEach(el => {
              el.setAttribute('fill', textColor);
            });
          }, 50);
        });

      // Add node rectangles with a gradient fill
      nodes_g.each(function (d) {
        const node = d3.select(this);
        const gradientId = `node-gradient-${d.index}`;

        // Create gradient
        const gradient = defs.append('linearGradient')
          .attr('id', gradientId)
          .attr('x1', '0%')
          .attr('y1', '0%')
          .attr('x2', '100%')
          .attr('y2', '100%');

        gradient.append('stop')
          .attr('offset', '0%')
          .attr('stop-color', d3.color(d.color)?.brighter(0.5)?.toString() || d.color);

        gradient.append('stop')
          .attr('offset', '100%')
          .attr('stop-color', d3.color(d.color)?.darker(0.3)?.toString() || d.color);

        // Add rectangle with gradient
        node.append('rect')
          .attr('height', d.y1 - d.y0)
          .attr('width', d.x1 - d.x0)
          .attr('fill', `url(#${gradientId})`)
          .attr('stroke', d3.color(d.color)?.darker(0.5)?.toString() || '#000')
          .attr('stroke-width', 1)
          .attr('rx', 4)
          .attr('ry', 4)
          .attr('opacity', selectedChain ? (d.name === selectedChain ? 1 : 0.7) : 0.9)
          .style('transition', 'opacity 0.3s ease');

        // Add a subtle inner shadow/highlight
        node.append('rect')
          .attr('height', d.y1 - d.y0)
          .attr('width', d.x1 - d.x0)
          .attr('fill', 'none')
          .attr('stroke', theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)')
          .attr('stroke-width', 1)
          .attr('rx', 4)
          .attr('ry', 4)
          .attr('opacity', 0.5);

        // Add a glow effect for selected nodes
        if (selectedChain === d.name) {
          const glowId = `glow-${d.index}`;

          defs.append('filter')
            .attr('id', glowId)
            .attr('x', '-20%')
            .attr('y', '-20%')
            .attr('width', '140%')
            .attr('height', '140%')
            .append('feGaussianBlur')
            .attr('stdDeviation', '3')
            .attr('result', 'blur');

          node.append('rect')
            .attr('height', d.y1 - d.y0)
            .attr('width', d.x1 - d.x0)
            .attr('fill', 'none')
            .attr('stroke', d.color)
            .attr('stroke-width', 2)
            .attr('rx', 4)
            .attr('ry', 4)
            .attr('filter', `url(#${glowId})`)
            .attr('opacity', 0.7);
        }
      });

      // Add labels for the nodes
      nodes_g.append('text')
        .attr('x', d => d.x0 < width / 2 ? d.x1 - d.x0 + 6 : -6)
        .attr('y', d => (d.y1 - d.y0) / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', d => d.x0 < width / 2 ? 'start' : 'end')
        .attr('class', 'node-label')  // Add a class to help with direct updates
        .text(d => d.displayName)
        .attr('fill', theme === 'dark' ? '#ffffff' : '#000000')
        .attr('font-weight', 'bold')
        .attr('font-size', '12px')
        .attr('pointer-events', 'none');

      // Add value labels
      nodes_g.append('text')
        .attr('x', d => d.x0 < width / 2 ? d.x1 - d.x0 + 6 : -6)
        .attr('y', d => (d.y1 - d.y0) / 2 + 16)
        .attr('dy', '0.35em')
        .attr('class', 'value-label')  // Add a class to help with direct updates
        .attr('text-anchor', d => d.x0 < width / 2 ? 'start' : 'end')
        .text(d => `${d.value.toLocaleString()} msgs`)
        .attr('fill', theme === 'dark' ? 'rgba(226, 232, 240, 0.7)' : 'rgba(30, 41, 59, 0.7)')
        .attr('font-size', '10px')
        .attr('pointer-events', 'none');

      // Add a title and legend
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', -5)
        .attr('class', 'diagram-title')  // Add a class to help with direct updates
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .attr('fill', theme === 'dark' ? 'rgba(226, 232, 240, 0.7)' : 'rgba(30, 41, 59, 0.7)')
        .text(`Total: ${data.metadata.totalMessages.toLocaleString()} messages`);

      // Add a reset button if a chain is selected
      if (selectedChain) {
        const resetButton = svg.append('g')
          .attr('class', 'reset-button')
          .attr('transform', `translate(${width - 80}, ${height - 30})`)
          .style('cursor', 'pointer')
          .on('click', () => setSelectedChain(null));

        resetButton.append('rect')
          .attr('width', 80)
          .attr('height', 24)
          .attr('rx', 12)
          .attr('ry', 12)
          .attr('fill', theme === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(226, 232, 240, 0.8)')
          .attr('stroke', theme === 'dark' ? 'rgba(226, 232, 240, 0.2)' : 'rgba(30, 41, 59, 0.2)')
          .attr('stroke-width', 1);

        resetButton.append('text')
          .attr('x', 40)
          .attr('y', 12)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('font-size', '10px')
          .attr('fill', theme === 'dark' ? 'rgba(226, 232, 240, 0.9)' : 'rgba(30, 41, 59, 0.9)')
          .text('Reset Filter');
      }

      // Add click handler to reset selection when clicking on the background
      svg.on('click', () => {
        if (selectedChain) {
          setSelectedChain(null);
        }
      });

    } catch (err) {
      console.error('Error rendering Sankey diagram:', err);

      // Use consistent colors for error messages too
      const errorTextColor = theme === 'dark' ? '#e2e8f0' : '#1e293b';

      // Display error message in the SVG
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', errorTextColor)
        .text('Error rendering diagram. Please try again.');

      // Add a more detailed error message
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2 + 30)
        .attr('text-anchor', 'middle')
        .attr('fill', errorTextColor)
        .attr('font-size', '12px')
        .text(err instanceof Error ? err.message : 'Unknown error');
    }

  }, [data, getChainColor, theme, selectedChain, navigate, handleNodeClick]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (data) {
        // Redraw the diagram on resize
        const timer = setTimeout(() => {
          if (svgRef.current && containerRef.current) {
            d3.select(svgRef.current).selectAll('*').remove();
            // This will trigger the useEffect that draws the diagram
            setData({ ...data });
          }
        }, 100);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [data]);

  // Format large numbers with appropriate suffixes
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    } else {
      return num.toString();
    }
  };

  // Calculate time since last update
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
            <div className="h-[400px] flex flex-col items-center justify-center">
              <RefreshCw className="h-12 w-12 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">Loading message flow data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
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
            <div className="h-[400px] flex flex-col items-center justify-center">
              <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
              <p className="text-muted-foreground text-center mb-4">
                No Teleporter message data available
              </p>
              <button
                onClick={fetchData}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
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
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-foreground">
                  Avalanche Teleporter Messages
                </h3>
              </div>

              <div className="flex items-center gap-3">
                {/* Toggle switch for daily/weekly data */}
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

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4 flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-destructive">
                    {error}
                  </p>
                </div>
              </div>
            )}

            <div
              ref={containerRef}
              className="relative bg-gradient-to-br from-muted/50 to-muted rounded-lg border border-border h-[400px] overflow-hidden"
            >
              {/* Force remount of SVG on theme change by using theme and timestamp in the key */}
              <svg
                ref={svgRef}
                className="w-full h-full"
                key={`sankey-${theme}-${Date.now().toString()}`}
              ></svg>

              {/* Tooltip for links */}
              {hoveredLink && (
                <div
                  className="absolute z-10 bg-popover text-popover-foreground p-3 rounded-lg shadow-lg border border-border text-sm pointer-events-none"
                  style={{
                    left: `${tooltipPosition.x + 10}px`,
                    top: `${tooltipPosition.y - 80}px`,
                    transform: 'translate(-50%, -100%)'
                  }}
                  onMouseEnter={() => forceTextColors()}
                  onMouseLeave={() => forceTextColors()}
                >
                  <div className="font-medium text-popover-foreground mb-1">
                    {hoveredLink.source.displayName} → {hoveredLink.target.displayName}
                  </div>
                  <div className="text-muted-foreground">
                    Messages: <span className="font-semibold">{hoveredLink.value.toLocaleString()}</span>
                  </div>
                  <div className="text-muted-foreground">
                    {((hoveredLink.value / data.metadata.totalMessages) * 100).toFixed(1)}% of total
                  </div>
                </div>
              )}

              {/* Tooltip for nodes */}
              {hoveredNode && !hoveredLink && (
                <div
                  className="absolute z-10 bg-popover text-popover-foreground p-3 rounded-lg shadow-lg border border-border text-sm pointer-events-none"
                  style={{
                    left: `${tooltipPosition.x + 10}px`,
                    top: `${tooltipPosition.y - 80}px`,
                    transform: 'translate(-50%, -100%)'
                  }}
                  onMouseEnter={() => forceTextColors()}
                  onMouseLeave={() => forceTextColors()}
                >
                  <div className="font-medium text-popover-foreground mb-1">
                    {hoveredNode.displayName}
                  </div>
                  <div className="text-muted-foreground">
                    Total messages: <span className="font-semibold">{hoveredNode.value?.toLocaleString?.() || 0}</span>
                  </div>
                  <div className="text-muted-foreground">
                    {((hoveredNode.value || 0) / data.metadata.totalMessages * 100).toFixed(1)}% of total
                  </div>
                  <div className="text-xs text-primary mt-1">
                    Click to {findChainId(hoveredNode.originalName || '') ? 'view chain details' : selectedChain === hoveredNode.name ? 'reset filter' : 'filter connections'}
                  </div>
                </div>
              )}
            </div>

            {/* Stats card at the bottom */}
            <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              {/* Message stats card */}
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
                    <Activity className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-primary-foreground/70 font-medium">Timeframe</span>
                    <span className="text-sm font-bold text-primary-foreground">{timeframe === 'daily' ? 'Daily' : 'Weekly'}</span>
                  </div>
                </div>
              </div>

              {/* Last updated badge */}
              <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-full shadow-sm border border-border">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-foreground">Last updated:</span>
                    <span className="text-xs font-bold text-foreground">
                      {format(new Date(data.metadata.updatedAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {getTimeSinceUpdate()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}