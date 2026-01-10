'use client';

import { useState } from 'react';
import { saveFileContent } from '../app/actions';

interface FileEditorProps {
  credentials: {
      host: string;
      username: string;
      password?: string;
  };
  filePath: string;
  initialContent: string;
  onClose: () => void;
}

export default function FileEditor({ credentials, filePath, initialContent, onClose }: FileEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const result = await saveFileContent(credentials, filePath, content);
      if (result.success) {
        onClose(); // Close on success
      } else {
        setError(result.error || 'Failed to save file');
      }
    } catch (e) {
      setError('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-gray-800 w-full max-w-4xl h-[80vh] rounded-lg shadow-2xl flex flex-col border border-gray-700">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-900/50 rounded-t-lg">
          <h3 className="text-lg font-bold text-white truncate px-2" title={filePath}>
            Editing: <span className="text-blue-400 font-mono text-sm">{filePath}</span>
          </h3>
          <div className="flex space-x-2">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded transition"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded font-medium transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 relative">
           <textarea
             value={content}
             onChange={(e) => setContent(e.target.value)}
             className="w-full h-full bg-gray-900 text-gray-300 font-mono text-sm p-4 resize-none focus:outline-none"
             spellCheck={false}
           />
        </div>

        {/* Footer / Error */}
        {error && (
           <div className="bg-red-900/80 text-red-200 px-4 py-2 text-sm border-t border-red-500">
             Error: {error}
           </div>
        )}
      </div>
    </div>
  );
}
