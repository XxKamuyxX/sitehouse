import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Plus, Mail, Shield, UserCog } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useCompanyId, queryWithCompanyId } from '../lib/queries';

interface TeamMember {
  id: string;
  email: string;
  role: 'admin' | 'tech';
  name?: string;
  createdAt?: any;
}

export function TeamManagement() {
  const { createUser } = useAuth();
  const companyId = useCompanyId();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMember, setNewMember] = useState({
    email: '',
    password: '',
    name: '',
    role: 'tech' as 'admin' | 'tech',
  });

  useEffect(() => {
    loadMembers();
  }, [companyId]);

  const loadMembers = async () => {
    try {
      const q = queryWithCompanyId('users', companyId);
      const snapshot = await getDocs(q);
      const membersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as TeamMember[];
      setMembers(membersData);
    } catch (error) {
      console.error('Error loading team members:', error);
      alert('Erro ao carregar membros da equipe');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMember.email || !newMember.password) {
      alert('Preencha email e senha');
      return;
    }

    try {
      await createUser(
        newMember.email,
        newMember.password,
        companyId,
        newMember.role,
        newMember.name || undefined
      );
      alert('Membro adicionado com sucesso!');
      setShowAddModal(false);
      setNewMember({ email: '', password: '', name: '', role: 'tech' });
      loadMembers();
    } catch (error: any) {
      console.error('Error adding member:', error);
      alert(error.message || 'Erro ao adicionar membro');
    }
  };

  if (loading) {
    return (
      <Layout>
        <Card>
          <p className="text-center text-slate-600 py-8">Carregando...</p>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-navy">Gestão de Equipe</h1>
            <p className="text-slate-600 mt-1">Gerencie os membros da sua equipe</p>
          </div>
          <Button
            variant="primary"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Adicionar Membro
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => (
            <Card key={member.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {member.role === 'admin' ? (
                      <Shield className="w-5 h-5 text-amber-600" />
                    ) : (
                      <UserCog className="w-5 h-5 text-blue-600" />
                    )}
                    <h3 className="font-bold text-navy">
                      {member.name || member.email}
                    </h3>
                  </div>
                  <div className="text-sm text-slate-600 space-y-1">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{member.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-slate-100 rounded text-xs">
                        {member.role === 'admin' ? 'Administrador' : 'Técnico'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full">
              <h2 className="text-xl font-bold text-navy mb-4">Adicionar Novo Membro</h2>
              <form onSubmit={handleAddMember} className="space-y-4">
                <Input
                  label="Nome (Opcional)"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  placeholder="Nome completo"
                />
                <Input
                  label="Email"
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  required
                  placeholder="membro@email.com"
                />
                <Input
                  label="Senha"
                  type="password"
                  value={newMember.password}
                  onChange={(e) => setNewMember({ ...newMember, password: e.target.value })}
                  required
                  placeholder="••••••••"
                />
                <Select
                  label="Função"
                  value={newMember.role}
                  onChange={(e) => setNewMember({ ...newMember, role: e.target.value as 'admin' | 'tech' })}
                  options={[
                    { value: 'admin', label: 'Administrador' },
                    { value: 'tech', label: 'Técnico/Instalador' },
                  ]}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1"
                  >
                    Adicionar
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
