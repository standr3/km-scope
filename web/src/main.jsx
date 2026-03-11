import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import './global.css';
import { Toaster } from "@/components/ui/sonner"

import { TooltipProvider } from "@/components/ui/tooltip"

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (count, err) => count < 2 && err?.message === 'Network Error',
      retryDelay: 0
    }
  }
});

createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
  <QueryClientProvider client={qc}>
    <AuthProvider>
      <TooltipProvider>

        <App />
      </TooltipProvider>
      <Toaster />
    </AuthProvider>
  </QueryClientProvider>
  // </React.StrictMode>
);
