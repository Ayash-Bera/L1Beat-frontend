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
        <div className="relative h-full rounded-xl border border-border p-2">
          <GlowingEffect
            spread={30}
            glow={true}
            disabled={false}
            proximity={80}
            inactiveZone={0.1}
            borderWidth={2}
            movementDuration={1.5}
          />
          <div className={cn(
            "relative h-full overflow-hidden rounded-lg border border-border",
            "bg-card text-card-foreground shadow-sm"
          )}>
            <div className="h-[300px] sm:h-[400px] flex flex-col items-center justify-center">
              <RefreshCw className="h-12 w-12 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">Loading daily message data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !dailyData.length) {
    return (
      <div className="relative h-full">
        <div className="relative h-full rounded-xl border border-border p-2">
          <GlowingEffect
            spread={30}
            glow={true}
            disabled={false}
            proximity={80}
            inactiveZone={0.1}
            borderWidth={2}
            movementDuration={1.5}
          />
          <div className={cn(
            "relative h-full overflow-hidden rounded-lg border border-border",
            "bg-card text-card-foreground shadow-sm"
          )}>
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-6">
                <MessageSquare className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Daily Message Volume</h3>
              </div>
              <div className="h-[300px] sm:h-[400px] flex flex-col items-center justify-center">
                <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
                <p className="text-muted-foreground text-center mb-4">
                  {error || 'No daily message data available'}
                </p>
                <button
                  onClick={fetchData}
                  disabled={retrying}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
        borderColor: isDark ? 'rgb(129, 140, 248)' : 'rgb(99, 102, 241)',
        backgroundColor: isDark ? 'rgba(129, 140, 248, 0.2)' : 'rgba(99, 102, 241, 0.1)',
        borderWidth: isDark ? 2 : 1.5,
        tension: 0.4,
        pointRadius: isMobile ? 2 : 4,
        pointHoverRadius: isMobile ? 4 : 6,
        pointBackgroundColor: isDark ? '#1e293b' : '#ffffff',
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
        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: isDark ? '#e2e8f0' : '#1e293b',
        bodyColor: isDark ? '#e2e8f0' : '#1e293b',
        borderColor: isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(0, 0, 0, 0.1)',
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
          color: isDark ? '#94a3b8' : '#64748b',
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
          color: isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
        },
        ticks: {
          color: isDark ? '#94a3b8' : '#64748b',
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
      <div className="relative h-full rounded-xl border border-border p-2">
        <GlowingEffect
          spread={30}
          glow={true}
          disabled={false}
          proximity={80}
          inactiveZone={0.1}
          borderWidth={2}
          movementDuration={1.5}
        />

        {/* Inner content container */}
        <div className={cn(
          "relative h-full overflow-hidden rounded-lg border border-border",
          "bg-card text-card-foreground shadow-sm"
        )}>
          <div className="p-4 sm:p-6">
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">Daily Message Volume</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Last updated: {format(parseISO(latestData.date), 'MMM d, h:mm a')}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="bg-muted rounded-full p-1 flex">
                    <button
                      onClick={() => setTimeframe(7)}
                      className={`flex-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${timeframe === 7
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        }`}
                    >
                      7D
                    </button>
                    <button
                      onClick={() => setTimeframe(14)}
                      className={`flex-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${timeframe === 14
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        }`}
                    >
                      14D
                    </button>
                    <button
                      onClick={() => setTimeframe(30)}
                      className={`flex-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${timeframe === 30
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        }`}
                    >
                      30D
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-2xl font-bold text-foreground">
                  {latestData.totalMessages.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  messages in the last {latestData.timeWindow}h
                </p>
              </div>
            </div>

            <div className="h-[300px] sm:h-[400px]">
              <Line data={data} options={options} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}