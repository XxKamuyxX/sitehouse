import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { UserPlus } from 'lucide-react';

export function SignUp() {
  const [formData, setFormData] = useState({
    companyName: '',
    ownerName: '',
    email: '',
    password: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!formData.companyName || !formData.ownerName || !formData.email || !formData.password || !formData.phone) {
      setError('Por favor, preencha todos os campos');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      await signUp(
        formData.email,
        formData.password,
        formData.companyName,
        formData.ownerName,
        formData.phone
      );
      // Redirect to dashboard - will be handled by RootRedirect
      navigate('/admin/dashboard');
    } catch (err: any) {
      console.error('Sign up error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Este email já está em uso. Tente fazer login.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Email inválido');
      } else if (err.code === 'auth/weak-password') {
        setError('A senha é muito fraca. Use pelo menos 6 caracteres.');
      } else {
        setError(err.message || 'Erro ao criar conta. Tente novamente.');
      }
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
            <img src="/logo.png" alt="Gestor Vitreo" className="h-16 w-auto mx-auto" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-white mb-2">Gestor Vitreo</h1>
          <p className="text-navy-300">Comece seu teste grátis de 14 dias</p>
        </div>

        {/* Sign Up Card */}
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-navy mb-6 text-center">Criar Conta</h2>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Input
              label="Nome da Empresa"
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              required
              placeholder="Minha Empresa"
            />

            <Input
              label="Seu Nome"
              type="text"
              value={formData.ownerName}
              onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
              required
              placeholder="João Silva"
            />

            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="seu@email.com"
            />

            <Input
              label="Telefone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              placeholder="(11) 99999-9999"
            />

            <Input
              label="Senha"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              placeholder="••••••••"
              minLength={6}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              <UserPlus className="w-5 h-5 inline mr-2" />
              {loading ? 'Criando conta...' : 'Criar Conta Grátis'}
            </Button>

            <p className="text-center text-sm text-slate-600 mt-4">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-navy font-medium hover:underline">
                Fazer login
              </Link>
            </p>
          </form>
        </Card>

        <p className="text-center text-navy-300 text-sm mt-6">
          Ao criar uma conta, você concorda com nossos termos de uso.
          <br />
          © 2024 Gestor Vitreo. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
