'use client';

import { useState, useRef, useEffect } from 'react';
import { runTerminalCommand } from '../app/actions';

interface TerminalProps {
  credentials: {
      host: string;
      username: string;
      password?: string;
  };
}

export default function Terminal({ credentials }: TerminalProps) {
  const [history, setHistory] = useState<{command: string, output: string}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [cwd, setCwd] = useState('~');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const command = input;
    setInput('');
    setLoading(true);

    // Optimistic update
    setHistory(prev => [...prev, { command, output: '' }]);

    const result = await runTerminalCommand(credentials, command, cwd);
    
    setHistory(prev => {
        const newHistory = [...prev];
        // Perform update on the last element (our optimistic one)
        newHistory[newHistory.length - 1].output = result.success ? result.output : result.error || 'Command failed';
        return newHistory;
    });

    if (result.success && result.newCwd) {
        setCwd(result.newCwd);
    }
    
    setLoading(false);
  };

  return (
    <div className="bg-gray-900 rounded-lg shadow-xl border border-gray-700 flex flex-col h-[600px] font-mono text-sm">
      <div className="bg-gray-800 p-3 rounded-t-lg border-b border-gray-700 flex items-center space-x-2">
         <div className="w-3 h-3 rounded-full bg-red-500"></div>
         <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
         <div className="w-3 h-3 rounded-full bg-green-500"></div>
         <span className="ml-4 text-gray-400 text-xs">kamiak-console � {credentials.username}@{credentials.host}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
         {history.map((entry, i) => (
             <div key={i} className="break-words">
                 <div className="flex text-green-400">
                     <span className="mr-2">?</span>
                     <span className="text-blue-400 mr-2">[{cwd}]</span>
                     <span className="text-white">{entry.command}</span>
                 </div>
                 <div className="pl-4 text-gray-300 whitespace-pre-wrap">
                     {entry.output || (i === history.length - 1 && loading ? <span className="animate-pulse">_</span> : '')}
                 </div>
             </div>
         ))}
         <div ref={bottomRef} />
      </div>

      <div className="p-4 bg-gray-800 rounded-b-lg border-t border-gray-700">
        <form onSubmit={handleSubmit} className="flex">
            <span className="text-green-400 mr-2">?</span>
            <span className="text-blue-400 mr-2">[{cwd}]</span>
            <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-white focus:ring-0 p-0"
                placeholder={loading ? "Executing..." : "Enter command..."}
                disabled={loading}
                autoFocus
            />
        </form>
      </div>
    </div>
  );
}
