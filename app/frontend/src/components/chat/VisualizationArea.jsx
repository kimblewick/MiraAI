import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, Minimize2, ExternalLink, Loader2, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ZodiacWheel, StarField, CelestialDivider } from '@/components/ui/celestial-icons';

export default function VisualizationArea({ chartUrl }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleRetry = () => {
    setIsLoading(true);
    setHasError(false);
    // Force re-render by appending timestamp
    const img = document.querySelector('.chart-image');
    if (img) {
      img.src = chartUrl + '?t=' + Date.now();
    }
  };

  // No chart available - show placeholder
  if (!chartUrl) {
    return (
      <div className="hidden lg:flex w-80 xl:w-96 bg-card/30 backdrop-blur-sm border-l border-border flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ZodiacWheel size={20} className="text-celestial" />
            <h3 className="font-display text-foreground">Birth Chart</h3>
          </div>
        </div>
        
        {/* Placeholder content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center relative">
          <StarField count={15} className="opacity-15" />
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10"
          >
            <div className="w-24 h-24 rounded-full bg-secondary/50 border border-border flex items-center justify-center mb-5">
              <ZodiacWheel size={40} className="text-muted-foreground/30" />
            </div>
            <h4 className="font-display text-foreground mb-2">Your Birth Chart</h4>
            <p className="text-muted-foreground/60 text-sm max-w-[200px]">
              Send a message to MIRA and your personalized astrology chart will appear here.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Expanded overlay */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
            onClick={() => setIsExpanded(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-card rounded-2xl border border-border shadow-2xl overflow-hidden max-w-4xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <ZodiacWheel size={20} className="text-celestial" />
                  <h3 className="font-display text-foreground">Your Natal Chart</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => setIsExpanded(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Chart */}
              <div className="p-4 bg-white">
                <object
                  data={chartUrl}
                  type="image/svg+xml"
                  className="w-full h-[70vh] max-h-[600px]"
                >
                  <img
                    src={chartUrl}
                    alt="Astrology Birth Chart"
                    className="w-full h-full object-contain"
                  />
                </object>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chart panel */}
      <div className="hidden lg:flex w-80 xl:w-96 bg-card/30 backdrop-blur-sm border-l border-border flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ZodiacWheel size={20} className="text-celestial" />
            <h3 className="font-display text-foreground">Birth Chart</h3>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary"
              onClick={() => setIsExpanded(true)}
              title="Expand chart"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary"
              onClick={() => window.open(chartUrl, '_blank')}
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Chart content */}
        <div className="flex-1 overflow-auto scrollbar-thin p-4">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-white rounded-xl border border-border overflow-hidden"
          >
            {/* Loading state */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-celestial animate-spin" />
                  <span className="text-muted-foreground text-sm">Loading chart...</span>
                </div>
              </div>
            )}
            
            {/* Error state */}
            {hasError && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                <div className="flex flex-col items-center gap-3 p-4 text-center">
                  <ZodiacWheel size={32} className="text-muted-foreground/30" />
                  <p className="text-muted-foreground text-sm">Failed to load chart</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={handleRetry}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </div>
            )}
            
            {/* Chart image */}
            <img
              src={chartUrl}
              alt="Astrology Birth Chart"
              className={cn(
                "chart-image w-full h-auto cursor-pointer transition-opacity",
                isLoading && "opacity-0",
                hasError && "opacity-30"
              )}
              onClick={() => setIsExpanded(true)}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          </motion.div>
          
          {/* Chart info */}
          <div className="mt-4">
            <CelestialDivider className="mb-4" />
            <div className="p-4 bg-secondary/30 rounded-xl border border-border">
              <h4 className="font-display text-foreground text-sm mb-1">Your Natal Chart</h4>
              <p className="text-muted-foreground/70 text-xs leading-relaxed">
                This chart shows the positions of celestial bodies at the moment of your birth.
                Click the chart to view it in full size.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
