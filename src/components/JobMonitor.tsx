'use client';

import { useState, useEffect } from 'react';
import { getJobQueue, getJobHistory, cancelJob, JobQueueEntry, JobHistoryEntry } from '../app/actions';

interface JobMonitorProps {
  credentials: {
      host: string;
      username: string;
      password?: string;
  };
}

export default function JobMonitor({ credentials }: JobMonitorProps) {
  const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue');
  const [queue, setQueue] = useState<JobQueueEntry[]>([]);
  const [history, setHistory] = useState<JobHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'queue') {
        const result = await getJobQueue(credentials);
        if (result.success) {
          setQueue(result.jobs);
        } else {
          setError(result.error || 'Failed to load queue');
        }
      } else {
        const result = await getJobHistory(credentials);
        if (result.success) {
          setHistory(result.jobs);
        } else {
          console.error(result.error);
        }
      }
    } catch (e) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (jobId: string) => {
      if (!window.confirm(`Are you sure you want to cancel job ${jobId}?`)) return;

      setCancelling(jobId);
      try {
          const result = await cancelJob(credentials, jobId);
          if (result.success) {
              // Optimistic update: Remove job from queue immediately
              setQueue(prev => prev.filter(job => job.jobId !== jobId));
              
              // Also refresh data from server after a slight delay to allow Slurm to update
              setTimeout(loadData, 2000);
          } else {
              alert(`Failed to cancel job: ${result.error}`);
          }
      } catch (e) {
          alert('An unexpected error occurred during cancellation');
      } finally {
          setCancelling(null);
      }
  };

  useEffect(() => {
    loadData();
    let interval: NodeJS.Timeout;
    if (activeTab === 'queue') {
       interval = setInterval(loadData, 30000);
    }
    return () => clearInterval(interval);
  }, [activeTab]);

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-xl border border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-white">Job Monitor</h3>
        <div className="space-x-2">
            <button 
                onClick={() => setActiveTab('queue')} 
                className={`px-3 py-1 rounded text-sm transition-colors ${activeTab === 'queue' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
                Active Queue
            </button>
            <button 
                onClick={() => setActiveTab('history')} 
                className={`px-3 py-1 rounded text-sm transition-colors ${activeTab === 'history' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
                Job History
            </button>
            <button 
                onClick={loadData}
                className="px-3 py-1 bg-gray-700 rounded text-sm text-gray-300 hover:bg-gray-600 transition-colors ml-4"
            >
                Refresh
            </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded mb-4">
          {error}
        </div>
      )}

      {loading && <div className="text-center py-4 text-gray-500 animate-pulse">Updating...</div>}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-gray-700/50 uppercase text-xs">
            {activeTab === 'queue' ? (
                <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Job ID</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Partition</th>
                    <th className="px-4 py-3">State</th>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Nodes</th>
                    <th className="px-4 py-3 rounded-tr-lg">Action</th>
                </tr>
            ) : (
                <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Job ID</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Partition</th>
                    <th className="px-4 py-3">State</th>
                    <th className="px-4 py-3 rounded-tr-lg">Exit Code</th>
                </tr>
            )}
          </thead>
          <tbody className="divide-y divide-gray-700">
            {activeTab === 'queue' ? (
                queue.length > 0 ? queue.map((job) => (
                    <tr key={job.jobId} className="hover:bg-gray-800/50">
                        <td className="px-4 py-3 font-mono">{job.jobId}</td>
                        <td className="px-4 py-3">{job.name}</td>
                        <td className="px-4 py-3">{job.partition}</td>
                        <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs ${job.state === 'RUNNING' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>
                                {job.state}
                            </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{job.time} / {job.timeLimit}</td>
                        <td className="px-4 py-3">{job.nodes} ({job.nodelist})</td>
                        <td className="px-4 py-3">
                            <button 
                                onClick={() => handleCancel(job.jobId)}
                                disabled={cancelling === job.jobId}
                                className="px-2 py-1 bg-red-900/50 text-red-200 text-xs rounded hover:bg-red-800 border border-red-700 disabled:opacity-50"
                            >
                                {cancelling === job.jobId ? 'Killing...' : 'Cancel'}
                            </button>
                        </td>
                    </tr>
                )) : (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No active jobs found</td></tr>
                )
            ) : (
                history.length > 0 ? history.map((job) => (
                    <tr key={job.jobId} className="hover:bg-gray-800/50">
                        <td className="px-4 py-3 font-mono">{job.jobId}</td>
                        <td className="px-4 py-3">{job.name}</td>
                        <td className="px-4 py-3">{job.partition}</td>
                        <td className="px-4 py-3">
                             <span className={`px-2 py-1 rounded text-xs ${job.state === 'COMPLETED' ? 'bg-green-900 text-green-300' : job.state === 'FAILED' ? 'bg-red-900 text-red-300' : 'bg-gray-700 text-gray-300'}`}>
                                {job.state}
                            </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{job.exitCode}</td>
                    </tr>
                )) : (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No job history found</td></tr>
                )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
