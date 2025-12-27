import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiClient } from '@/api/apiClient';
import { cognitoAuth } from '@/services/cognitoAuth';
import { createPageUrl } from '../utils';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
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

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Cache user profile with user ID
   */
  const cacheUserProfile = (profileData) => {
    const currentUser = cognitoAuth.getCurrentUser();
    localStorage.setItem('user_profile', JSON.stringify(profileData));
    localStorage.setItem('profile_check_time', Date.now().toString());
    localStorage.setItem('profile_user_id', currentUser?.sub || '');
  };
  
  /**
   * Check if cached profile belongs to current user
   */
  const getValidCachedProfile = () => {
    try {
      const cachedProfile = localStorage.getItem('user_profile');
      const cachedUserId = localStorage.getItem('profile_user_id');
      const currentUser = cognitoAuth.getCurrentUser();
      
      if (!cachedProfile) return null;
      
      // Check if cache belongs to current user
      if (cachedUserId && currentUser?.sub && cachedUserId !== currentUser.sub) {
        console.log('Cache belongs to different user');
        return null;
      }
      
      return JSON.parse(cachedProfile);
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    // First check if user is authenticated
    if (!cognitoAuth.isAuthenticated()) {
      console.warn('User not authenticated, redirecting to login');
      window.location.href = '/';
      return;
    }

    const init = async () => {
      // Get user info from Cognito tokens
      const currentUser = cognitoAuth.getCurrentUser();
      setUser(currentUser || { email: 'user@example.com' });

      try {
        // Try to get profile from API
        console.log('Fetching profile from API...');
        const existingProfile = await apiClient.profile.get();
        
        if (existingProfile && existingProfile.birth_date) {
          // Transform backend format to form format
          setProfile({
            first_name: existingProfile.first_name || '',
            last_name: existingProfile.last_name || '',
            birth_date: existingProfile.birth_date,
            birth_time: existingProfile.birth_time,
            birth_city: existingProfile.birth_location?.split(',')[0]?.trim() || '',
            birth_country: existingProfile.birth_country,
            zodiac_sign: existingProfile.zodiac_sign
          });
          
          // Cache the profile with user ID
          cacheUserProfile(existingProfile);
          console.log('Profile loaded and cached');
        }
      } catch (error) {
        // If 404, no profile exists yet - that's fine
        if (error.status === 404) {
          console.log('No profile found - user can create one');
        } else {
          // 500 or other errors - try to use cached data if valid
          console.warn('Could not fetch profile:', error);
          const cachedProfile = getValidCachedProfile();
          if (cachedProfile) {
            setProfile({
              first_name: cachedProfile.first_name || '',
              last_name: cachedProfile.last_name || '',
              birth_date: cachedProfile.birth_date,
              birth_time: cachedProfile.birth_time,
              birth_city: cachedProfile.birth_location?.split(',')[0]?.trim() || '',
              birth_country: cachedProfile.birth_country,
              zodiac_sign: cachedProfile.zodiac_sign
            });
            console.log('Using cached profile data');
          }
        }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleSubmit = async (profileData) => {
    try {
      let savedProfile;
      
      if (profile) {
        // Update existing profile
        const response = await apiClient.profile.update(profileData);
        savedProfile = response.profile || response;
        toast.success('Profile updated successfully!');
      } else {
        // Create new profile
        const response = await apiClient.profile.create(profileData);
        savedProfile = response.profile;
        toast.success('Profile created successfully!', {
          description: `Zodiac sign: ${savedProfile?.zodiac_sign || 'Unknown'}`,
        });
      }
      
      // Cache the updated profile
      if (savedProfile) {
        cacheUserProfile(savedProfile);
      }
      
      // Redirect to chat
      setTimeout(() => {
        window.location.href = createPageUrl('Chat');
      }, 1500);
    } catch (error) {
      console.error('Error saving profile:', error);
      
      // Parse error response
      let errorMessage = 'Failed to save profile. Please try again.';
      try {
        if (error.message) {
          const errorData = JSON.parse(error.message);
          if (errorData.error) {
            errorMessage = errorData.error.message || errorMessage;
          }
        }
      } catch (parseError) {
        // Use default error message
      }

      toast.error('Failed to save profile', {
        description: errorMessage,
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
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MiraLogo size={32} className="text-foreground" />
              <span className="font-display text-lg tracking-wide text-foreground">MIRA</span>
            </div>
            
            <Link to={createPageUrl('Chat')}>
              <Button 
                variant="ghost" 
                className="text-muted-foreground hover:text-foreground transition-colors gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Chat
              </Button>
            </Link>
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
                  Your Profile
                </h1>
                <SparkleIcon size={28} className="text-celestial" />
              </motion.div>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-muted-foreground text-base md:text-lg max-w-lg mx-auto"
              >
                Update your birth details to refine your cosmic insights
              </motion.p>
            </div>

            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <ProfileForm onSubmit={handleSubmit} user={user} initialData={profile} />
            </motion.div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
