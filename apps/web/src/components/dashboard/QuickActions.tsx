'use client';

import { Plus, FileText, Users, Shield, BarChart3, RefreshCw } from 'lucide-react';

const actions = [
  { icon: Plus, label: 'New Asset', color: 'blue' },
  { icon: FileText, label: 'Upload Document', color: 'green' },
  { icon: Users, label: 'Add Investor', color: 'purple' },
  { icon: Shield, label: 'Run Compliance', color: 'orange' },
  { icon: BarChart3, label: 'Generate Report', color: 'pink' },
  { icon: RefreshCw, label: 'Sync Blockchain', color: 'teal' },
];

const colorClasses = {
  blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50',
  green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50',
  purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50',
  orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50',
  pink: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400 hover:bg-pink-200 dark:hover:bg-pink-900/50',
  teal: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400 hover:bg-teal-200 dark:hover:bg-teal-900/50',
};

export function QuickActions() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <button
            key={index}
            className={`flex flex-col items-center justify-center p-4 rounded-lg transition ${colorClasses[action.color as keyof typeof colorClasses]}`}
          >
            <action.icon className="w-6 h-6 mb-2" />
            <span className="text-xs font-medium">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
