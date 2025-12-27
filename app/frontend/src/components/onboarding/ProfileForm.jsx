import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar as CalendarIcon, ArrowRight, AlertCircle, MapPin, Clock } from 'lucide-react';
import { format, isAfter, isBefore } from 'date-fns';
import { ZodiacWheel, CelestialDivider } from '@/components/ui/celestial-icons';

const countries = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 
  'Italy', 'Spain', 'Japan', 'China', 'India', 'Brazil', 'Mexico', 'South Korea',
  'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Switzerland', 'Austria',
  'Belgium', 'Portugal', 'Greece', 'Russia', 'Argentina', 'Chile', 'Colombia', 'Other'
];

export default function ProfileForm({ onSubmit, user, initialData = null }) {
  const [formData, setFormData] = useState({
    first_name: initialData?.first_name || '',
    last_name: initialData?.last_name || '',
    birth_date: initialData?.birth_date ? new Date(initialData.birth_date) : null,
    birth_time: initialData?.birth_time || '',
    birth_country: initialData?.birth_country || '',
    birth_city: initialData?.birth_city || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Validation functions
  const validateForm = () => {
    const newErrors = {};

    // Validate first name
    if (!formData.first_name || formData.first_name.trim().length === 0) {
      newErrors.first_name = 'First name is required';
    } else if (formData.first_name.trim().length < 2) {
      newErrors.first_name = 'First name must be at least 2 characters';
    }

    // Validate last name
    if (!formData.last_name || formData.last_name.trim().length === 0) {
      newErrors.last_name = 'Last name is required';
    } else if (formData.last_name.trim().length < 2) {
      newErrors.last_name = 'Last name must be at least 2 characters';
    }

    // Validate birth date
    if (!formData.birth_date) {
      newErrors.birth_date = 'Birth date is required';
    } else {
      const today = new Date();
      const hundredYearsAgo = new Date();
      hundredYearsAgo.setFullYear(today.getFullYear() - 120);
      
      if (isAfter(formData.birth_date, today)) {
        newErrors.birth_date = 'Birth date cannot be in the future';
      } else if (isBefore(formData.birth_date, hundredYearsAgo)) {
        newErrors.birth_date = 'Birth date seems too far in the past';
      }
    }

    // Validate birth time (REQUIRED by backend)
    if (!formData.birth_time || formData.birth_time.trim().length === 0) {
      newErrors.birth_time = 'Birth time is required';
    } else {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(formData.birth_time)) {
        newErrors.birth_time = 'Please enter a valid time (HH:MM)';
      }
    }

    // Validate birth location
    if (!formData.birth_city || formData.birth_city.trim().length === 0) {
      newErrors.birth_city = 'Birth city is required';
    } else if (formData.birth_city.trim().length < 2) {
      newErrors.birth_city = 'Birth city must be at least 2 characters';
    }

    if (!formData.birth_country) {
      newErrors.birth_country = 'Birth country is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field) => {
    setTouched({ ...touched, [field]: true });
    validateForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({
      first_name: true,
      last_name: true,
      birth_date: true,
      birth_time: true,
      birth_city: true,
      birth_country: true
    });

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Prepare data for backend (all fields are required by backend validator)
      const profileData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        birth_date: format(formData.birth_date, 'yyyy-MM-dd'),
        birth_time: formData.birth_time.trim(), // Required by backend
        birth_location: `${formData.birth_city.trim()}, ${formData.birth_country}`,
        birth_country: formData.birth_country.trim()
      };

      await onSubmit(profileData);
    } catch (err) {
      // Error will be handled by parent component
      setIsSubmitting(false);
      throw err;
    }
  };

  const inputBaseStyles = "bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground/50 focus:border-celestial focus:ring-1 focus:ring-celestial/30 transition-all duration-200";
  const inputErrorStyles = "border-destructive/60 focus:border-destructive focus:ring-destructive/30";

  return (
    <Card className="w-full bg-card/80 backdrop-blur-sm border border-border/60 shadow-xl">
      <CardHeader className="border-b border-border/50 pb-6 px-6 md:px-8 pt-6 md:pt-8">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-secondary/50 border border-border/50">
            <ZodiacWheel size={28} className="text-celestial" />
          </div>
          <div className="flex-1">
            <CardTitle className="font-display text-2xl md:text-3xl text-foreground">
              Your Cosmic Profile
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-1.5">
              Enter your birth details to unlock personalized astrology insights
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="px-6 md:px-8 py-6 md:py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* First Name */}
          <div className="space-y-2">
            <Label htmlFor="first_name" className="text-foreground font-medium flex items-center gap-2 text-sm">
              First Name
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="first_name"
              type="text"
              value={formData.first_name}
              onChange={(e) => {
                setFormData({ ...formData, first_name: e.target.value });
                setTouched({ ...touched, first_name: true });
              }}
              onBlur={() => handleBlur('first_name')}
              className={`h-11 ${inputBaseStyles} ${
                touched.first_name && errors.first_name ? inputErrorStyles : ''
              }`}
              placeholder="e.g., John"
              required
            />
            {touched.first_name && errors.first_name && (
              <motion.p 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-destructive text-sm flex items-center gap-1.5"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.first_name}
              </motion.p>
            )}
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <Label htmlFor="last_name" className="text-foreground font-medium flex items-center gap-2 text-sm">
              Last Name
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="last_name"
              type="text"
              value={formData.last_name}
              onChange={(e) => {
                setFormData({ ...formData, last_name: e.target.value });
                setTouched({ ...touched, last_name: true });
              }}
              onBlur={() => handleBlur('last_name')}
              className={`h-11 ${inputBaseStyles} ${
                touched.last_name && errors.last_name ? inputErrorStyles : ''
              }`}
              placeholder="e.g., Doe"
              required
            />
            {touched.last_name && errors.last_name && (
              <motion.p 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-destructive text-sm flex items-center gap-1.5"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.last_name}
              </motion.p>
            )}
          </div>

          <CelestialDivider className="py-2" />

          {/* Birth date */}
          <div className="space-y-2">
            <Label className="text-foreground font-medium flex items-center gap-2 text-sm">
              <CalendarIcon className="w-4 h-4 text-celestial" />
              Birth Date
              <span className="text-destructive">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={`w-full justify-start text-left font-normal h-11 ${inputBaseStyles} ${
                    touched.birth_date && errors.birth_date ? inputErrorStyles : ''
                  }`}
                  onBlur={() => handleBlur('birth_date')}
                >
                  <CalendarIcon className="mr-3 h-4 w-4 text-muted-foreground" />
                  {formData.birth_date ? (
                    <span className="text-foreground">{format(formData.birth_date, 'PPP')}</span>
                  ) : (
                    <span className="text-muted-foreground">Select your date of birth</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-card border-border">
                <Calendar
                  mode="single"
                  selected={formData.birth_date}
                  onSelect={(date) => {
                    setFormData({ ...formData, birth_date: date });
                    setTouched({ ...touched, birth_date: true });
                  }}
                  initialFocus
                  captionLayout="dropdown-buttons"
                  fromYear={1900}
                  toYear={new Date().getFullYear()}
                />
              </PopoverContent>
            </Popover>
            {touched.birth_date && errors.birth_date && (
              <motion.p 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-destructive text-sm flex items-center gap-1.5"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.birth_date}
              </motion.p>
            )}
          </div>

          {/* Birth time */}
          <div className="space-y-2">
            <Label htmlFor="birth_time" className="text-foreground font-medium flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-celestial" />
              Birth Time
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="birth_time"
              type="time"
              value={formData.birth_time}
              onChange={(e) => {
                setFormData({ ...formData, birth_time: e.target.value });
                setTouched({ ...touched, birth_time: true });
              }}
              onBlur={() => handleBlur('birth_time')}
              className={`h-11 ${inputBaseStyles} ${
                touched.birth_time && errors.birth_time ? inputErrorStyles : ''
              }`}
              placeholder="14:30"
              required
            />
            {touched.birth_time && errors.birth_time && (
              <motion.p 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-destructive text-sm flex items-center gap-1.5"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.birth_time}
              </motion.p>
            )}
            <p className="text-muted-foreground/70 text-xs">
              Required for accurate birth chart and personalized astrology insights
            </p>
          </div>

          <CelestialDivider className="py-2" />

          {/* Birth place */}
          <div className="space-y-4">
            <Label className="text-foreground font-medium flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-celestial" />
              Birth Location
              <span className="text-destructive">*</span>
            </Label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birth_city" className="text-muted-foreground text-xs font-normal">
                  City
                </Label>
                <Input
                  id="birth_city"
                  value={formData.birth_city}
                  onChange={(e) => {
                    setFormData({ ...formData, birth_city: e.target.value });
                    setTouched({ ...touched, birth_city: true });
                  }}
                  onBlur={() => handleBlur('birth_city')}
                  className={`h-11 ${inputBaseStyles} ${
                    touched.birth_city && errors.birth_city ? inputErrorStyles : ''
                  }`}
                  placeholder="e.g., New York"
                />
                {touched.birth_city && errors.birth_city && (
                  <motion.p 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-destructive text-sm flex items-center gap-1.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.birth_city}
                  </motion.p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="birth_country" className="text-muted-foreground text-xs font-normal">
                  Country
                </Label>
                <Select
                  value={formData.birth_country}
                  onValueChange={(value) => {
                    setFormData({ ...formData, birth_country: value });
                    setTouched({ ...touched, birth_country: true });
                  }}
                >
                  <SelectTrigger 
                    id="birth_country"
                    className={`h-11 ${inputBaseStyles} ${
                      touched.birth_country && errors.birth_country ? inputErrorStyles : ''
                    }`}
                    onBlur={() => handleBlur('birth_country')}
                  >
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border max-h-[200px]">
                    {countries.map((country) => (
                      <SelectItem 
                        key={country} 
                        value={country} 
                        className="text-foreground hover:bg-secondary focus:bg-secondary"
                      >
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {touched.birth_country && errors.birth_country && (
                  <motion.p 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-destructive text-sm flex items-center gap-1.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.birth_country}
                  </motion.p>
                )}
              </div>
            </div>
          </div>

          {/* Info box */}
          <Alert className="bg-secondary/30 border-border/50">
            <ZodiacWheel size={18} className="text-celestial" />
            <AlertDescription className="text-muted-foreground text-sm ml-2">
              Your birth details help us create a personalized astrological profile and provide accurate cosmic insights.
            </AlertDescription>
          </Alert>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-foreground text-background hover:bg-foreground/90 h-12 text-base rounded-xl font-medium shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border-2 border-background/30 border-t-background animate-spin" />
                <span>Creating your profile...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>Continue to MIRA</span>
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </div>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
