// components/Admin/CampaignForm.jsx
import { useForm } from 'react-hook-form';

export default function CampaignForm({ onSubmit, initialData }) {
  const { register, handleSubmit } = useForm({
    defaultValues: initialData || {
      name: '',
      description: '',
      status: 'active',
      trackingLink: ''
    }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
      <div>
        <label className="block text-sm font-medium mb-1">Campaign Name</label>
        <input
          {...register('name', { required: true })}
          className="w-full p-2 border rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          {...register('description')}
          className="w-full p-2 border rounded h-32"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Status</label>
        <select
          {...register('status')}
          className="w-full p-2 border rounded"
        >
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Tracking Link</label>
        <input
          {...register('trackingLink', { required: true })}
          className="w-full p-2 border rounded"
        />
      </div>

      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        {initialData ? 'Update Campaign' : 'Create Campaign'}
      </button>
    </form>
  );
}