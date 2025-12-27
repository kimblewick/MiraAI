import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { 
  StarField, 
  GradientOrb, 
  CrescentMoon, 
  OrbitRings,
  ZodiacWheel,
  CelestialDivider,
  MiraLogo
} from '@/components/ui/celestial-icons';

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated, login, user } = useAuth();
  
  // If user is already authenticated, redirect to onboarding
  useEffect(() => {
    if (isAuthenticated) {
      console.log('User already authenticated, redirecting to onboarding...');
      navigate('/onboarding');
    }
  }, [isAuthenticated, navigate]);

  const handleSignIn = () => {
    // Redirect to Cognito Hosted UI for login
    login();
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  const featureVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        delay: 0.8 + i * 0.1,
        ease: [0.25, 0.1, 0.25, 1],
      },
    }),
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background elements */}
      <StarField count={40} className="opacity-40" />
      <GradientOrb className="top-[-200px] left-[-200px]" size={600} />
      <GradientOrb className="bottom-[-300px] right-[-200px]" size={500} />
      
      {/* Decorative orbit rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30 pointer-events-none">
        <OrbitRings size={800} className="text-foreground animate-orbit-slow" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="w-full px-6 md:px-12 py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center gap-3"
            >
              <MiraLogo size={36} className="text-foreground" />
              <span className="font-display text-xl tracking-wide text-foreground">MIRA</span>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Button
                onClick={handleSignIn}
                variant="ghost"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign In
              </Button>
            </motion.div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 flex items-center justify-center px-6 md:px-12 py-12 md:py-20">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-4xl mx-auto text-center"
          >
            {/* Logo/Icon */}
            <motion.div variants={itemVariants} className="mb-8 md:mb-12 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-celestial/20 blur-3xl scale-150 animate-pulse-soft" />
                <div className="relative p-6 md:p-8 rounded-full border border-border/50 bg-card/50 backdrop-blur-sm celestial-glow">
                  <CrescentMoon size={48} className="text-celestial md:w-16 md:h-16" />
                </div>
              </div>
            </motion.div>

            {/* Main heading */}
            <motion.h1 
              variants={itemVariants}
              className="font-display text-5xl md:text-7xl lg:text-8xl font-medium tracking-tight mb-4 md:mb-6"
            >
              <span className="text-gradient-celestial">MIRA</span>
            </motion.h1>
            
            <motion.p 
              variants={itemVariants}
              className="text-lg md:text-xl text-muted-foreground mb-4 tracking-wide"
            >
              Your Cosmic Companion
            </motion.p>

            {/* Description */}
            <motion.p 
              variants={itemVariants}
              className="text-base md:text-lg text-muted-foreground/80 max-w-2xl mx-auto mb-10 md:mb-14 leading-relaxed px-4"
            >
              Discover the wisdom of the stars. MIRA is your personal astrology AI,
              ready to guide you through birth charts, cosmic compatibility, and the
              mysteries of the zodiac.
            </motion.p>

            {/* CTA Button */}
            <motion.div variants={itemVariants}>
              <Button
                onClick={handleSignIn}
                size="lg"
                className="group bg-foreground text-background hover:bg-foreground/90 px-8 md:px-12 py-6 md:py-7 text-base md:text-lg rounded-full shadow-lg transition-all duration-300 hover:shadow-xl"
              >
                Begin Your Journey
                <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </motion.div>

            {/* Divider */}
            <motion.div variants={itemVariants} className="mt-16 md:mt-24 mb-12 md:mb-16">
              <CelestialDivider />
            </motion.div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto px-4">
              {[
                {
                  icon: CrescentMoon,
                  title: "Birth Charts",
                  description: "Explore your unique cosmic blueprint and celestial influences"
                },
                {
                  icon: ZodiacWheel,
                  title: "Compatibility",
                  description: "Discover cosmic connections and relationship dynamics"
                },
                {
                  icon: MiraLogo,
                  title: "Daily Guidance",
                  description: "Receive personalized insights and cosmic wisdom"
                }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  custom={index}
                  variants={featureVariants}
                  initial="hidden"
                  animate="visible"
                  className="group p-6 md:p-8 rounded-2xl bg-card/30 backdrop-blur-sm border border-border/50 transition-all duration-300 hover:bg-card/50 hover:border-border"
                >
                  <div className="w-12 h-12 mb-5 flex items-center justify-center rounded-full bg-muted/50 group-hover:bg-celestial/10 transition-colors">
                    <feature.icon size={24} className="text-celestial" />
                  </div>
                  <h3 className="font-display text-lg md:text-xl text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="px-6 md:px-12 py-8">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-sm text-muted-foreground/50">
              Crafted with celestial precision
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
