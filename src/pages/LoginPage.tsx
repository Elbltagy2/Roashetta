import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Stethoscope, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const LoginPage: React.FC = () => {
  const { t, language, setLanguage, direction } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        toast({
          title: language === 'ar' ? 'تم تسجيل الدخول بنجاح' : 'Login successful',
        });
        navigate('/dashboard');
      } else {
        toast({
          title: language === 'ar' ? 'خطأ في تسجيل الدخول' : 'Login failed',
          variant: 'destructive',
        });
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
        {/* Left Side - Form */}
        <div className="flex-1 flex flex-col justify-center px-6 lg:px-16 py-12">
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
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'نظام إدارة العيادة' : 'Clinic Management System'}
                </p>
              </div>
            </div>

            {/* Welcome Text */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-foreground">{t('auth.welcomeBack')}</h2>
              <p className="text-muted-foreground mt-2">{t('auth.loginSubtitle')}</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <div className="relative">
                  <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@clinic.com"
                    className="ps-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <div className="relative">
                  <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="ps-10 pe-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? t('common.loading') : t('auth.login')}
              </Button>
            </form>

            <p className="text-center mt-6 text-muted-foreground">
              {t('auth.noAccount')}{' '}
              <Link to="/signup" className="text-primary font-semibold hover:underline">
                {t('auth.signup')}
              </Link>
            </p>

            {/* Hint */}
            <div className="mt-8 p-4 bg-muted rounded-xl">
              <p className="text-sm text-muted-foreground text-center">
                {language === 'ar'
                  ? 'أدخل بيانات حسابك للدخول'
                  : 'Enter your account credentials to login'}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Right Side - Decorative */}
        <div className="hidden lg:flex flex-1 gradient-primary items-center justify-center p-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-center text-primary-foreground max-w-md"
          >
            <Stethoscope className="w-24 h-24 mx-auto mb-8 opacity-90" />
            <h2 className="text-3xl font-bold mb-4">
              {language === 'ar' ? 'أدر عيادتك بسهولة' : 'Manage Your Clinic Easily'}
            </h2>
            <p className="text-lg opacity-80">
              {language === 'ar'
                ? 'نظام متكامل لإدارة المرضى والوصفات الطبية'
                : 'Complete system for managing patients and prescriptions'}
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
