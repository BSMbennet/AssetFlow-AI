'use client';

import { useState } from 'react';
import {
  LayoutDashboard,
  Building,
  Coins,
  Users,
  Shield,
  BarChart3,
  Settings,
  TrendingUp,
  Wallet,
  Bell,
  Search,
} from 'lucide-react';
import { StatsCards } from './StatsCards';
import { ActivityFeed } from './ActivityFeed';
import { AssetChart } from './AssetChart';
import { QuickActions } from './QuickActions';

const navigation = [
  { icon: LayoutDashboard, label: 'Dashboard', id: 'overview' },
  { icon: Building, label: 'Assets', id: 'assets' },
  { icon: Coins, label: 'Tokenization', id: 'tokens' },
  { icon: Users, label: 'Investors', id: 'investors' },
  { icon: Shield, label: 'Compliance', id: 'compliance' },
  { icon: BarChart3, label: 'Analytics', id: 'analytics' },
  { icon: Settings, label: 'Settings', id: 'settings' },
];

export function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-primary">AssetFlow AI</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Enterprise RWA Platform</p>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors ${
                activeTab === item.id
                  ? 'bg-primary text-white'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">JD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">John Doe</p>
              <p className="text-xs text-gray-500 truncate">Platform Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
          <div className="flex justify-between items-center px-6 py-4">
            <div className="flex items-center flex-1">
              <div className="relative w-96">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search assets, investors, transactions..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition">
                + New Asset
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <StatsCards />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <AssetChart />
                </div>
                <div>
                  <QuickActions />
                </div>
              </div>
              <ActivityFeed />
            </div>
          )}
          {activeTab === 'assets' && (
            <div>Assets Content</div>
          )}
          {activeTab === 'tokens' && (
            <div>Tokenization Content</div>
          )}
          {activeTab === 'investors' && (
            <div>Investors Content</div>
          )}
          {activeTab === 'compliance' && (
            <div>Compliance Content</div>
          )}
          {activeTab === 'analytics' && (
            <div>Analytics Content</div>
          )}
          {activeTab === 'settings' && (
            <div>Settings Content</div>
          )}
        </div>
      </div>
    </div>
  );
}
