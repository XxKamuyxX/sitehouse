import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { LogIn } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block bg-white rounded-full p-4 mb-4">
            <img src="/logo.png" alt="House Manutenção" className="h-16 w-auto mx-auto" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-white mb-2">House Manutenção</h1>
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
          </form>
        </Card>

        <p className="text-center text-navy-300 text-sm mt-6">
          © 2024 House Manutenção. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}




