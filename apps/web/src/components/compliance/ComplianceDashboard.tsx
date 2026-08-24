import React from 'react';

interface ComplianceItem {
  id: string;
  name: string;
  status: 'compliant' | 'non-compliant' | 'in-review';
  category: string;
  lastChecked: string;
}

const ComplianceDashboard: React.FC = () => {
  const mockComplianceItems: ComplianceItem[] = [
    { id: '1', name: 'KYC Verification', status: 'compliant', category: 'Identity', lastChecked: '2026-08-20' },
    { id: '2', name: 'AML Screening', status: 'in-review', category: 'Financial', lastChecked: '2026-08-22' },
    { id: '3', name: 'Data Privacy (GDPR)', status: 'compliant', category: 'Privacy', lastChecked: '2026-08-18' },
    { id: '4', name: 'SEC Filing', status: 'non-compliant', category: 'Regulatory', lastChecked: '2026-08-10' },
  ];

  const stats = {
    total: mockComplianceItems.length,
    compliant: mockComplianceItems.filter(i => i.status === 'compliant').length,
    nonCompliant: mockComplianceItems.filter(i => i.status === 'non-compliant').length,
    inReview: mockComplianceItems.filter(i => i.status === 'in-review').length,
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Compliance Dashboard</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
          Run Audit
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Total Checks</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-green-200 bg-green-50">
          <p className="text-sm text-green-700">Compliant</p>
          <p className="text-2xl font-bold text-green-700">{stats.compliant}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-red-200 bg-red-50">
          <p className="text-sm text-red-700">Non-Compliant</p>
          <p className="text-2xl font-bold text-red-700">{stats.nonCompliant}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-yellow-200 bg-yellow-50">
          <p className="text-sm text-yellow-700">In Review</p>
          <p className="text-2xl font-bold text-yellow-700">{stats.inReview}</p>
        </div>
      </div>

      {/* Compliance List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Checked</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {mockComplianceItems.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{item.category}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    item.status === 'compliant' ? 'bg-green-100 text-green-800' :
                    item.status === 'non-compliant' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {item.status.replace('-', ' ').toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{item.lastChecked}</td>
                <td className="px-6 py-4 text-sm">
                  <button className="text-blue-600 hover:text-blue-800">Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComplianceDashboard;