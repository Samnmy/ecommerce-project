import { useState } from 'react';
import { Disc, Eye, EyeOff, Mail, Lock, User as UserIcon, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/hooks/useAuth';
import { registerUser, loginWithGoogle } from '@/lib/authService';
import type { RegisterFormData } from '@/types/auth';

interface RegisterPageProps {
  onNavigateToLogin: () => void;
  onRegisterSuccess: () => void;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

// Password strength checker
function getPasswordStrength(password: string): { level: number; label: string; color: string } {
  if (!password) return { level: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { level: 1, label: 'Débil', color: 'bg-red-500' };
  if (score <= 2) return { level: 2, label: 'Regular', color: 'bg-orange-400' };
  if (score <= 3) return { level: 3, label: 'Buena', color: 'bg-yellow-400' };
  return { level: 4, label: 'Fuerte', color: 'bg-green-500' };
}

export function RegisterPage({ onNavigateToLogin, onRegisterSuccess }: RegisterPageProps) {
  const { setUser } = useAuth();

  const [formData, setFormData] = useState<RegisterFormData>({
    name: '', email: '', password: '', confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const passwordStrength = getPasswordStrength(formData.password);

  // ─── Validation ──────────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) newErrors.name = 'El nombre es obligatorio';
    else if (formData.name.trim().length < 2) newErrors.name = 'Mínimo 2 caracteres';

    if (!formData.email) newErrors.email = 'El email es obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = 'Formato de email inválido';

    if (!formData.password) newErrors.password = 'La contraseña es obligatoria';
    else if (formData.password.length < 6) newErrors.password = 'Mínimo 6 caracteres';

    if (!formData.confirmPassword) newErrors.confirmPassword = 'Confirma tu contraseña';
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = 'Las contraseñas no coinciden';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Local register ───────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    setServerError('');
    try {
      const user = await registerUser(formData);
      setUser(user);
      onRegisterSuccess();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string }; status?: number }; message?: string; code?: string };
      const backendMsg = axiosErr?.response?.data?.message;
      const status = axiosErr?.response?.status;
      const networkMsg = axiosErr?.message;
      const code = axiosErr?.code;
      if (backendMsg) {
        setServerError(`Error ${status}: ${backendMsg}`);
      } else if (code === 'ERR_NETWORK' || networkMsg?.includes('Network Error')) {
        setServerError('❌ No se pudo conectar al servidor. Verifica que el backend esté activo y que VITE_API_URL esté configurado en Vercel.');
      } else if (networkMsg?.includes('CORS') || networkMsg?.includes('cors')) {
        setServerError('❌ Error de CORS: el backend no permite peticiones desde este dominio. Configura CORS_ORIGINS en Railway.');
      } else {
        setServerError(`Error al crear la cuenta: ${networkMsg || 'Inténtalo de nuevo.'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Google register/login ────────────────────────────────────
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsGoogleLoading(true);
      setServerError('');
      try {
        const user = await loginWithGoogle(tokenResponse.access_token);
        setUser(user);
        onRegisterSuccess();
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string }; status?: number }; message?: string; code?: string };
        const backendMsg = axiosErr?.response?.data?.message;
        const status = axiosErr?.response?.status;
        const networkMsg = axiosErr?.message;
        const code = axiosErr?.code;
        if (backendMsg) {
          setServerError(`Error ${status}: ${backendMsg}`);
        } else if (code === 'ERR_NETWORK' || networkMsg?.includes('Network Error')) {
          setServerError('❌ No se pudo conectar al servidor. Verifica que el backend esté activo y que VITE_API_URL esté configurado en Vercel.');
        } else {
          setServerError(`Error con Google: ${networkMsg || 'Inténtalo de nuevo.'}`);
        }
      } finally {
        setIsGoogleLoading(false);
      }
    },
    onError: () => setServerError('Cancelaste el registro con Google.'),
  });

  const updateField = (field: keyof RegisterFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  return (
    <div className="min-h-screen bg-[#1a1510] flex items-center justify-center px-4 py-12">
      {/* Animated bg */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-600/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500 mb-4 shadow-lg shadow-amber-500/25">
            <Disc className="w-9 h-9 text-[#1a1510] animate-spin" style={{ animationDuration: '8s' }} />
          </div>
          <h1 className="text-3xl font-bold text-amber-100">The Wizard's <span className="text-amber-500">Lair</span></h1>
          <p className="text-amber-100/50 mt-1 text-sm">Crea tu cuenta gratuita</p>
        </div>

        {/* Card */}
        <div className="bg-[#1e1a13] border border-amber-900/30 rounded-2xl p-8 shadow-2xl">
          {serverError && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-6">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{serverError}</p>
            </div>
          )}

          {/* Google Button */}
          <button
            id="btn-google-register"
            onClick={() => handleGoogleLogin()}
            disabled={isGoogleLoading || isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-xl transition-all duration-200 hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed mb-6"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Continuar con Google
          </button>

          {/* Divider */}
          <div className="relative flex items-center mb-6">
            <div className="flex-grow border-t border-amber-900/30" />
            <span className="mx-3 text-amber-100/30 text-xs font-medium">O con tu email</span>
            <div className="flex-grow border-t border-amber-900/30" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Name */}
            <div>
              <label htmlFor="reg-name" className="block text-sm font-medium text-amber-100/70 mb-1.5">
                Nombre completo
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-100/40" />
                <input
                  id="reg-name"
                  type="text"
                  autoComplete="name"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Tu nombre"
                  className={`w-full pl-10 pr-4 py-3 bg-amber-900/10 border rounded-xl text-amber-100 placeholder:text-amber-100/30 focus:outline-none focus:ring-2 transition-all ${
                    errors.name
                      ? 'border-red-500/50 focus:ring-red-500/20'
                      : 'border-amber-900/30 focus:ring-amber-500/20 focus:border-amber-500/50'
                  }`}
                />
              </div>
              {errors.name && <p className="mt-1.5 text-xs text-red-400">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-amber-100/70 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-100/40" />
                <input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="tu@email.com"
                  className={`w-full pl-10 pr-4 py-3 bg-amber-900/10 border rounded-xl text-amber-100 placeholder:text-amber-100/30 focus:outline-none focus:ring-2 transition-all ${
                    errors.email
                      ? 'border-red-500/50 focus:ring-red-500/20'
                      : 'border-amber-900/30 focus:ring-amber-500/20 focus:border-amber-500/50'
                  }`}
                />
              </div>
              {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium text-amber-100/70 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-100/40" />
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className={`w-full pl-10 pr-10 py-3 bg-amber-900/10 border rounded-xl text-amber-100 placeholder:text-amber-100/30 focus:outline-none focus:ring-2 transition-all ${
                    errors.password
                      ? 'border-red-500/50 focus:ring-red-500/20'
                      : 'border-amber-900/30 focus:ring-amber-500/20 focus:border-amber-500/50'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-100/40 hover:text-amber-100/70 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-red-400">{errors.password}</p>}
              {/* Password strength */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          i <= passwordStrength.level ? passwordStrength.color : 'bg-amber-900/20'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs mt-1 text-amber-100/50">
                    Seguridad: <span className="font-medium">{passwordStrength.label}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="reg-confirm" className="block text-sm font-medium text-amber-100/70 mb-1.5">
                Confirmar contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-100/40" />
                <input
                  id="reg-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  placeholder="Repite tu contraseña"
                  className={`w-full pl-10 pr-10 py-3 bg-amber-900/10 border rounded-xl text-amber-100 placeholder:text-amber-100/30 focus:outline-none focus:ring-2 transition-all ${
                    errors.confirmPassword
                      ? 'border-red-500/50 focus:ring-red-500/20'
                      : formData.confirmPassword && formData.password === formData.confirmPassword
                        ? 'border-green-500/50 focus:ring-green-500/20'
                        : 'border-amber-900/30 focus:ring-amber-500/20 focus:border-amber-500/50'
                  }`}
                />
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                )}
                {!(formData.confirmPassword && formData.password === formData.confirmPassword) && (
                  <button
                    type="button"
                    onClick={() => setShowConfirm(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-100/40 hover:text-amber-100/70 transition-colors"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-red-400">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit */}
            <button
              id="btn-register-submit"
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full bg-amber-500 hover:bg-amber-400 text-[#1a1510] font-bold py-3 px-4 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/25 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                'Crear cuenta'
              )}
            </button>
          </form>

          {/* Login link */}
          <p className="text-center text-sm text-amber-100/50 mt-6">
            ¿Ya tienes cuenta?{' '}
            <button
              id="btn-go-to-login"
              onClick={onNavigateToLogin}
              className="text-amber-500 hover:text-amber-400 font-medium transition-colors"
            >
              Inicia sesión
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
