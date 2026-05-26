import React from 'react';

interface FullScreenLoaderProps {
   loading: boolean;
}

export default function FullScreenLoader({ loading }: FullScreenLoaderProps) {
  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-50">
      <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-16 w-16"></div>

      <style>{`
        .loader {
          border-top-color: #ea1bd2ff;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { 
            transform: rotate(0deg); 
          }
          100% { 
            transform: rotate(360deg); 
          }
        }
      `}</style>
    </div>
  );
};
