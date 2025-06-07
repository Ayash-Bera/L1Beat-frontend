import { Chain } from '../types';
import { Activity, Server, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { GlowingEffect } from './ui/glowing-effect';
import { cn } from '../lib/utils';

interface ChainCardProps {
  chain: Chain;
}

export function ChainCard({ chain }: ChainCardProps) {
  const navigate = useNavigate();

  const formatTPS = (tps: Chain['tps']) => {
    if (!tps || typeof tps.value !== 'number') return 'N/A';
    return tps.value.toFixed(2);
  };

  const getTPSColor = (tpsStr: string) => {
    if (tpsStr === 'N/A') return 'text-gray-400 dark:text-gray-500';
    const tps = Number(tpsStr);
    if (tps >= 1) return 'text-green-500 dark:text-green-400';
    if (tps >= 0.1) return 'text-yellow-500 dark:text-yellow-400';
    return 'text-red-500 dark:text-red-400';
  };

  const tpsValue = formatTPS(chain.tps);
  const tpsColor = getTPSColor(tpsValue);

  return (
    <div className="relative h-full min-h-[240px]">
      {/* Outer container with glowing effect */}
      <div className="relative h-full rounded-xl border-[0.75px] border-gray-200 dark:border-gray-700 p-2">
        <GlowingEffect
          spread={30}
          glow={true}
          disabled={false}
          proximity={80}
          inactiveZone={0.1}
          borderWidth={2}
          movementDuration={1.5}
        />

        {/* Inner card content */}
        <div
          className={cn(
            "relative h-full cursor-pointer overflow-hidden rounded-lg border-[0.75px] border-gray-100 dark:border-gray-800",
            "bg-white dark:bg-dark-800 shadow-sm dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)]",
            "transition-all duration-300 hover:shadow-lg dark:hover:shadow-[0px_0px_35px_0px_rgba(45,45,45,0.4)]",
            "transform hover:-translate-y-1"
          )}
          onClick={() => navigate(`/chain/${chain.chainId}`)}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {chain.chainLogoUri ? (
                  <img
                    src={chain.chainLogoUri}
                    alt={`${chain.chainName} logo`}
                    className="w-10 h-10 rounded-lg shadow-sm"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Server className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {chain.chainName}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">ID: {chain.chainId}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-dark-800/50">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className={`w-4 h-4 ${tpsColor}`} />
                  <span className="text-sm text-gray-600 dark:text-gray-300">TPS</span>
                </div>
                <span className={`text-lg font-bold ${tpsColor}`}>{tpsValue}</span>
              </div>

              <div className="p-3 rounded-lg bg-gray-50 dark:bg-dark-800/50">
                <div className="flex items-center gap-2 mb-1">
                  <Server className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Validators</span>
                </div>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {chain.validators?.length || 0}
                </span>
              </div>
            </div>

            {chain.networkToken && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/50">
                <div className="flex items-center gap-2">
                  {chain.networkToken.logoUri && (
                    <img
                      src={chain.networkToken.logoUri}
                      alt={`${chain.networkToken.name} logo`}
                      className="w-5 h-5 rounded-full"
                    />
                  )}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {chain.networkToken.name} ({chain.networkToken.symbol})
                  </span>
                </div>
              </div>
            )}

            {chain.tps?.timestamp && (
              <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <Clock className="w-3 h-3" />
                <span>Updated {format(new Date(chain.tps.timestamp * 1000), 'MMM d, h:mm a')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}