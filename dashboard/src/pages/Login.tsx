import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { LogIn, UserPlus, X } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const { signIn, signInWithGoogle, resetPassword, userMetadata } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      // Navigation will happen in useEffect after userMetadata loads
    } catch (err: any) {
      let errorMessage = 'Erro ao fazer login. Verifique suas credenciais.';
      
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'Usuário não encontrado. Verifique o email.';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Senha incorreta. Tente novamente.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido. Verifique o formato.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Muitas tentativas. Tente novamente mais tarde.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      await signInWithGoogle();
      // Navigation will happen in useEffect after userMetadata loads
    } catch (err: any) {
      let errorMessage = 'Erro ao fazer login com Google.';
      
      if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Login cancelado.';
      } else if (err.code === 'auth/popup-blocked') {
        errorMessage = 'Popup bloqueado. Permita popups para este site.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      setError('Por favor, informe seu email.');
      return;
    }

    setError('');
    setResetLoading(true);

    try {
      await resetPassword(resetEmail);
      setResetSuccess(true);
    } catch (err: any) {
      let errorMessage = 'Erro ao enviar email de recuperação.';
      
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'Email não encontrado. Verifique o endereço.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido. Verifique o formato.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setResetLoading(false);
    }
  };

  // Redirect after login based on role
  useEffect(() => {
    if (userMetadata) {
      if (userMetadata.role === 'master') {
        navigate('/master');
      } else if (userMetadata.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (userMetadata.role === 'technician') {
        navigate('/tech/dashboard');
      } else {
        navigate('/dashboard'); // Fallback for legacy users
      }
    }
  }, [userMetadata, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-navy-700 to-navy-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo - Optimized without white container */}
        <div className="text-center mb-8">
          <div className="mb-4 flex justify-center">
            <img 
              src="/logo.png" 
              alt="Gestor Vitreo" 
              className="h-20 w-auto mx-auto"
              width={80}
              height={80}
              style={{ mixBlendMode: 'normal' }}
            />
          </div>
          <h1 className="text-3xl font-serif font-bold text-white mb-2">Gestor Vitreo</h1>
          <p className="text-navy-200">Sistema de Gestão</p>
        </div>

        {/* Login Card */}
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-navy mb-6 text-center">Login</h2>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Google Sign In Button */}
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
              className="w-full flex items-center justify-center gap-3 bg-white border-slate-300 hover:bg-slate-50 shadow-sm"
            >
              {googleLoading ? (
                <div className="w-5 h-5 border-2 border-slate-300 border-t-navy rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              Continuar com Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">ou</span>
              </div>
            </div>

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
              disabled={loading || googleLoading}
            />

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700">Senha</label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-blue-600 hover:underline cursor-pointer"
                >
                  Esqueci minha senha
                </button>
              </div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                disabled={loading || googleLoading}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={loading || googleLoading}
            >
              <LogIn className="w-5 h-5 inline mr-2" />
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>

            <div className="pt-4 border-t border-slate-200">
              <p className="text-center text-sm text-slate-600 mb-3">
                Não tem uma conta?
              </p>
              <Link to="/signup">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full flex items-center justify-center gap-2"
                  disabled={loading || googleLoading}
                >
                  <UserPlus className="w-5 h-5" />
                  Criar Conta Grátis
                </Button>
              </Link>
            </div>
          </form>
        </Card>

        <p className="text-center text-navy-200 text-sm mt-6">
          © 2024 Gestor Vitreo. Todos os direitos reservados.
        </p>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-navy">Recuperar Senha</h2>
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetEmail('');
                  setResetSuccess(false);
                  setError('');
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {resetSuccess ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                  Email de recuperação enviado! Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
                </div>
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetEmail('');
                    setResetSuccess(false);
                  }}
                  className="w-full"
                >
                  Fechar
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-sm text-slate-600 mb-4">
                  Digite seu email e enviaremos um link para redefinir sua senha.
                </p>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <Input
                  label="Email"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  placeholder="seu@email.com"
                  disabled={resetLoading}
                  autoFocus
                />

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetEmail('');
                      setError('');
                    }}
                    className="flex-1"
                    disabled={resetLoading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1"
                    disabled={resetLoading}
                  >
                    {resetLoading ? 'Enviando...' : 'Enviar Link de Recuperação'}
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
