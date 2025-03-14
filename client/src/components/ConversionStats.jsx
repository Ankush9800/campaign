import React from 'react';

const ConversionStats = ({ stats = {
  total: 0,
  pending: 0,
  completed: 0,
  rejected: 0,
  totalPayout: 0
}, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 my-4">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 my-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Conversion Statistics</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-xl font-bold text-blue-600">{stats.total || 0}</p>
        </div>
        
        <div className="bg-yellow-50 p-3 rounded-lg">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-xl font-bold text-yellow-600">{stats.pending || 0}</p>
        </div>
        
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-xl font-bold text-green-600">{stats.completed || 0}</p>
        </div>
        
        <div className="bg-red-50 p-3 rounded-lg">
          <p className="text-sm text-gray-500">Rejected</p>
          <p className="text-xl font-bold text-red-600">{stats.rejected || 0}</p>
        </div>
        
        <div className="bg-purple-50 p-3 rounded-lg">
          <p className="text-sm text-gray-500">Total Payout</p>
          <p className="text-xl font-bold text-purple-600">₹{stats.totalPayout || 0}</p>
        </div>
      </div>
      
      {stats.stored !== undefined && (
        <div className="mt-4 text-sm text-gray-600">
          <span className="font-medium">{stats.stored}</span> conversions stored in database
        </div>
      )}
    </div>
  );
};

export default ConversionStats; 