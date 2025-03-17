import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

const SubmissionsTable = () => {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        completed: 0,
        rejected: 0
    });
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchSubmissions = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `https://campaign-pohg.onrender.com/api/campaign-submissions?page=${page}&status=${statusFilter}&search=${searchTerm}`
            );
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch submissions');
            }

            setSubmissions(data.data);
            setTotalPages(data.totalPages);
            setStats(data.stats);
        } catch (error) {
            console.error('Error fetching submissions:', error);
            toast.error('Failed to fetch submissions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubmissions();
    }, [page, statusFilter, searchTerm]);

    const handleStatusChange = async (submissionId, newStatus) => {
        try {
            const response = await fetch(
                `https://campaign-pohg.onrender.com/api/campaign-submissions/${submissionId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ status: newStatus }),
                }
            );

            if (!response.ok) {
                throw new Error('Failed to update status');
            }

            toast.success('Status updated successfully');
            fetchSubmissions();
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status');
        }
    };

    return (
        <div className="bg-white shadow rounded-lg p-6">
            <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-4">
                    <div className="stats bg-base-200 shadow">
                        <div className="stat">
                            <div className="stat-title">Total</div>
                            <div className="stat-value">{stats.total}</div>
                        </div>
                        <div className="stat">
                            <div className="stat-title">Pending</div>
                            <div className="stat-value text-yellow-500">{stats.pending}</div>
                        </div>
                        <div className="stat">
                            <div className="stat-title">Completed</div>
                            <div className="stat-value text-green-500">{stats.completed}</div>
                        </div>
                        <div className="stat">
                            <div className="stat-title">Rejected</div>
                            <div className="stat-value text-red-500">{stats.rejected}</div>
                        </div>
                    </div>
                </div>
                <div className="flex gap-4">
                    <select
                        className="select select-bordered w-full max-w-xs"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="rejected">Rejected</option>
                    </select>
                    <input
                        type="text"
                        placeholder="Search..."
                        className="input input-bordered w-full max-w-xs"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="table w-full">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Campaign</th>
                            <th>Phone</th>
                            <th>UPI ID</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="text-center py-4">
                                    Loading...
                                </td>
                            </tr>
                        ) : submissions.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="text-center py-4">
                                    No submissions found
                                </td>
                            </tr>
                        ) : (
                            submissions.map((submission) => (
                                <tr key={submission._id}>
                                    <td>{format(new Date(submission.createdAt), 'MMM d, yyyy HH:mm')}</td>
                                    <td>{submission.campaignName}</td>
                                    <td>{submission.phone}</td>
                                    <td>{submission.upiId}</td>
                                    <td>
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                submission.status === 'completed'
                                                    ? 'bg-green-100 text-green-800'
                                                    : submission.status === 'rejected'
                                                    ? 'bg-red-100 text-red-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                            }`}
                                        >
                                            {submission.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button
                                                className="btn btn-xs btn-success"
                                                onClick={() => handleStatusChange(submission._id, 'completed')}
                                                disabled={submission.status === 'completed'}
                                            >
                                                Complete
                                            </button>
                                            <button
                                                className="btn btn-xs btn-error"
                                                onClick={() => handleStatusChange(submission._id, 'rejected')}
                                                disabled={submission.status === 'rejected'}
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-center mt-4 gap-2">
                <button
                    className="btn btn-sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                >
                    Previous
                </button>
                <span className="flex items-center px-4">
                    Page {page} of {totalPages}
                </span>
                <button
                    className="btn btn-sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default SubmissionsTable; 