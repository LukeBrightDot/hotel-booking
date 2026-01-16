'use client';

import { useEffect, useState } from 'react';

interface SearchStats {
  totalSearches: number;
  successfulSearches: number;
  failedSearches: number;
  successRate: number;
  topDestinations: Array<{
    destination: string;
    count: number;
  }>;
}

interface LuxuryStats {
  totalHotels: number;
  totalLuxuryHotels: number;
  luxuryAppearanceRate: number;
  averageLuxuryPerSearch: number;
}

interface AnalyticsData {
  success: boolean;
  period: string;
  search: SearchStats;
  luxury: LuxuryStats;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchAnalytics();
  }, [days]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/search-stats?days=${days}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-semibold mb-2">Error Loading Analytics</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Search Analytics</h1>
          <p className="text-gray-600">{data.period}</p>

          {/* Period Selector */}
          <div className="mt-4 flex gap-2">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  days === d
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Last {d} days
              </button>
            ))}
          </div>
        </div>

        {/* Search Statistics */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Search Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              label="Total Searches"
              value={data.search.totalSearches}
              icon="🔍"
            />
            <StatCard
              label="Successful"
              value={data.search.successfulSearches}
              icon="✅"
              color="green"
            />
            <StatCard
              label="Failed"
              value={data.search.failedSearches}
              icon="❌"
              color="red"
            />
            <StatCard
              label="Success Rate"
              value={`${data.search.successRate}%`}
              icon="📊"
              color="blue"
            />
          </div>
        </div>

        {/* Luxury Statistics */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Luxury Hotel Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              label="Total Hotels"
              value={data.luxury.totalHotels}
              icon="🏨"
            />
            <StatCard
              label="Luxury Hotels"
              value={data.luxury.totalLuxuryHotels}
              icon="✨"
              color="purple"
            />
            <StatCard
              label="Luxury Rate"
              value={`${data.luxury.luxuryAppearanceRate.toFixed(1)}%`}
              icon="💎"
              color="purple"
            />
            <StatCard
              label="Avg per Search"
              value={data.luxury.averageLuxuryPerSearch.toFixed(1)}
              icon="📈"
              color="blue"
            />
          </div>
        </div>

        {/* Top Destinations */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Destinations</h2>
          <div className="space-y-3">
            {data.search.topDestinations.map((dest, index) => (
              <div key={dest.destination} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-gray-400 w-8">#{index + 1}</span>
                  <span className="text-gray-900 font-medium">{dest.destination}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">
                    {dest.count} searches
                  </div>
                </div>
              </div>
            ))}
            {data.search.topDestinations.length === 0 && (
              <p className="text-gray-500 text-center py-8">No searches yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  color?: 'blue' | 'green' | 'red' | 'purple';
}

function StatCard({ label, value, icon, color = 'gray' }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    gray: 'bg-gray-50 text-gray-600',
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className={`text-xs font-medium px-2 py-1 rounded ${colorClasses[color]}`}>
          {label}
        </span>
      </div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
    </div>
  );
}
