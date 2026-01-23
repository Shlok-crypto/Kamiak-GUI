'use client';

import { useState } from 'react';
import Login from '../components/Login';
import Dashboard from '../components/Dashboard';
import { useRef, useEffect } from 'react';
import { verifyConnection } from './actions';
import { ensureLLMEnvironment } from './llm-actions';

export default function Home() {
  const [credentials, setCredentials] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [error, setError] = useState('');
  
  // Use a ref to prevent double-execution in Strict Mode
  const setupRan = useRef(false);

  useEffect(() => {
    if (credentials && !setupRan.current) {
        setupRan.current = true;
        // Run setup in background
        ensureLLMEnvironment(credentials).then(res => {
            if (res.success && res.seeded) {
                console.log('LLM Environment Seeded with Default Gems');
            }
        });
    }
  }, [credentials]);

  const handleLogin = async (creds: any) => {
    setLoading(true);
    setError('');
    try {
        const result = await verifyConnection(creds);
        setLoading(false);
        
        if (result.success) {
          setCredentials(creds);
        } else {
          setError(result.error || 'Failed to connect');
        }
    } catch (e) {
        setLoading(false);
        setError('An unexpected error occurred');
    }
  };

  const handleLogout = () => {
    setCredentials(null);
    setupRan.current = false;
  };

  if (credentials) {
    return <Dashboard credentials={credentials} onLogout={handleLogout} />;
  }

  return (
    <>
        {error && (
            <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-red-500/90 text-white px-6 py-3 rounded-md shadow-lg z-50 transition-all duration-300 backdrop-blur-sm border border-red-400">
                <span className="font-bold">Error:</span> {error}
            </div>
        )}
        <Login onLogin={handleLogin} loading={loading} />
    </>
  );
}

