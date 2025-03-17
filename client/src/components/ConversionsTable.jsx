import React from 'react';
import { toast } from 'react-hot-toast';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  default: 'bg-gray-100 text-gray-800'
};

const ConversionsTable = ({ conversions, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden my-4">
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!conversions || conversions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 my-4 text-center">
        <p className="text-gray-500">No conversion data available</p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString || 'N/A';
      }
      // Format the date as YYYY-MM-DD HH:MM
      return date.toISOString().slice(0, 16).replace('T', ' ');
    } catch (error) {
      return dateString || 'N/A';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden my-4">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Recent Conversions</h3>
        <p className="mt-1 text-sm text-gray-500">Detailed list of conversion data</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UPI ID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payout</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Offer</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {conversions.map((conversion, index) => (
              <tr key={conversion.id || index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {conversion.id || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {conversion.phone ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-900">{conversion.phone}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(conversion.phone);
                          toast.success('Phone number copied!');
                        }}
                        className="text-gray-400 hover:text-blue-600"
                        title="Copy phone number"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  ) : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {conversion.upi_id ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-900">{conversion.upi_id}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(conversion.upi_id);
                          toast.success('UPI ID copied!');
                        }}
                        className="text-gray-400 hover:text-blue-600"
                        title="Copy UPI ID"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  ) : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {conversion.p3 || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[conversion.status?.toLowerCase()] || statusColors.default}`}>
                    {conversion.status || 'Unknown'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ₹{conversion.payout || '0'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {conversion.offer_name || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(conversion.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ConversionsTable; 