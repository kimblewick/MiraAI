/**
 * OAuth Callback Page
 * 
 * Handles the redirect from Cognito Hosted UI after successful authentication.
 * Extracts tokens from URL, stores them, and redirects to the appropriate page.
 * 
 * Flow:
 * 1. Extract tokens from URL hash
 * 2. Check if user has an existing profile in DynamoDB via GET /profile
 * 3. If profile exists (200) -> redirect to /chat
 * 4. If no profile (404) -> redirect to /onboarding
 * 5. If error (500, network) -> redirect to /onboarding (will check again there)
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../api/apiClient';
import { cognitoAuth } from '../services/cognitoAuth';
import { Loader2, Check, X } from 'lucide-react';
import { 
  StarField, 
  GradientOrb, 
  MiraLogo,
  CrescentMoon
} from '@/components/ui/celestial-icons';

export default function Callback() {
  const navigate = useNavigate();
  const { handleCallback, checkAuthStatus } = useAuth();
  const [status, setStatus] = useState('processing'); // processing, success, error, checking
  const [message, setMessage] = useState('Processing authentication...');
  
  useEffect(() => {
    processCallback();
  }, []);
  
  /**
   * Clear any cached profile data for a fresh start.
   * This ensures a new user doesn't see stale data from a previous session.
   */
  const clearProfileCache = () => {
    localStorage.removeItem('user_profile');
    localStorage.removeItem('profile_check_time');
  };
  
  /**
   * Cache the user profile with the current user's ID to prevent cross-user caching issues.
   */
  const cacheUserProfile = (profile) => {
    const userInfo = cognitoAuth.getCurrentUser();
    const cacheData = {
      profile,
      userId: userInfo?.sub,
      cachedAt: Date.now()
    };
    localStorage.setItem('user_profile', JSON.stringify(profile));
    localStorage.setItem('profile_user_id', userInfo?.sub || '');
    localStorage.setItem('profile_check_time', Date.now().toString());
  };
  
  const processCallback = async () => {
    try {
      // Check if we have tokens in the URL
      const hasTokens = window.location.hash.includes('id_token') && 
                        window.location.hash.includes('access_token');
      
      if (!hasTokens) {
        console.warn('No tokens found in URL');
        setStatus('error');
        setMessage('No authentication tokens found. Redirecting...');
        setTimeout(() => navigate('/'), 2000);
        return;
      }
      
      // Handle the callback (stores tokens)
      const success = handleCallback();
      
      if (success) {
        setStatus('checking');
        setMessage('Checking your profile...');
        
        // Clear any stale profile cache from previous user
        clearProfileCache();
        
        // Give a moment for auth state to fully propagate
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Try to check if user already has a profile in DynamoDB
        try {
          console.log('Checking for existing profile...');
          const existingProfile = await apiClient.profile.get();
          
          if (existingProfile && existingProfile.birth_date) {
            // Profile exists - cache it and go to chat
            console.log('Existing profile found:', existingProfile);
            cacheUserProfile(existingProfile);
            
            setStatus('success');
            setMessage('Welcome back! Redirecting to chat...');
            setTimeout(() => navigate('/chat'), 1000);
            return;
          } else {
            // Profile response exists but incomplete - go to onboarding
            console.log('Profile incomplete (no birth_date) - redirecting to onboarding');
            clearProfileCache();
            setStatus('success');
            setMessage('Let\'s complete your profile...');
            setTimeout(() => navigate('/onboarding'), 1000);
            return;
          }
        } catch (profileError) {
          // 404 means no profile exists - new user, go to onboarding
          if (profileError.status === 404) {
            console.log('No profile found (404) - new user, redirecting to onboarding');
            clearProfileCache();
            setStatus('success');
            setMessage('Welcome! Let\'s set up your profile...');
            setTimeout(() => navigate('/onboarding'), 1000);
            return;
          }
          
          // For other errors (500, network issues), still go to onboarding
          // Onboarding will try to check again and handle gracefully
          console.warn('Could not check profile (API error):', profileError);
          console.log('Redirecting to onboarding - will check profile again there');
          clearProfileCache();
          setStatus('success');
          setMessage('Setting up your experience...');
          setTimeout(() => navigate('/onboarding'), 1000);
          return;
        }
        
      } else {
        setStatus('error');
        setMessage('Failed to process authentication. Redirecting...');
        setTimeout(() => navigate('/'), 2000);
      }
    } catch (error) {
      console.error('Error in callback:', error);
      setStatus('error');
      setMessage('An error occurred during authentication. Redirecting...');
      setTimeout(() => navigate('/'), 2000);
    }
  };
  
  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center px-6">
      {/* Background elements */}
      <StarField count={20} className="opacity-30" />
      <GradientOrb className="top-[-150px] right-[-150px]" size={400} />
      <GradientOrb className="bottom-[-200px] left-[-150px]" size={350} />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center max-w-md"
      >
        {/* Status Icon */}
        <div className="mb-8">
          {(status === 'processing' || status === 'checking') && (
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-celestial/20 blur-2xl scale-150 animate-pulse-soft" />
              <div className="relative p-6 rounded-full border border-border bg-card/50">
                <Loader2 className="w-10 h-10 text-celestial animate-spin" />
              </div>
            </div>
          )}
          {status === 'success' && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative inline-block"
            >
              <div className="absolute inset-0 bg-celestial/20 blur-2xl scale-150" />
              <div className="relative p-6 rounded-full border border-celestial/50 bg-celestial/10">
                <Check className="w-10 h-10 text-celestial" />
              </div>
            </motion.div>
          )}
          {status === 'error' && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative inline-block"
            >
              <div className="absolute inset-0 bg-destructive/20 blur-2xl scale-150" />
              <div className="relative p-6 rounded-full border border-destructive/50 bg-destructive/10">
                <X className="w-10 h-10 text-destructive" />
              </div>
            </motion.div>
          )}
        </div>
        
        {/* Status Message */}
        <h2 className="font-display text-2xl text-foreground mb-3">
          {status === 'processing' && 'Authenticating...'}
          {status === 'checking' && 'Checking Profile...'}
          {status === 'success' && 'Success!'}
          {status === 'error' && 'Authentication Failed'}
        </h2>
        
        <p className="text-muted-foreground">
          {message}
        </p>
        
        {/* Loading Dots */}
        {(status === 'processing' || status === 'checking') && (
          <div className="flex justify-center gap-2 mt-8">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-celestial rounded-full"
                animate={{
                  y: [0, -8, 0],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 0.8,
                  delay: i * 0.15,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        )}
        
        {/* Logo */}
        <div className="mt-12 flex items-center justify-center gap-2 text-muted-foreground/50">
          <MiraLogo size={20} />
          <span className="text-sm">MIRA</span>
        </div>
      </motion.div>
    </div>
  );
}
