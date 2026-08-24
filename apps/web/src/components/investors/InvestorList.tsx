import React from 'react';

interface Investor {
  id: string;
  name: string;
  type: 'individual' | 'institutional';
  portfolio: number;
  status: 'active' | 'inactive' | 'pending';
  joined: string;
}

const InvestorList: React.FC = () => {
  const mockInvestors: Investor[] = [
    { id: '1', name: 'John Smith', type: 'individual', portfolio: 250000, status: 'active', joined: '2025-06-15' },
    { id: '2', name: 'Acme Capital', type: 'institutional', portfolio: 1500000, status: 'active', joined: '2025-03-10' },
    { id: '3', name: 'Sarah Johnson', type: 'individual', portfolio: 75000, status: 'pending', joined: '2026-08-01' },
    { id: '4', name: 'Vanguard Funds', type: 'institutional', portfolio: 3200000, status: 'active', joined: '2024-11-20' },
  ];

  const totalPortfolio = mockInvestors.reduce((sum, i) => sum + i.portfolio, 0);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Investors</h1>
          <p className="text-sm text-gray-500 mt-1">Total Portfolio: ${totalPortfolio.toLocaleString()}</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
          + Add Investor
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Portfolio</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {mockInvestors.map((investor) => (
              <tr key={investor.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{investor.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500 capitalize">{investor.type}</td>
                <td className="px-6 py-4 text-sm text-gray-900">${investor.portfolio.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    investor.status === 'active' ? 'bg-green-100 text-green-800' :
                    investor.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {investor.status.charAt(0).toUpperCase() + investor.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{investor.joined}</td>
                <td className="px-6 py-4 text-sm">
                  <button className="text-blue-600 hover:text-blue-800 mr-3">View</button>
                  <button className="text-red-600 hover:text-red-800">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvestorList;