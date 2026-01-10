'use client';

import { useState } from 'react';
import { submitJob, JobConfig } from '../app/actions';

interface JobComposerProps {
  credentials: {
      host: string;
      username: string;
      password?: string;
  };
}

const TEMPLATES = {
  standard: {
    partition: 'kamiak',
    nodes: 1,
    cpus: 1,
    memory: '1G',
    time: '01:00:00',
    script: `#SBATCH --output=job_%j.out
#SBATCH --error=job_%j.err

echo "======================================================"
echo "Starting job on $(hostname)"
echo "Job ID: $SLURM_JOB_ID"
echo "======================================================"

# module load python3
echo "Hello Kamiak"`
  },
  gpu: {
    partition: 'gpu',
    nodes: 1,
    cpus: 2,
    memory: '32G',
    time: '04:00:00',
    script: `#SBATCH --output=gpu_job_%j.out
#SBATCH --error=gpu_job_%j.err
#SBATCH --gres=gpu:1

echo "Starting GPU job..."
module load cuda/12.2.0
nvidia-smi`
  }
};

export default function JobComposer({ credentials }: JobComposerProps) {
  const [job, setJob] = useState<JobConfig>({
    name: 'my-job',
    ...TEMPLATES.standard
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{message: string; type: 'success' | 'error'} | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    
    try {
      const result = await submitJob(credentials, job);
      if (result.success) {
        setStatus({ message: `Job submitted successfully! ID: ${result.jobId}`, type: 'success' });
      } else {
        setStatus({ message: result.error || 'Submission failed', type: 'error' });
      }
    } catch (e) {
      setStatus({ message: 'An unexpected error occurred', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadTemplate = (type: keyof typeof TEMPLATES) => {
    setJob(prev => ({ ...prev, ...TEMPLATES[type] }));
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-xl border border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-white">Job Composer</h3>
        <div className="space-x-2">
            <button type="button" onClick={() => loadTemplate('standard')} className="px-3 py-1 bg-gray-700 text-xs rounded hover:bg-gray-600">Standard Template</button>
            <button type="button" onClick={() => loadTemplate('gpu')} className="px-3 py-1 bg-gray-700 text-xs rounded hover:bg-gray-600">GPU Template</button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">Job Name</label>
            <input 
              type="text" 
              value={job.name}
              onChange={e => setJob({...job, name: e.target.value})}
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white"
              required
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Partition</label>
            <input 
              type="text" 
              value={job.partition}
              onChange={e => setJob({...job, partition: e.target.value})}
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Nodes</label>
            <input 
              type="number" 
              value={job.nodes}
              onChange={e => setJob({...job, nodes: parseInt(e.target.value)})}
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white"
              min="1"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">CPUs</label>
            <input 
              type="number" 
              value={job.cpus}
              onChange={e => setJob({...job, cpus: parseInt(e.target.value)})}
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white"
              min="1"
            />
          </div>
           <div>
            <label className="block text-gray-400 text-sm mb-1">Memory (e.g., 4G)</label>
            <input 
              type="text" 
              value={job.memory}
              onChange={e => setJob({...job, memory: e.target.value})}
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white"
            />
          </div>
           <div>
            <label className="block text-gray-400 text-sm mb-1">Time (DD-HH:MM:SS)</label>
            <input 
              type="text" 
              value={job.time}
              onChange={e => setJob({...job, time: e.target.value})}
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white"
            />
          </div>
        </div>

        <div>
            <label className="block text-gray-400 text-sm mb-1">Script</label>
            <textarea 
                value={job.script}
                onChange={e => setJob({...job, script: e.target.value})}
                className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white font-mono h-48"
                spellCheck={false}
            />
        </div>

        {status && (
            <div className={`p-4 rounded ${status.type === 'success' ? 'bg-green-900/50 text-green-200 border border-green-500' : 'bg-red-900/50 text-red-200 border border-red-500'}`}>
                {status.message}
            </div>
        )}

        <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
        >
            {loading ? 'Submitting...' : 'Submit Job'}
        </button>
      </form>
    </div>
  );
}
