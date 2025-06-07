import React, { useEffect, useState } from 'react';
import { getChains, getHealth } from '../api';
import { Chain, HealthStatus } from '../types';
import { ChainCard } from '../components/ChainCard';
import { StatusBar } from '../components/StatusBar';
import { TVLChart } from '../components/TVLChart';
import { TPSChart } from '../components/TPSChart';
import { TeleporterSankeyDiagram } from '../components/TeleporterSankeyDiagram';
import { NetworkTopologyGraph } from '../components/NetworkTopologyGraph';
import { Footer } from '../components/Footer';
import { LayoutGrid, Activity, Network } from 'lucide-react';
import { TeleporterDailyChart } from '../components/TeleporterDailyChart';

export function Dashboard() {
  const [chains, setChains] = useState<Chain[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      const [chainsData, healthData] = await Promise.all([
        getChains(),
        getHealth()
      ]);

      // Filter chains with at least 1 validator, but always include Avalanche chains
      const filteredChains = chainsData.filter(chain =>
        // Include chains with validators
        (chain.validators && chain.validators.length >= 1) ||
        // OR include any Avalanche chain regardless of validators
        chain.chainName.toLowerCase().includes('avalanche') ||
        chain.chainName.toLowerCase().includes('c-chain')
      );

      // Sort chains: C-Chain first, then alphabetically
      const sortedChains = filteredChains.sort((a, b) => {
        const isAvalancheA = a.chainName.toLowerCase().includes('c-chain');
        const isAvalancheB = b.chainName.toLowerCase().includes('c-chain');

        if (isAvalancheA && !isAvalancheB) return -1;
        if (!isAvalancheA && isAvalancheB) return 1;
        return a.chainName.localeCompare(b.chainName);
      });

      setChains(sortedChains);
      setHealth(healthData);
      setError(null);
    } catch (err) {
      setError('Unable to connect to the server. Please try again later.');
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  }

  useEffect(() => {
    fetchData();

    // Refresh health status every 5 minutes (increased from 1 minute)
    const healthInterval = setInterval(() => {
      getHealth().then(setHealth).catch(console.error);
    }, 5 * 60 * 1000);

    return () => clearInterval(healthInterval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900/80 backdrop-blur-sm rounded-lg shadow-lg p-6 max-w-md w-full border border-gray-200 dark:border-gray-800">
          <div className="text-center">
            <Activity className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Connection Error</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
            <button
              onClick={() => {
                setRetrying(true);
                fetchData();
              }}
              disabled={retrying}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {retrying ? (
                <>
                  <Activity className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Retrying...
                </>
              ) : (
                <>
                  <Activity className="-ml-1 mr-2 h-4 w-4" />
                  Retry Connection
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-black">
      <StatusBar health={health} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Interchain Messaging Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Network className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Avalanche Interchain Messaging
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <NetworkTopologyGraph />
            <TeleporterSankeyDiagram />
          </div>
        </div>

        {/* Daily Chart Section */}
        <div className="mb-8">
          <TeleporterDailyChart />
        </div>

        {/* Active Chains Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Active Chains
            </h2>
          </div>
        </div>

        {/* Chain Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chains.map(chain => (
            <ChainCard key={chain.chainId} chain={chain} />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}