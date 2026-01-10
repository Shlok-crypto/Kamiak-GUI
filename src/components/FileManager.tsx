'use client';

import { useState, useEffect } from 'react';
import { listFiles, readFileContent, deleteFile, FileEntry } from '../app/actions';
import FileEditor from './FileEditor';

interface FileManagerProps {
  credentials: {
      host: string;
      username: string;
      password?: string;
  };
}

// Icons
const FolderIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-yellow-400">
    <path d="M19.5 21a3 3 0 003-3v-4.5a3 3 0 00-3-3h-15a3 3 0 00-3 3V18a3 3 0 003 3h15zM1.5 10.146V6a3 3 0 013-3h5.379a2.25 2.25 0 011.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 013 3v1.146A4.483 4.483 0 0019.5 9h-15a4.483 4.483 0 00-3 1.146z" />
  </svg>
);

const FileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-400">
    <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625z" />
    <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-red-400 hover:text-red-300">
    <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clipRule="evenodd" />
  </svg>
);

export default function FileManager({ credentials }: FileManagerProps) {
  const [currentPath, setCurrentPath] = useState('~');
  const [inputPath, setInputPath] = useState('~'); // For manual entry
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Editor State
  const [editingFile, setEditingFile] = useState<{path: string, content: string} | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);

  const loadFiles = async (path: string) => {
    setLoading(true);
    setError('');
    setInputPath(path);
    
    try {
      const result = await listFiles(credentials, path);
      if (result.success) {
        setFiles(result.files);
        if (result.currentPath) {
            setCurrentPath(result.currentPath);
            setInputPath(result.currentPath);
        }
      } else {
        setError(result.error || 'Failed to list files');
      }
    } catch (e) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles(currentPath);
  }, []);

  const handleNavigate = async (entry: FileEntry) => {
    const fullPath = currentPath === '/' ? `/${entry.name}` : `${currentPath}/${entry.name}`;

    if (entry.isDirectory) {
      loadFiles(fullPath);
    } else {
      // Open File Editor
      setLoadingContent(true);
      setError('');
      try {
        const result = await readFileContent(credentials, fullPath);
        if (result.success) {
          setEditingFile({ path: fullPath, content: result.content });
        } else {
          setError(result.error || 'Failed to read file');
        }
      } catch (e) {
        setError('Failed to open file');
      } finally {
        setLoadingContent(false);
      }
    }
  };

  const handleUp = () => {
    loadFiles(`${currentPath}/..`);
  };

  const handleManualPathSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      loadFiles(inputPath);
  };

  const handleDelete = async (e: React.MouseEvent, file: FileEntry) => {
    e.stopPropagation(); // Prevent navigation/opening
    
    if (!window.confirm(`Are you sure you want to delete ${file.name}? This cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      const fullPath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
      const result = await deleteFile(credentials, fullPath);
      
      if (result.success) {
        loadFiles(currentPath);
      } else {
        setError(result.error || 'Failed to delete file');
        setLoading(false);
      }
    } catch (err) {
      setError('An unexpected error occurred during deletion');
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-gray-800 rounded-lg p-6 shadow-xl border border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">File Browser</h3>
          <div className="flex space-x-2">
             <button 
               onClick={handleUp}
               className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-300 transition-colors"
             >
               Up Level
             </button>
             <button 
               onClick={() => loadFiles(currentPath)}
               className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm text-white transition-colors"
             >
               Refresh
             </button>
          </div>
        </div>

        {/* Path Bar */}
        <form onSubmit={handleManualPathSubmit} className="mb-4 flex gap-2">
            <div className="flex-1 relative">
                <input 
                    type="text" 
                    value={inputPath}
                    onChange={(e) => setInputPath(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-sm text-gray-300 font-mono focus:border-blue-500 focus:outline-none transition-colors"
                    placeholder="/home/user/..."
                />
            </div>
            <button 
                type="submit"
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm font-medium transition-colors"
                disabled={loading}
            >
                Go
            </button>
        </form>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500 animate-pulse">
            Loading files...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-gray-700/50 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Name</th>
                  <th className="px-4 py-3">Size</th>
                  <th className="px-4 py-3">Permissions</th>
                  <th className="px-4 py-3">Modified</th>
                  <th className="px-4 py-3 rounded-tr-lg w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {files.map((file) => (
                  <tr 
                    key={file.name} 
                    className="hover:bg-gray-800/50 transition-colors cursor-pointer"
                    onClick={() => handleNavigate(file)}
                  >
                    <td className="px-4 py-3 font-medium text-white flex items-center space-x-3">
                      <span>{file.isDirectory ? <FolderIcon /> : <FileIcon />}</span>
                      <span>{file.name}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{file.size}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{file.permissions}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{file.updatedAt}</td>
                    <td className="px-4 py-3">
                      <button 
                        onClick={(e) => handleDelete(e, file)}
                        className="p-1 hover:bg-red-500/20 rounded transition-colors"
                        title="Delete"
                      >
                        <TrashIcon />
                      </button>
                    </td>
                  </tr>
                ))}
                {files.length === 0 && (
                  <tr>
                     <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                       Empty directory
                     </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {loadingContent && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
                <div className="bg-gray-800 p-4 rounded shadow text-white">Opening file...</div>
            </div>
        )}
      </div>

      {/* Editor Modal */}
      {editingFile && (
        <FileEditor 
           credentials={credentials}
           filePath={editingFile.path}
           initialContent={editingFile.content}
           onClose={() => {
             setEditingFile(null);
             loadFiles(currentPath); 
           }}
        />
      )}
    </>
  );
}