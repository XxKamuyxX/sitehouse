import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Plus, Mail, Trash2, X, Eye, EyeOff, Edit, Lock, Unlock, MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { doc, updateDoc, deleteDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { queryWithCompanyId } from '../lib/queries';
import { db, firebaseConfig } from '../lib/firebase';
import { UserRole } from '../contexts/AuthContext';
import { initializeApp, getApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

interface TeamMember {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  active?: boolean;
  phone?: string;
  createdAt?: any;
}

export function TeamManagement() {
  const { userMetadata } = useAuth();
  const companyId = userMetadata?.companyId;
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [newMember, setNewMember] = useState({
    email: '',
    password: '',
    name: '',
    role: 'technician' as UserRole,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  // Real-time listener for team members
  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = queryWithCompanyId('users', companyId);
    
    // Use onSnapshot for real-time updates
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const membersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as TeamMember[];
        setMembers(membersData);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading team members:', error);
        alert('Erro ao carregar membros da equipe');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [companyId]);

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return '??';
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-700';
      case 'technician':
        return 'bg-blue-100 text-blue-700';
      case 'sales':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'technician':
        return 'Técnico';
      case 'sales':
        return 'Vendedor';
      default:
        return 'Membro';
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyId) {
      alert('Erro: Empresa não identificada. Por favor, recarregue a página.');
      return;
    }
    
    if (!newMember.email || !newMember.password || !newMember.name) {
      alert('Preencha nome, email e senha');
      return;
    }

    setSaving(true);
    let secondaryApp;

    try {
      // 1. Create a Secondary App Instance (The "Robot")
      // This prevents the Admin from being logged out
      const appName = 'SecondaryApp';
      try {
        secondaryApp = getApp(appName);
      } catch (e) {
        secondaryApp = initializeApp(firebaseConfig, appName);
      }

      const secondaryAuth = getAuth(secondaryApp);

      // 2. Create User in Firebase Auth using Secondary App
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        newMember.email,
        newMember.password
      );
      const { user } = userCredential;

      // 3. Force Logout the new user immediately (so the secondary app doesn't hold session)
      await signOut(secondaryAuth);

      // 4. Write Data to Firestore (Using the MAIN app instance db)
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid, // Critical: This links Auth to Firestore
        name: newMember.name,
        email: newMember.email,
        role: newMember.role,
        active: true,
        companyId: companyId, // Link to company
        createdAt: serverTimestamp(),
      });

      // 5. Success - Modal will close and list will update via onSnapshot
      alert('Membro adicionado com sucesso!');
      setShowAddModal(false);
      setNewMember({ email: '', password: '', name: '', role: 'technician' });
      setShowPassword(false);
      // No need to call loadMembers() - onSnapshot will update automatically
    } catch (error: any) {
      console.error('Error adding member:', error);
      
      // Map Firebase errors to friendly Portuguese messages
      let errorMessage = 'Erro ao adicionar membro.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este e-mail já está em uso.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'O endereço de e-mail é inválido.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'A senha é muito fraca. Use pelo menos 6 caracteres.';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Operação não permitida. Entre em contato com o suporte.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      // 6. Destroy Secondary App
      if (secondaryApp) {
        try {
          await deleteApp(secondaryApp);
        } catch (deleteError) {
          console.error('Error deleting secondary app:', deleteError);
          // Non-critical error, continue
        }
      }
      setSaving(false);
    }
  };

  const handleEditMember = (member: TeamMember) => {
    setEditingMember(member);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingMember || !editingMember.name) {
      alert('Nome é obrigatório');
      return;
    }

    try {
      await updateDoc(doc(db, 'users', editingMember.id), {
        name: editingMember.name,
        role: editingMember.role,
      });
      alert('Membro atualizado com sucesso!');
      setShowEditModal(false);
      setEditingMember(null);
      // No need to call loadMembers() - onSnapshot will update automatically
    } catch (error) {
      console.error('Error updating member:', error);
      alert('Erro ao atualizar membro');
    }
  };

  const handleToggleActive = async (memberId: string, currentActive: boolean) => {
    if (!confirm(`Deseja ${currentActive ? 'bloquear' : 'desbloquear'} este membro?`)) {
      return;
    }

    try {
      await updateDoc(doc(db, 'users', memberId), {
        active: !currentActive,
      });
      // No need to call loadMembers() - onSnapshot will update automatically
      alert(`Membro ${!currentActive ? 'desbloqueado' : 'bloqueado'} com sucesso!`);
    } catch (error) {
      console.error('Error toggling member status:', error);
      alert('Erro ao alterar status do membro');
    }
  };

  const handleDeleteMember = async (memberId: string, memberEmail: string) => {
    if (!confirm(`Tem certeza que deseja excluir o membro ${memberEmail}? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', memberId));
      // No need to call loadMembers() - onSnapshot will update automatically
      alert('Membro excluído com sucesso!');
    } catch (error) {
      console.error('Error deleting member:', error);
      alert('Erro ao excluir membro');
    }
  };

  const handleWhatsApp = (phone?: string) => {
    if (!phone) {
      alert('Telefone não cadastrado para este membro');
      return;
    }
    // Clean phone number: remove all non-numeric characters
    const cleanPhone = phone.replace(/\D/g, '');
    // Open WhatsApp with the phone number
    window.open(`https://wa.me/55${cleanPhone}`, '_blank');
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

        {/* Members Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => {
            const isActive = member.active !== false;
            return (
              <Card key={member.id} className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-navy text-white flex items-center justify-center font-bold text-sm">
                      {getInitials(member.name, member.email)}
                    </div>
                    <h3 className="font-bold text-navy">
                      {member.name || member.email}
                    </h3>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                    {getRoleLabel(member.role)}
                  </span>
                </div>

                {/* Body */}
                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isActive ? (
                      <>
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-xs text-green-700 font-medium">Ativo</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span className="text-xs text-red-700 font-medium">Bloqueado</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Footer - Action Bar */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-200">
                  <button
                    onClick={() => handleWhatsApp(member.phone)}
                    className="p-2 rounded-lg hover:bg-green-50 transition-colors"
                    title="Abrir WhatsApp"
                    disabled={!member.phone}
                  >
                    <MessageCircle className={`w-4 h-4 ${member.phone ? 'text-green-600' : 'text-slate-300'}`} />
                  </button>
                  <button
                    onClick={() => handleEditMember(member)}
                    className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                    title="Editar membro"
                  >
                    <Edit className="w-4 h-4 text-slate-600" />
                  </button>
                  <button
                    onClick={() => handleToggleActive(member.id, isActive)}
                    className={`p-2 rounded-lg transition-colors ${
                      isActive
                        ? 'hover:bg-red-50'
                        : 'hover:bg-green-50'
                    }`}
                    title={isActive ? 'Bloquear membro' : 'Desbloquear membro'}
                  >
                    {isActive ? (
                      <Lock className="w-4 h-4 text-red-600" />
                    ) : (
                      <Unlock className="w-4 h-4 text-green-600" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteMember(member.id, member.email)}
                    className="p-2 rounded-lg hover:bg-red-50 transition-colors ml-auto"
                    title="Excluir membro"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Add Member Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-navy">Adicionar Novo Membro</h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewMember({ email: '', password: '', name: '', role: 'technician' });
                    setShowPassword(false);
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddMember} className="space-y-4">
                <Input
                  label="Nome"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  placeholder="Nome completo"
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  required
                  placeholder="membro@email.com"
                />
                <div className="relative">
                  <Input
                    label="Senha"
                    type={showPassword ? 'text' : 'password'}
                    value={newMember.password}
                    onChange={(e) => setNewMember({ ...newMember, password: e.target.value })}
                    required
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <Select
                  label="Função"
                  value={newMember.role}
                  onChange={(e) => setNewMember({ ...newMember, role: e.target.value as UserRole })}
                  options={[
                    { value: 'admin', label: 'Administrador' },
                    { value: 'technician', label: 'Técnico/Instalador' },
                    { value: 'sales', label: 'Vendedor' },
                  ]}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddModal(false);
                      setNewMember({ email: '', password: '', name: '', role: 'technician' });
                      setShowPassword(false);
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1"
                    disabled={saving}
                  >
                    {saving ? 'Salvando...' : 'Adicionar'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Edit Member Modal */}
        {showEditModal && editingMember && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-navy">Editar Membro</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingMember(null);
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <Input
                  label="Nome"
                  value={editingMember.name || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                  placeholder="Nome completo"
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editingMember.email}
                    disabled
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">O email não pode ser alterado</p>
                </div>
                <Select
                  label="Função"
                  value={editingMember.role}
                  onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value as UserRole })}
                  options={[
                    { value: 'admin', label: 'Administrador' },
                    { value: 'technician', label: 'Técnico/Instalador' },
                    { value: 'sales', label: 'Vendedor' },
                  ]}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingMember(null);
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleSaveEdit}
                    className="flex-1"
                  >
                    Salvar
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
