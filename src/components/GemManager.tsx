'use client';

import { useState, useEffect } from 'react';
import { Gem, listGems, saveGem, deleteGem, queryLLM, resetLLMContext } from '../app/llm-actions';
import ChatInterface from './ChatInterface';
import { SSHCredentials } from '../lib/ssh';

interface GemManagerProps {
    credentials: SSHCredentials;
    onSelectGem: (gem: Gem | null) => void;
    initialGems: Gem[];
    onRefresh: () => Promise<void>;
}

export default function GemManager({ credentials, onSelectGem, initialGems, onRefresh }: GemManagerProps) {
    const [gems, setGems] = useState<Gem[]>(initialGems);
    const [view, setView] = useState<'list' | 'edit'>('list');
    const [currentGem, setCurrentGem] = useState<Gem | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setGems(initialGems);
    }, [initialGems]);

    const refreshGems = async () => {
        setLoading(true);
        await onRefresh();
        setLoading(false);
    };

    const handleCreate = () => {
        const newGem: Gem = {
            id: Date.now().toString(),
            name: '',
            description: '',
            instructions: '',
            created_at: Date.now()
        };
        setCurrentGem(newGem);
        setView('edit');
    };

    const handleEdit = (gem: Gem) => {
        setCurrentGem({ ...gem });
        setView('edit');
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('Delete this Gem?')) return;

        await deleteGem(credentials, id);
        await refreshGems();
    };

    const handleSave = async () => {
        if (!currentGem || !currentGem.name.trim()) {
            alert('Name is required');
            return;
        }

        setLoading(true);
        const res = await saveGem(credentials, currentGem);
        setLoading(false);

        if (res.success) {
            setView('list');
            refreshGems();
        } else {
            alert('Failed to save: ' + res.error);
        }
    };

    const handleUse = (gem: Gem) => {
        onSelectGem(gem);
    };

    if (view === 'list') {
        return (
            <div className="flex flex-col p-6">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">My Gems</h2>
                        <p className="text-gray-500">Create custom tools and personas</p>
                    </div>
                    <button
                        onClick={handleCreate}
                        className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 flex items-center gap-2"
                    >
                        <span>+</span> New Gem
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center text-gray-500">Loading Gems...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {gems.map(gem => (
                            <div
                                key={gem.id}
                                className="group bg-white rounded-[1.5rem] p-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 flex flex-col cursor-pointer"
                                onClick={() => handleUse(gem)}
                            >
                                <div className="mb-4 relative">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-200 to-purple-300 flex items-center justify-center shadow-lg shadow-purple-100 group-hover:scale-105 transition-transform duration-300">
                                        <span className="text-2xl font-light text-purple-900">
                                            {gem.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded">
                                        Click to use
                                    </div>
                                </div>

                                <h3
                                    className="text-xl font-bold text-gray-900 mb-2 tracking-tight truncate leading-tight"
                                    title={gem.name}
                                >
                                    {gem.name.length > 20 ? gem.name.slice(0, 20) + "..." : gem.name}
                                </h3>

                                <p className="text-sm text-gray-500 leading-relaxed mb-6 line-clamp-3 min-h-[4.5em]">
                                    {gem.description || 'No description provided for this gem.'}
                                </p>

                                <div className="h-px bg-gray-100 w-full mb-4"></div>

                                <div className="flex gap-3 mt-auto">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleEdit(gem); }}
                                        className="flex-1 bg-[#4B9CFF] hover:bg-[#3b8ce6] text-white rounded-full py-2 px-3 flex items-center justify-center gap-2 font-semibold text-xs transition-all shadow-lg shadow-blue-100 hover:shadow-blue-200 transform hover:scale-[1.02]"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                                        Edit
                                    </button>
                                    <button
                                        onClick={(e) => handleDelete(e, gem.id)}
                                        className="flex-1 bg-[#EF4444] hover:bg-[#dc2626] text-white rounded-full py-2 px-3 flex items-center justify-center gap-2 font-semibold text-xs transition-all shadow-lg shadow-red-100 hover:shadow-red-200 transform hover:scale-[1.02]"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}

                        {gems.length === 0 && (
                            <div className="col-span-full text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                                No Gems yet. Create one to get started!
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // Edit View with No Preview & Save Button at Bottom
    return (
        <div className="flex flex-col bg-white p-8 max-w-3xl mx-auto w-full">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setView('list')} className="text-gray-500 hover:text-gray-900">
                    Back
                </button>
                <h2 className="text-xl font-bold">
                    {currentGem?.id ? 'Edit Gem' : 'New Gem'}
                </h2>
            </div>

            <div className="space-y-6 flex-1 overflow-auto">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                        type="text"
                        value={currentGem?.name || ''}
                        onChange={e => setCurrentGem(prev => prev ? { ...prev, name: e.target.value } : null)}
                        placeholder="Give your Gem a name"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent outline-none transition-all"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                        value={currentGem?.description || ''}
                        onChange={e => setCurrentGem(prev => prev ? { ...prev, description: e.target.value } : null)}
                        placeholder="Describe your Gem and explain what it does"
                        className="w-full p-3 border border-gray-300 rounded-lg h-24 resize-none focus:ring-2 focus:ring-crimson focus:border-transparent outline-none transition-all"
                    />
                </div>

                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                    <div className="relative h-full">
                        <textarea
                            value={currentGem?.instructions || ''}
                            onChange={e => setCurrentGem(prev => prev ? { ...prev, instructions: e.target.value } : null)}
                            placeholder="E.g., You are a helpful biology tutor..."
                            className="w-full p-4 border border-gray-300 rounded-lg h-[400px] resize-none focus:ring-2 focus:ring-crimson focus:border-transparent outline-none transition-all font-mono text-sm"
                        />
                        <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                            This acts as the System Prompt
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 flex justify-end">
                <button
                    onClick={handleSave}
                    className="bg-gray-900 text-white px-8 py-3 rounded-lg hover:bg-gray-800 font-medium shadow-lg transition-transform transform hover:-translate-y-0.5"
                >
                    Save Gem
                </button>
            </div>
        </div>
    );
}




