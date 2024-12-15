import { create } from 'zustand'

const useStore = create((set, get) => ({
  // TVL Data
  tvlData: [],
  
  // TPS Data
  tpsData: [],
  
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
      set({ isLoading: true });
      const API_URL = import.meta.env.VITE_API_URL;
      const timestamp = new Date().getTime();
      
      // Fetch chain data with cache busting
      const response = await fetch(`${API_URL}/api/chains?t=${timestamp}`);
      
      if (!response.ok) {
        const text = await response.text();
        console.error('Error response:', text);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Fetch TPS data for each chain
      const chainsWithTps = await Promise.all(
        data.map(async (chain) => {
          try {
            const tpsResponse = await fetch(`${API_URL}/api/chains/${chain.chainId}/tps/latest?t=${timestamp}`);
            const tpsData = await tpsResponse.json();
            
            // Match the exact API response structure
            if (tpsData.success && tpsData.data && typeof tpsData.data.value === 'number') {
              return {
                ...chain,
                tps: {
                  value: tpsData.data.value,
                  timestamp: tpsData.data.timestamp
                }
              };
            } else {
              if (import.meta.env.DEV) {
                console.log(`No valid TPS data for chain ${chain.chainId}:`, tpsData);
              }
              return {
                ...chain,
                tps: { value: null, timestamp: null }
              };
            }
          } catch (error) {
            console.error(`Failed to fetch TPS for chain ${chain.chainId}:`, error);
            return {
              ...chain,
              tps: { value: null, timestamp: null }
            };
          }
        })
      );
      
      if (import.meta.env.DEV) {
        console.log('Chains with TPS before transformation:', chainsWithTps);
      }

      const transformedData = chainsWithTps.map(chain => {
        if (import.meta.env.DEV) {
          console.log(`Processing chain ${chain.chainName}:`, {
            originalTps: chain.tps,
            chainId: chain.chainId
          });
        }
        
        return ({
          chainId: chain.chainId,
          name: chain.chainName,
          validators: chain.validators || [],
          validatorCount: chain.validators?.length || 0,
          tvl: 50000000000,
          tps: chain.tps,
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
        });
      });

      if (import.meta.env.DEV) {
        console.log('Transformed data:', transformedData);
      }

      set({ blockchainData: transformedData, isLoading: false });

      // Fetch network TPS data after blockchain data is loaded
      await get().fetchCombinedTpsData();

      return transformedData;
    } catch (error) {
      console.error('Error fetching blockchain data:', error);
      set({ blockchainData: [], isLoading: false });
      throw error;
    }
  },

  // Replace fetchCombinedTpsData with new simplified version
  fetchCombinedTpsData: async (days = 30) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL;
      const timestamp = new Date().getTime();
      const response = await fetch(`${API_URL}/api/tps/network/history?t=${timestamp}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseData = await response.json();
      
      if (!responseData.success) {
        throw new Error('Failed to fetch TPS data');
      }

      const sortedData = responseData.data.sort((a, b) => a.timestamp - b.timestamp);

      if (import.meta.env.DEV) {
        console.log('Network TPS data:', sortedData);
      }

      set({ tpsData: sortedData });
      return sortedData;
    } catch (error) {
      console.error('Error fetching network TPS data:', error);
      set({ tpsData: [] });
      throw error;
    }
  },

  // Add a new fetch function for TVL data
  fetchTVLData: async (days = 7) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL;
      const timestamp = new Date().getTime();
      const response = await fetch(`${API_URL}/api/tvl/history/?days=${days}&t=${timestamp}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseData = await response.json();
      
      if (!responseData.success || !Array.isArray(responseData.data)) {
        throw new Error('Invalid data format received from API');
      }

      // Sort data by date
      const sortedData = responseData.data.sort((a, b) => a.date - b.date);
      
      if (import.meta.env.DEV) {
        console.log('TVL data loaded:', sortedData);
      }

      set({ tvlData: sortedData });
      return sortedData;
    } catch (error) {
      console.error('Error fetching TVL data:', error);
      set({ tvlData: [] });
      throw error;
    }
  },
}))

export default useStore
