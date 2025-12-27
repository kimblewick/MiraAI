/**
 * Protected Route Component
 * 
 * Wraps routes that require authentication.
 * Redirects to landing page if user is not authenticated.
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { StarField, GradientOrb, MiraLogo } from '@/components/ui/celestial-icons';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
        <StarField count={15} className="opacity-20" />
        <GradientOrb className="top-[-100px] right-[-100px]" size={300} />
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative z-10 text-center"
        >
          <div className="relative mb-4">
            <div className="w-12 h-12 rounded-full border-2 border-border border-t-celestial animate-spin mx-auto" />
          </div>
          <p className="text-muted-foreground text-sm">Loading...</p>
          
          <div className="mt-8 flex items-center justify-center gap-2 text-muted-foreground/40">
            <MiraLogo size={16} />
            <span className="text-xs">MIRA</span>
          </div>
        </motion.div>
      </div>
    );
  }
  
  // Redirect to landing if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  // Render protected content
  return children;
}
