// components/Admin/CampaignList.jsx
import { Link } from 'react-router-dom';

export default function CampaignList({ campaigns, onDelete }) {
  return (
    <div className="space-y-4">
      {campaigns.map(campaign => (
        <div key={campaign.id} className="border p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">{campaign.name}</h3>
              <p className="text-sm text-gray-600">{campaign.description}</p>
              <span className={`px-2 py-1 text-sm rounded ${
                campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {campaign.status}
              </span>
            </div>
            <div className="space-x-2">
              <Link
                to={`/admin/campaigns/${campaign.id}`}
                className="text-blue-500 hover:text-blue-700"
              >
                Edit
              </Link>
              <button
                onClick={() => onDelete(campaign.id)}
                className="text-red-500 hover:text-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}