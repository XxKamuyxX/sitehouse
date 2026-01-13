import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { LogIn, UserPlus } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, userMetadata } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      // Redirect based on role - will be handled after auth state updates
      // Navigation will happen in useEffect after userMetadata loads
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-navy flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block bg-white rounded-full p-4 mb-4">
            <img src="/logo.png" alt="Gestor Vitreo" className="h-16 w-auto mx-auto" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-white mb-2">Gestor Vitreo</h1>
          <p className="text-navy-300">Sistema de Gestão</p>
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

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
            />

            <Input
              label="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={loading}
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
                >
                  <UserPlus className="w-5 h-5" />
                  Criar Conta Grátis
                </Button>
              </Link>
            </div>
          </form>
        </Card>

        <p className="text-center text-navy-300 text-sm mt-6">
          © 2024 Gestor Vitreo. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}




