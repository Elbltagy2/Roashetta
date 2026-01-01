import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Building2, Phone, MapPin, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { specialties } from '@/data/medicalData';
import { cn } from '@/lib/utils';

const SignupPage: React.FC = () => {
  const { t, language, setLanguage, direction } = useLanguage();
  const { signup } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    specialization: '',
    clinicName: '',
    clinicAddress: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: language === 'ar' ? 'كلمة المرور غير متطابقة' : 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const success = await signup(formData);
      if (success) {
        toast({
          title: language === 'ar' ? 'تم إنشاء الحساب بنجاح' : 'Account created successfully',
        });
        navigate('/dashboard');
      }
    } catch (error) {
      toast({
        title: language === 'ar' ? 'حدث خطأ' : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn('min-h-screen bg-background', direction === 'rtl' && 'rtl')}>
      <div className="flex min-h-screen">
        {/* Left Side - Decorative */}
        <div className="hidden lg:flex flex-1 gradient-primary items-center justify-center p-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-center text-primary-foreground max-w-md"
          >
            <Stethoscope className="w-24 h-24 mx-auto mb-8 opacity-90" />
            <h2 className="text-3xl font-bold mb-4">
              {language === 'ar' ? 'ابدأ رحلتك معنا' : 'Start Your Journey'}
            </h2>
            <p className="text-lg opacity-80">
              {language === 'ar'
                ? 'انضم إلى آلاف الأطباء الذين يستخدمون نظامنا'
                : 'Join thousands of doctors using our system'}
            </p>
          </motion.div>
        </div>

        {/* Right Side - Form */}
        <div className="flex-1 flex flex-col justify-center px-6 lg:px-16 py-12 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-md w-full mx-auto"
          >
            {/* Language Toggle */}
            <div className="flex justify-end mb-8">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              >
                {language === 'ar' ? 'English' : 'العربية'}
              </Button>
            </div>

            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                <Stethoscope className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {language === 'ar' ? 'عيادتي' : 'My Clinic'}
                </h1>
              </div>
            </div>

            {/* Welcome Text */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-foreground">{t('auth.createAccount')}</h2>
              <p className="text-muted-foreground mt-2">{t('auth.signupSubtitle')}</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('doctor.name')}</Label>
                  <div className="relative">
                    <User className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder={language === 'ar' ? 'د. أحمد محمد' : 'Dr. John Doe'}
                      className="ps-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialty">{t('doctor.specialty')}</Label>
                  <Select
                    value={formData.specialization}
                    onValueChange={(value) => handleChange('specialization', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('doctor.specialty')} />
                    </SelectTrigger>
                    <SelectContent>
                      {specialties.map((s) => (
                        <SelectItem key={s.en} value={language === 'ar' ? s.ar : s.en}>
                          {language === 'ar' ? s.ar : s.en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clinicName">{t('doctor.clinicName')}</Label>
                <div className="relative">
                  <Building2 className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="clinicName"
                    value={formData.clinicName}
                    onChange={(e) => handleChange('clinicName', e.target.value)}
                    placeholder={language === 'ar' ? 'عيادة الشفاء' : 'Healing Clinic'}
                    className="ps-10"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('doctor.phone')}</Label>
                  <div className="relative">
                    <Phone className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="01012345678"
                      className="ps-10"
                      dir="ltr"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clinicAddress">{language === 'ar' ? 'عنوان العيادة' : 'Clinic Address'}</Label>
                  <div className="relative">
                    <MapPin className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="clinicAddress"
                      value={formData.clinicAddress}
                      onChange={(e) => handleChange('clinicAddress', e.target.value)}
                      placeholder={language === 'ar' ? 'القاهرة، مصر' : 'Cairo, Egypt'}
                      className="ps-10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <div className="relative">
                  <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="doctor@clinic.com"
                    className="ps-10"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">{t('auth.password')}</Label>
                  <div className="relative">
                    <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      placeholder="••••••••"
                      className="ps-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
                  <div className="relative">
                    <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      placeholder="••••••••"
                      className="ps-10"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showPassword"
                  checked={showPassword}
                  onChange={() => setShowPassword(!showPassword)}
                  className="rounded"
                />
                <label htmlFor="showPassword" className="text-sm text-muted-foreground cursor-pointer">
                  {language === 'ar' ? 'إظهار كلمة المرور' : 'Show password'}
                </label>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? t('common.loading') : t('auth.signup')}
              </Button>
            </form>

            <p className="text-center mt-6 text-muted-foreground">
              {t('auth.hasAccount')}{' '}
              <Link to="/login" className="text-primary font-semibold hover:underline">
                {t('auth.login')}
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
