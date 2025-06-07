import { Chain } from '../types';
import { Activity, Server, Clock, Zap } from 'lucide-react';
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
    if (tps >= 1) return 'text-emerald-400';
    if (tps >= 0.1) return 'text-amber-400';
    return 'text-red-400';
  };

  const getTPSGlow = (tpsStr: string) => {
    if (tpsStr === 'N/A') return '';
    const tps = Number(tpsStr);
    if (tps >= 1) return 'shadow-emerald-500/20';
    if (tps >= 0.1) return 'shadow-amber-500/20';
    return 'shadow-red-500/20';
  };

  const tpsValue = formatTPS(chain.tps);
  const tpsColor = getTPSColor(tpsValue);
  const tpsGlow = getTPSGlow(tpsValue);

  return (
    <div className="relative h-full min-h-[180px]">
      {/* Outer container with minimal glowing effect */}
      <div className="relative h-full rounded-xl border-[0.5px] border-white/10 dark:border-white/5 p-1">
        <GlowingEffect
          spread={25}
          glow={true}
          disabled={false}
          proximity={60}
          inactiveZone={0.1}
          borderWidth={1}
          movementDuration={1.2}
        />

        {/* Glassmorphic inner card */}
        <div
          className={cn(
            "relative h-full cursor-pointer overflow-hidden rounded-lg",
            "bg-white/5 dark:bg-white/[0.02] backdrop-blur-xl",
            "border border-white/10 dark:border-white/5",
            "shadow-2xl shadow-black/10 dark:shadow-black/20",
            "transition-all duration-300 hover:shadow-xl hover:bg-white/10 dark:hover:bg-white/[0.05]",
            "transform hover:-translate-y-0.5 hover:scale-[1.02]"
          )}
          onClick={() => navigate(`/chain/${chain.chainId}`)}
        >
          {/* Content */}
          <div className="p-4">
            {/* Header with logo and main info */}
            <div className="flex items-start gap-3 mb-4">
              {/* Logo */}
              <div className="flex-shrink-0">
                {chain.chainLogoUri ? (
                  <img
                    src={chain.chainLogoUri}
                    alt={`${chain.chainName} logo`}
                    className="w-10 h-10 rounded-lg shadow-md ring-1 ring-white/20"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                    <Server className="w-5 h-5 text-blue-400" />
                  </div>
                )}
              </div>

              {/* Chain info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-white truncate mb-0.5">
                  {chain.chainName}
                </h3>
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <span>ID: {chain.chainId}</span>
                  {chain.validators?.length > 0 && (
                    <>
                      <span>•</span>
                      <span>{chain.validators.length} validators</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex items-center justify-between mb-3">
              {/* TPS */}
              <div className="flex items-center gap-2">
                <div className={cn(
                  "p-1.5 rounded-md bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10",
                  tpsGlow && `shadow-lg ${tpsGlow}`
                )}>
                  <Activity className={cn("w-3.5 h-3.5", tpsColor)} />
                </div>
                <div>
                  <div className="text-xs text-white/60 leading-none">TPS</div>
                  <div className={cn("text-sm font-bold leading-none mt-0.5", tpsColor)}>
                    {tpsValue}
                  </div>
                </div>
              </div>

              {/* Validators */}
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm border border-blue-400/20 shadow-lg shadow-blue-500/10">
                  <Server className="w-3.5 h-3.5 text-blue-300" />
                </div>
                <div>
                  <div className="text-xs text-white/60 leading-none">Validators</div>
                  <div className="text-sm font-bold text-blue-300 leading-none mt-0.5">
                    {chain.validators?.length || 0}
                  </div>
                </div>
              </div>

              {/* Network status indicator */}
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50 animate-pulse"></div>
                <span className="text-xs text-emerald-300 font-medium">Live</span>
              </div>
            </div>

            {/* Network token (if available) */}
            {chain.networkToken && (
              <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-gradient-to-r from-white/5 to-white/[0.02] border border-white/10 mb-3">
                {chain.networkToken.logoUri && (
                  <img
                    src={chain.networkToken.logoUri}
                    alt={`${chain.networkToken.name} logo`}
                    className="w-4 h-4 rounded-full ring-1 ring-white/20"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-white/80 truncate">
                    {chain.networkToken.name}
                  </span>
                  <span className="text-xs text-white/50 ml-1">
                    ({chain.networkToken.symbol})
                  </span>
                </div>
              </div>
            )}

            {/* Footer with last update */}
            {chain.tps?.timestamp && (
              <div className="flex items-center justify-between text-xs text-white/40">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  <span>Updated {format(new Date(chain.tps.timestamp * 1000), 'MMM d, HH:mm')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  <span>Active</span>
                </div>
              </div>
            )}
          </div>

          {/* Subtle gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-black/10 pointer-events-none rounded-lg"></div>

          {/* Hover glow effect */}
          <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-lg bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none"></div>
        </div>
      </div>
    </div>
  );
}