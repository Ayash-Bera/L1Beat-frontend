import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { format, parseISO } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { TeleporterDailyData, TimeframeOption } from '../types';
import { getTeleporterDailyHistory } from '../api';
import { useTheme } from '../hooks/useTheme';
import { useMediaQuery, breakpoints } from '../hooks/useMediaQuery';
import { AlertTriangle, MessageSquare, RefreshCw } from 'lucide-react';
import { GlowingEffect } from './ui/glowing-effect';
import { cn } from '../lib/utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function TeleporterDailyChart() {
  const { theme } = useTheme();
  const [dailyData, setDailyData] = useState<TeleporterDailyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [timeframe, setTimeframe] = useState<TimeframeOption>(7);

  const isDark = theme === 'dark';
  const isMobile = useMediaQuery(breakpoints.sm);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      setRetrying(true);

      const data = await getTeleporterDailyHistory(timeframe);

      if (data.length > 0) {
        setDailyData(data.sort((a, b) => a.dateString.localeCompare(b.dateString)));
      } else {
        throw new Error('No daily message data available');
      }
    } catch (err) {
      console.error('Failed to fetch daily message data:', err);
      setError('Failed to load daily message data');
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      if (!mounted) return;
      await fetchData();
    };

    loadData();
    const interval = setInterval(loadData, 15 * 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [timeframe]);

  if (loading) {
    return (
      <div className="relative h-full">
        <div className="relative h-full rounded-xl border-[0.5px] border-white/10 dark:border-white/5 p-1">
          <GlowingEffect
            spread={25}
            glow={true}
            disabled={false}
            proximity={60}
            inactiveZone={0.1}
            borderWidth={2}
            movementDuration={1.2}
          />
          <div className={cn(
            "relative h-full overflow-hidden rounded-lg",
            "bg-white/5 dark:bg-white/[0.02] backdrop-blur-xl",
            "border border-white/10 dark:border-white/5",
            "shadow-2xl shadow-black/10 dark:shadow-black/20"
          )}>
            <div className="h-[300px] sm:h-[400px] flex flex-col items-center justify-center">
              <RefreshCw className="h-12 w-12 text-white/60 animate-spin mb-4" />
              <p className="text-white/60">Loading daily message data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !dailyData.length) {
    return (
      <div className="relative h-full">
        <div className="relative h-full rounded-xl border-[0.5px] border-white/10 dark:border-white/5 p-1">
          <GlowingEffect
            spread={25}
            glow={true}
            disabled={false}
            proximity={60}
            inactiveZone={0.1}
            borderWidth={2}
            movementDuration={1.2}
          />
          <div className={cn(
            "relative h-full overflow-hidden rounded-lg",
            "bg-white/5 dark:bg-white/[0.02] backdrop-blur-xl",
            "border border-white/10 dark:border-white/5",
            "shadow-2xl shadow-black/10 dark:shadow-black/20"
          )}>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-6">
                <MessageSquare className="w-5 h-5 text-white/80" />
                <h3 className="text-lg font-semibold text-white">Daily Message Volume</h3>
              </div>
              <div className="h-[300px] sm:h-[400px] flex flex-col items-center justify-center">
                <AlertTriangle className="h-12 w-12 text-amber-400 mb-4" />
                <p className="text-white/60 text-center mb-4">
                  {error || 'No daily message data available'}
                </p>
                <button
                  onClick={fetchData}
                  disabled={retrying}
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white backdrop-blur-sm border border-white/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {retrying ? (
                    <>
                      <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="-ml-1 mr-2 h-4 w-4" />
                      Retry
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const data = {
    labels: dailyData.map(item => {
      const [year, month, day] = item.dateString.split('-');
      return format(new Date(parseInt(year), parseInt(month) - 1, parseInt(day)), isMobile ? 'd MMM' : 'MMM d');
    }),
    datasets: [
      {
        label: 'Total Daily Messages',
        data: dailyData.map(item => item.totalMessages),
        fill: true,
        borderColor: 'rgba(99, 102, 241, 0.8)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: isMobile ? 2 : 4,
        pointHoverRadius: isMobile ? 4 : 6,
        pointBackgroundColor: 'rgba(255, 255, 255, 0.8)',
        pointBorderColor: 'rgba(99, 102, 241, 0.8)',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        padding: isMobile ? 8 : 12,
        boxPadding: 4,
        titleFont: {
          size: isMobile ? 12 : 14,
        },
        bodyFont: {
          size: isMobile ? 11 : 13,
        },
        callbacks: {
          label: (context: any) => {
            const dataPoint = dailyData[context.dataIndex];
            return [
              `Messages: ${context.parsed.y.toLocaleString()}`,
              `Window: ${dataPoint.timeWindow}h`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
          font: {
            size: isMobile ? 10 : 11,
          },
          maxRotation: isMobile ? 45 : 0,
          autoSkip: true,
          autoSkipPadding: isMobile ? 20 : 30,
          maxTicksLimit: isMobile ? 7 : undefined,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
          font: {
            size: isMobile ? 10 : 11,
          },
          callback: (value: any) => {
            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
            if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
            return value;
          },
          maxTicksLimit: isMobile ? 5 : 8,
        },
      },
    },
  };

  const latestData = dailyData[dailyData.length - 1];

  return (
    <div className="relative h-full">
      {/* Outer container with glowing effect */}
      <div className="relative h-full rounded-xl border-[0.5px] border-white/10 dark:border-white/5 p-1">
        <GlowingEffect
          spread={25}
          glow={true}
          disabled={false}
          proximity={60}
          inactiveZone={0.1}
          borderWidth={2}
          movementDuration={1.2}
        />

        {/* Inner content container */}
        <div className={cn(
          "relative h-full overflow-hidden rounded-lg",
          "bg-white/5 dark:bg-white/[0.02] backdrop-blur-xl",
          "border border-white/10 dark:border-white/5",
          "shadow-2xl shadow-black/10 dark:shadow-black/20"
        )}>
          <div className="p-4">
            <div className="flex flex-col gap-3 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-white/80" />
                    <h3 className="text-lg font-semibold text-white">Daily Message Volume</h3>
                  </div>
                  <p className="text-sm text-white/60 mt-1">
                    Last updated: {format(parseISO(latestData.date), 'MMM d, h:mm a')}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="bg-white/10 backdrop-blur-sm rounded-full p-1 flex border border-white/20">
                    <button
                      onClick={() => setTimeframe(7)}
                      className={`flex-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${timeframe === 7
                        ? 'bg-white/20 text-white border border-white/30'
                        : 'text-white/60 hover:bg-white/10 hover:text-white/80'
                        }`}
                    >
                      7D
                    </button>
                    <button
                      onClick={() => setTimeframe(14)}
                      className={`flex-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${timeframe === 14
                        ? 'bg-white/20 text-white border border-white/30'
                        : 'text-white/60 hover:bg-white/10 hover:text-white/80'
                        }`}
                    >
                      14D
                    </button>
                    <button
                      onClick={() => setTimeframe(30)}
                      className={`flex-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${timeframe === 30
                        ? 'bg-white/20 text-white border border-white/30'
                        : 'text-white/60 hover:bg-white/10 hover:text-white/80'
                        }`}
                    >
                      30D
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <p className="text-2xl font-bold text-white">
                  {latestData.totalMessages.toLocaleString()}
                </p>
                <p className="text-sm text-white/60">
                  messages in the last {latestData.timeWindow}h
                </p>
              </div>
            </div>

            <div className="h-[300px] sm:h-[400px] bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-3">
              <Line data={data} options={options} />
            </div>
          </div>

          {/* Subtle gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-black/10 pointer-events-none rounded-lg"></div>
        </div>
      </div>
    </div>
  );
}