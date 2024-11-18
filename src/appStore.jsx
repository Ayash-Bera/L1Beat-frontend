import { create } from 'zustand'

const calculateScore = (validators, tvl, tps) => {
  // First, strictly validate input and active validators
  if (!Array.isArray(validators)) {
    console.log('Invalid validators array');
    return 0;
  }

  // Filter for ACTIVE validators (with stake > 0 AND status === 'active')
  const activeValidators = validators.filter(v => {
    const stake = parseFloat(v.amountStaked);
    const isActive = v.validationStatus === 'active';
    return !isNaN(stake) && stake > 0 && isActive;  // Added active status check
  });

  // Log validation details
  console.log('Validation Details:', {
    chainName: validators[0]?.chainName || 'Unknown',
    totalValidators: validators.length,
    activeValidators: activeValidators.length,
    validatorStatuses: validators.map(v => v.validationStatus)
  });

  // If no active validators, return 0
  if (activeValidators.length === 0) {
    console.log('No active validators found');
    return 0;
  }

  let score = 0;

  // Has active validators: +20 points
  score += 20;

  // More than 5 active validators: +20 points
  if (activeValidators.length > 5) {
    score += 20;
  }

  // Exactly 10 active validators: set score to 85
  if (activeValidators.length === 10) {
    score = 85;
  }

  // More than 10 active validators: additional points
  if (activeValidators.length > 10) {
    score = 85 + Math.min((activeValidators.length - 10) / 90 * 15, 15);
  }

  console.log('Final Scoring Details:', {
    chainName: validators[0]?.chainName || 'Unknown',
    activeValidators: activeValidators.length,
    score: score
  });

  return Math.min(Math.round(score), 100);
};

const useStore = create((set) => ({
  // TVL Data
  tvlData: [
    { date: '2024-03-01', tvl: 2500000000 },
    { date: '2024-03-02', tvl: 2720000000 },
    { date: '2024-03-03', tvl: 2850000000 },
    { date: '2024-03-04', tvl: 2650000000 },
    { date: '2024-03-05', tvl: 2900000000 },
    { date: '2024-03-06', tvl: 3100000000 },
    { date: '2024-03-07', tvl: 3250000000 },
  ],
  
  // TPS Data
  tpsData: [
    { name: '1m', tps: 15 },
    { name: '5m', tps: 18 },
    { name: '15m', tps: 22 },
    { name: '30m', tps: 20 },
    { name: '1h', tps: 25 },
    { name: '6h', tps: 30 },
    { name: '24h', tps: 28 },
  ],
  
  // Blockchain Data with detailed information
  blockchainData: [],

  // Historical Data
  historicalData: {
    validators: {
      "Dexalot": [
        { date: '2024-03-01', count: 850000 },
        { date: '2024-03-07', count: 874523 }
      ],
      "GUN": [
        { date: '2024-03-01', count: 1700 },
        { date: '2024-03-07', count: 1763 }
      ],
      "Avalanche": [
        { date: '2024-03-01', count: 1200000 },
        { date: '2024-03-07', count: 1250000 }
      ],
      "Ethereum": [
        { date: '2024-03-01', count: 925000 },
        { date: '2024-03-07', count: 945000 }
      ],
      "Solana": [
        { date: '2024-03-01', count: 2000 },
        { date: '2024-03-07', count: 2100 }
      ]
    },
    tps: {
      "Dexalot": [
        { date: '2024-03-01', value: 10.2 },
        { date: '2024-03-07', value: 12.5 }
      ],
      "GUN": [
        { date: '2024-03-01', value: 2500 },
        { date: '2024-03-07', value: 2843 }
      ],
      "Avalanche": [
        { date: '2024-03-01', value: 4200 },
        { date: '2024-03-07', value: 4500 }
      ],
      "Ethereum": [
        { date: '2024-03-01', value: 28 },
        { date: '2024-03-07', value: 30 }
      ],
      "Solana": [
        { date: '2024-03-01', value: 62000 },
        { date: '2024-03-07', value: 65000 }
      ]
    }
  },

  // Network Status

  // Actions
  updateTVLData: (newData) => set({ tvlData: newData }),
  updateTPSData: (newData) => set({ tpsData: newData }),
  updateBlockchainData: (newData) => set({ blockchainData: newData }),
  updateHistoricalData: (newData) => set((state) => ({
    historicalData: { ...state.historicalData, ...newData }
  })),
  updateNetworkStatus: (chainName, status) => set((state) => ({
    networkStatus: {
      ...state.networkStatus,
      [chainName]: { ...state.networkStatus[chainName], ...status }
    }
  })),
  fetchBlockchainData: async () => {
    try {
      const response = await fetch('http://localhost:5001/api/chains');
      const data = await response.json();
      
      const transformedData = data.map(chain => ({
        chainId: chain.chainId,
        name: chain.chainName,
        validators: chain.validators || [],
        validatorCount: chain.validators?.length || 0,
        tvl: 50000000000,
        tps: 1000,
        score: calculateScore(chain.validators || [], 50000000000, 1000),
        networkStats: {
          blockTime: "2s",
          finality: "2s",
          networkUsage: "65%",
          stakeRequirement: "2,000 AVAX",
          uptime: "99.9%"
        },
        economics: {
          marketCap: "500M",
          circulatingSupply: chain.networkToken?.description || "N/A",
          totalSupply: "250M",
          stakingAPR: "8.5%"
        },
        stakeDistribution: [
          { name: "Top 1-10", value: 35, fill: "#8884d8" },
          { name: "Top 11-50", value: 30, fill: "#82ca9d" },
          { name: "Top 51-100", value: 20, fill: "#ffc658" },
          { name: "Others", value: 15, fill: "#ff8042" }
        ],
        description: chain.description,
        explorerUrl: chain.explorerUrl,
        rpcUrl: chain.rpcUrl,
        networkToken: chain.networkToken,
        chainLogoUri: chain.chainLogoUri
      }));

      set({ blockchainData: transformedData });
    } catch (error) {
      console.error('Error fetching blockchain data:', error);
    }
  },
}))

export default useStore
