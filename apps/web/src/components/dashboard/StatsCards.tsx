'use client';

import { TrendingUp, TrendingDown, DollarSign, Users, Building, Coins } from 'lucide-react';

const stats = [
  {
    label: 'Total Assets',
    value: '1,247',
    change: '+12%',
    trend: 'up',
    icon: Building,
    color: 'blue',
  },
  {
    label: 'Total Value Locked',
    value: '$2.4B',
    change: '+8%',
    trend: 'up',
    icon: DollarSign,
    color: 'green',
  },
  {
    label: 'Active Investors',
    value: '3,892',
    change: '+23%',
    trend: 'up',
    icon: Users,
    color: 'purple',
  },
  {
    label: 'Tokens Issued',
    value: '45.6M',
    change: '-2%',
    trend: 'down',
    icon: Coins,
    color: 'orange',
  },
];

const colorClasses = {
  blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
};

export function StatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <div className={`p-3 rounded-lg ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <span
              className={`flex items-center text-sm font-medium ${
                stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {stat.trend === 'up' ? (
                <TrendingUp className="w-4 h-4 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-1" />
              )}
              {stat.change}
            </span>
          </div>
          <p className="mt-4 text-2xl font-bold">{stat.value}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
