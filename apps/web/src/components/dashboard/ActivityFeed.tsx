'use client';

import { Clock, ArrowUpRight, CheckCircle, AlertCircle } from 'lucide-react';

const activities = [
  {
    type: 'Asset Tokenized',
    description: 'Office Tower LA - 10,000 tokens issued',
    time: '5 minutes ago',
    status: 'completed',
    amount: '$25M',
  },
  {
    type: 'Trade Executed',
    description: 'Solar Farm TX - 2,500 tokens traded',
    time: '18 minutes ago',
    status: 'completed',
    amount: '$1.2M',
  },
  {
    type: 'Compliance Check',
    description: 'KYC verified for 3 new investors',
    time: '1 hour ago',
    status: 'pending',
    amount: '',
  },
  {
    type: 'Dividend Paid',
    description: 'Data Center NY - Distribution processed',
    time: '3 hours ago',
    status: 'completed',
    amount: '$125K',
  },
  {
    type: 'Risk Alert',
    description: 'Suspicious activity detected on wallet 0x1234...',
    time: '5 hours ago',
    status: 'alert',
    amount: '',
  },
];

const statusIcons = {
  completed: CheckCircle,
  pending: Clock,
  alert: AlertCircle,
};

const statusColors = {
  completed: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
  pending: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400',
  alert: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400',
};

export function ActivityFeed() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
        <button className="text-sm text-primary hover:text-primary/80 transition">
          View All
        </button>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {activities.map((activity, index) => {
          const Icon = statusIcons[activity.status as keyof typeof statusIcons];
          return (
            <div key={index} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
              <div className="flex items-start space-x-4">
                <div className={`p-2 rounded-lg ${statusColors[activity.status as keyof typeof statusColors]}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium">{activity.type}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{activity.description}</p>
                  <p className="text-xs text-gray-400 mt-1 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {activity.time}
                  </p>
                </div>
              </div>
              {activity.amount && (
                <div className="flex items-center text-green-600">
                  <span className="text-sm font-medium">{activity.amount}</span>
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
