'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function R2DebugPage() {
  const [results, setResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()} - ${message}`]);
  };

  const clearResults = () => {
    setResults([]);
  };

  const testR2Environment = async () => {
    setIsLoading(true);
    addResult('🔍 Testing R2 Environment...');
    
    try {
      const response = await fetch('/api/debug/r2-environment');
      const data = await response.json();
      
      addResult(`Environment Status: ${data.isConfigured ? '✅ CONFIGURED' : '❌ INCOMPLETE'}`);
      if (data.missing?.length > 0) {
        addResult(`Missing variables: ${data.missing.join(', ')}`);
      }
      
      Object.entries(data.vars || {}).forEach(([key, value]) => {
        addResult(`${key}: ${value ? '✅' : '❌'}`);
      });
      
    } catch (error) {
      addResult(`❌ Error checking environment: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testR2Upload = async () => {
    setIsLoading(true);
    addResult('🧪 Testing R2 Upload...');
    
    try {
      const testFile = new Blob(['Test content for R2 upload'], { type: 'text/plain' });
      const formData = new FormData();
      formData.append('file', testFile, 'r2-test.txt');
      formData.append('imageId', `test-${Date.now()}`);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (response.ok) {
        addResult(`✅ Upload successful: ${data.url}`);
        return data.url;
      } else {
        addResult(`❌ Upload failed: ${data.error}`);
        return null;
      }
      
    } catch (error) {
      addResult(`❌ Upload error: ${error}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const testR2Delete = async (url?: string) => {
    setIsLoading(true);
    addResult('🗑️ Testing R2 Delete...');
    
    try {
      let targetUrl = url;
      if (!targetUrl) {
        addResult('No URL provided, creating test file first...');
        targetUrl = await testR2Upload();
        if (!targetUrl) {
          addResult('❌ Could not create test file for deletion');
          return;
        }
      }

      const response = await fetch('/api/upload', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl: targetUrl })
      });

      const data = await response.json();
      
      if (response.ok) {
        addResult(`✅ Delete successful for: ${targetUrl}`);
      } else {
        addResult(`❌ Delete failed: ${data.error}`);
      }
      
    } catch (error) {
      addResult(`❌ Delete error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const runCompleteTest = async () => {
    setIsLoading(true);
    addResult('🚀 Starting complete R2 test suite...');
    
    try {
      // 1. Test environment
      await testR2Environment();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 2. Test upload
      addResult('');
      const uploadedUrl = await testR2Upload();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 3. Test delete
      if (uploadedUrl) {
        addResult('');
        await testR2Delete(uploadedUrl);
      }
      
      addResult('');
      addResult('🏁 Complete test finished!');
      
    } catch (error) {
      addResult(`❌ Test suite error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">🔧 Cloudflare R2 Debug Tools</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Button 
          onClick={testR2Environment} 
          disabled={isLoading}
          variant="outline"
        >
          🔍 Check Environment
        </Button>
        
        <Button 
          onClick={() => testR2Upload()} 
          disabled={isLoading}
          variant="outline"
        >
          🧪 Test Upload
        </Button>
        
        <Button 
          onClick={() => testR2Delete()} 
          disabled={isLoading}
          variant="outline"
        >
          🗑️ Test Delete
        </Button>
        
        <Button 
          onClick={runCompleteTest} 
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700"
        >
          🚀 Complete Test
        </Button>
      </div>

      <div className="flex gap-2 mb-4">
        <Button 
          onClick={clearResults} 
          variant="ghost"
          size="sm"
        >
          🗑️ Clear Results
        </Button>
        
        <div className="flex-1" />
        
        {isLoading && (
          <div className="flex items-center text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Testing...
          </div>
        )}
      </div>

      <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-96 overflow-y-auto">
        <div className="mb-2 text-gray-400">
          # R2 Debug Console - All operations will be logged here
        </div>
        {results.map((result, index) => (
          <div key={index} className="mb-1">
            {result}
          </div>
        ))}
        {results.length === 0 && (
          <div className="text-gray-500">
            Click any button above to start testing...
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">💡 Debug Instructions:</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li><strong>Check Environment:</strong> Verifies all R2 environment variables are properly set</li>
          <li><strong>Test Upload:</strong> Creates a test file and uploads it to R2</li>
          <li><strong>Test Delete:</strong> Deletes a file from R2 (creates one first if needed)</li>
          <li><strong>Complete Test:</strong> Runs all tests in sequence</li>
          <li><strong>Console:</strong> Check browser dev tools console for detailed logs</li>
        </ul>
      </div>
    </div>
  );
}