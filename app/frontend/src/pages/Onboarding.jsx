import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiClient } from '@/api/apiClient';
import { cognitoAuth } from '@/services/cognitoAuth';
import { createPageUrl } from '../utils';
import ProfileForm from '../components/onboarding/ProfileForm';
import { toast } from 'sonner';
import { 
  StarField, 
  GradientOrb, 
  CrescentMoon,
  OrbitRings,
  MiraLogo,
  SparkleIcon
} from '@/components/ui/celestial-icons';

export default function Onboarding() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Check if cached profile belongs to current user and is valid
   */
  const isValidCachedProfile = () => {
    try {
      const cachedProfile = localStorage.getItem('user_profile');
      const profileCheckTime = localStorage.getItem('profile_check_time');
      const cachedUserId = localStorage.getItem('profile_user_id');
      const currentUser = cognitoAuth.getCurrentUser();
      
      if (!cachedProfile || !profileCheckTime) return null;
      
      // Check if cache belongs to current user
      if (cachedUserId && currentUser?.sub && cachedUserId !== currentUser.sub) {
        console.log('Cache belongs to different user - clearing');
        clearProfileCache();
        return null;
      }
      
      // Check if cache is still valid (5 minutes)
      const fiveMinutes = 5 * 60 * 1000;
      const timeSinceCheck = Date.now() - parseInt(profileCheckTime);
      if (timeSinceCheck >= fiveMinutes) {
        console.log('Cache expired');
        return null;
      }
      
      const profile = JSON.parse(cachedProfile);
      if (profile?.birth_date) {
        return profile;
      }
      
      return null;
    } catch (e) {
      console.error('Error checking cached profile:', e);
      clearProfileCache();
      return null;
    }
  };
  
  /**
   * Clear profile cache
   */
  const clearProfileCache = () => {
    localStorage.removeItem('user_profile');
    localStorage.removeItem('profile_check_time');
    localStorage.removeItem('profile_user_id');
  };
  
  /**
   * Cache user profile with user ID
   */
  const cacheUserProfile = (profile) => {
    const currentUser = cognitoAuth.getCurrentUser();
    localStorage.setItem('user_profile', JSON.stringify(profile));
    localStorage.setItem('profile_check_time', Date.now().toString());
    localStorage.setItem('profile_user_id', currentUser?.sub || '');
  };

  useEffect(() => {
    // First check if user is authenticated
    if (!cognitoAuth.isAuthenticated()) {
      window.location.href = '/';
      return;
    }
    
    // Check valid cached profile for current user
    const cachedProfile = isValidCachedProfile();
    if (cachedProfile) {
      console.log('Valid cached profile found - redirecting to chat');
      window.location.href = createPageUrl('Chat');
      return;
    }
    
    // Check with API
    const checkUser = async () => {
      try {
        const currentUser = cognitoAuth.getCurrentUser();
        if (!currentUser) {
          window.location.href = '/';
          return;
        }
        setUser(currentUser);

        // Check if profile exists in DynamoDB
        console.log('Checking for existing profile in database...');
        try {
          const existingProfile = await apiClient.profile.get();
          
          if (existingProfile?.birth_date) {
            // Profile exists in DynamoDB - cache and redirect to chat
            console.log('Profile found in database:', existingProfile);
            cacheUserProfile(existingProfile);
            
            toast.success('Welcome back!', {
              description: `Zodiac: ${existingProfile.zodiac_sign || 'Unknown'}`,
              duration: 2000,
            });
            
            setTimeout(() => {
              window.location.href = createPageUrl('Chat');
            }, 1000);
            return;
          } else {
            // Profile exists but incomplete
            console.log('Profile incomplete - showing form');
            clearProfileCache();
          }
        } catch (profileError) {
          if (profileError.status === 404) {
            // No profile exists - this is expected for new users, show the form
            console.log('No profile in database (404) - showing form for new user');
            clearProfileCache();
          } else {
            // Other errors (500, network) - log but continue with form
            console.warn('Error checking profile (will show form):', profileError);
            clearProfileCache();
          }
        }
      } catch (error) {
        console.error('Error in onboarding setup:', error);
        if (!cognitoAuth.isAuthenticated()) {
          window.location.href = '/';
          return;
        }
        setUser(cognitoAuth.getCurrentUser() || { email: 'user@example.com' });
      } finally {
        setLoading(false);
      }
    };
    
    checkUser();
  }, []);

  const handleSubmit = async (profileData) => {
    try {
      const response = await apiClient.profile.create(profileData);
      
      // Cache the profile in localStorage with user ID
      if (response.profile) {
        cacheUserProfile(response.profile);
      }
      
      // Show success message
      toast.success('Profile created successfully!', {
        description: `Welcome to MIRA! Zodiac sign: ${response.profile?.zodiac_sign || 'Unknown'}`,
        duration: 3000,
      });

      // Redirect to chat
      setTimeout(() => {
        window.location.href = createPageUrl('Chat');
      }, 1500);
      
    } catch (error) {
      console.error('Error creating profile:', error);
      
      // Parse error message
      let errorMessage = 'Failed to create profile. Please try again.';
      let errorDetails = '';
      
      if (error.message === 'Failed to fetch') {
        errorMessage = 'Cannot connect to server';
        errorDetails = 'Please check your internet connection';
      } else if (error.status === 401) {
        errorMessage = 'Session expired';
        errorDetails = 'Please log in again';
      } else if (error.data?.error) {
        errorMessage = error.data.error.message || errorMessage;
        if (error.data.error.details) {
          const { field, reason } = error.data.error.details;
          errorDetails = field && reason ? `${field}: ${reason}` : reason || '';
        }
      }

      toast.error(errorMessage, {
        description: errorDetails,
        duration: 5000,
      });

      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-border border-t-celestial animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background elements */}
      <StarField count={25} className="opacity-30" />
      <GradientOrb className="top-[-150px] right-[-150px]" size={400} />
      <GradientOrb className="bottom-[-200px] left-[-150px]" size={350} />
      
      {/* Decorative orbit rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
        <OrbitRings size={600} className="text-foreground animate-orbit-slow" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="w-full px-6 md:px-12 py-6">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <MiraLogo size={32} className="text-foreground" />
            <span className="font-display text-lg tracking-wide text-foreground">MIRA</span>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 md:px-6 py-8 md:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-2xl"
          >
            {/* Header */}
            <div className="text-center mb-8 md:mb-10">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex items-center justify-center gap-3 mb-4"
              >
                <CrescentMoon size={28} className="text-celestial" />
                <h1 className="font-display text-3xl md:text-4xl text-foreground">
                  Welcome to MIRA
                </h1>
                <SparkleIcon size={28} className="text-celestial" />
              </motion.div>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-muted-foreground text-base md:text-lg max-w-lg mx-auto"
              >
                Let's map your cosmic journey. Share your birth details to unlock personalized insights.
              </motion.p>
            </div>

            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <ProfileForm onSubmit={handleSubmit} user={user} />
            </motion.div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
