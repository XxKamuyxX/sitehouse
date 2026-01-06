import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Edit2, Crown, RefreshCw, Pause, Play, Trash2, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, setDoc, getDoc, Timestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { firebaseConfig } from '../lib/firebase';

interface CompanyOwner {
  id: string;
  email: string;
  name?: string;
  companyId: string;
  status?: 'active' | 'trial' | 'expired';
  expirationDate?: any;
  trialEndsAt?: any;
  isActive?: boolean;
  companyName?: string;
}

export function MasterDashboard() {
  const [owners, setOwners] = useState<CompanyOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingOwner, setEditingOwner] = useState<CompanyOwner | null>(null);
  const [renewingOwner, setRenewingOwner] = useState<CompanyOwner | null>(null);
  const [showNewCompanyModal, setShowNewCompanyModal] = useState(false);
  const [editForm, setEditForm] = useState({
    expirationDate: '',
    status: 'active' as 'active' | 'trial' | 'expired',
  });
  const [renewForm, setRenewForm] = useState({
    expirationDate: '',
  });
  const [newCompanyForm, setNewCompanyForm] = useState({
    companyName: '',
    ownerName: '',
    email: '',
    password: '',
    phone: '',
  });

  useEffect(() => {
    loadOwners();
  }, []);

  const loadOwners = async () => {
    try {
      setLoading(true);
      // Fetch all users with role === 'admin'
      const usersQuery = query(collection(db, 'users'), where('role', '==', 'admin'));
      const usersSnapshot = await getDocs(usersQuery);
      
      const ownersData: CompanyOwner[] = [];
      
      // For each admin user, fetch their company
      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        let companyName = 'N/A';
        
        if (userData.companyId) {
          try {
            const companyDoc = await getDoc(doc(db, 'companies', userData.companyId));
            if (companyDoc.exists()) {
              const companyData = companyDoc.data();
              companyName = companyData.name || 'N/A';
            }
          } catch (error) {
            console.error(`Error fetching company for ${userData.companyId}:`, error);
          }
        }
        
        ownersData.push({
          id: userDoc.id,
          email: userData.email || '',
          name: userData.name,
          companyId: userData.companyId || '',
          status: userData.status || userData.subscriptionStatus || 'trial',
          expirationDate: userData.expirationDate,
          trialEndsAt: userData.trialEndsAt,
          isActive: userData.isActive !== false, // Default to true if not set
          companyName,
        });
      }
      
      setOwners(ownersData);
    } catch (error) {
      console.error('Error loading owners:', error);
      alert('Erro ao carregar proprietários');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubscription = (owner: CompanyOwner) => {
    setEditingOwner(owner);
    // Format dates for input
    const expDate = owner.expirationDate?.toDate ? owner.expirationDate.toDate() : null;
    
    setEditForm({
      expirationDate: expDate ? expDate.toISOString().split('T')[0] : '',
      status: owner.status || 'active',
    });
  };

  const handleSaveSubscription = async () => {
    if (!editingOwner) return;
    
    try {
      const expirationTimestamp = editForm.expirationDate 
        ? Timestamp.fromDate(new Date(editForm.expirationDate))
        : null;
      
      await updateDoc(doc(db, 'users', editingOwner.id), {
        expirationDate: expirationTimestamp,
        status: editForm.status,
        updatedAt: Timestamp.now(),
      });
      
      alert('Assinatura atualizada com sucesso!');
      setEditingOwner(null);
      loadOwners();
    } catch (error) {
      console.error('Error updating subscription:', error);
      alert('Erro ao atualizar assinatura');
    }
  };

  const handleToggleAccess = async (owner: CompanyOwner) => {
    if (!confirm(`Tem certeza que deseja ${owner.isActive ? 'pausar' : 'ativar'} o acesso desta empresa?`)) {
      return;
    }
    
    try {
      const newStatus = owner.isActive ? 'paused' : 'active';
      await updateDoc(doc(db, 'users', owner.id), {
        isActive: !owner.isActive,
        status: newStatus,
        updatedAt: Timestamp.now(),
      });
      
      alert(`Acesso ${!owner.isActive ? 'ativado' : 'pausado'} com sucesso!`);
      loadOwners();
    } catch (error) {
      console.error('Error toggling access:', error);
      alert('Erro ao alterar acesso');
    }
  };

  const handleRenew = (owner: CompanyOwner) => {
    setRenewingOwner(owner);
    const expDate = owner.expirationDate?.toDate ? owner.expirationDate.toDate() : null;
    setRenewForm({
      expirationDate: expDate ? expDate.toISOString().split('T')[0] : '',
    });
  };

  const handleSaveRenewal = async () => {
    if (!renewingOwner || !renewForm.expirationDate) {
      alert('Por favor, selecione uma data de expiração');
      return;
    }
    
    try {
      const expirationTimestamp = Timestamp.fromDate(new Date(renewForm.expirationDate));
      
      await updateDoc(doc(db, 'users', renewingOwner.id), {
        expirationDate: expirationTimestamp,
        subscriptionStatus: 'active',
        status: 'active',
        updatedAt: Timestamp.now(),
      });
      
      alert('Assinatura renovada com sucesso!');
      setRenewingOwner(null);
      setRenewForm({ expirationDate: '' });
      loadOwners();
    } catch (error) {
      console.error('Error renewing subscription:', error);
      alert('Erro ao renovar assinatura');
    }
  };

  const handleDelete = async (owner: CompanyOwner) => {
    if (!confirm(`ATENÇÃO: Tem certeza que deseja EXCLUIR a empresa "${owner.companyName}" e o usuário "${owner.email}"?\n\nEsta ação não pode ser desfeita!`)) {
      return;
    }
    
    if (!confirm('Confirme novamente: Esta ação irá deletar permanentemente a empresa e todos os dados associados.')) {
      return;
    }
    
    try {
      // Delete user document
      await deleteDoc(doc(db, 'users', owner.id));
      
      // Delete company document if it exists
      if (owner.companyId) {
        try {
          await deleteDoc(doc(db, 'companies', owner.companyId));
        } catch (error) {
          console.error('Error deleting company:', error);
          // Continue even if company deletion fails
        }
      }
      
      alert('Empresa e usuário excluídos com sucesso!');
      loadOwners();
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Erro ao excluir empresa');
    }
  };

  const handleCreateNewCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCompanyForm.companyName || !newCompanyForm.ownerName || !newCompanyForm.email || !newCompanyForm.password) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      // Generate unique companyId
      const slug = newCompanyForm.companyName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const randomSuffix = Math.random().toString(36).substring(2, 10);
      const companyId = `${slug}-${randomSuffix}`;

      // 1. Create a temporary 'secondary' app
      const secondaryAppName = "SecondaryApp";
      let secondaryApp = getApps().find(app => app.name === secondaryAppName);
      
      if (!secondaryApp) {
        secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
      }
      
      const secondaryAuth = getAuth(secondaryApp);

      // 2. Create user on the SECONDARY auth (does not affect main session)
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        newCompanyForm.email,
        newCompanyForm.password
      );
      const newUser = userCredential.user;

      // 3. Create the user document in Firestore
      const trialEndsAt = Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000));
      await setDoc(doc(db, 'users', newUser.uid), {
        email: newCompanyForm.email,
        companyId: companyId,
        role: 'admin',
        name: newCompanyForm.ownerName,
        subscriptionStatus: 'trial',
        trialEndsAt,
        isActive: true,
        createdAt: Timestamp.now(),
      });

      // 4. Create company document
      await setDoc(doc(db, 'companies', companyId), {
        name: newCompanyForm.companyName,
        phone: newCompanyForm.phone,
        email: newCompanyForm.email,
        address: '',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // 5. Sign out the secondary user immediately
      await signOut(secondaryAuth);
      
      alert('Empresa criada com sucesso!');
      setShowNewCompanyModal(false);
      setNewCompanyForm({ companyName: '', ownerName: '', email: '', password: '', phone: '' });
      loadOwners();
    } catch (error: any) {
      console.error('Error creating company:', error);
      if (error.code === 'auth/email-already-in-use') {
        alert('Este email já está em uso.');
      } else {
        alert(error.message || 'Erro ao criar empresa');
      }
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    try {
      const d = date.toDate ? date.toDate() : new Date(date);
      return d.toLocaleDateString('pt-BR');
    } catch {
      return 'N/A';
    }
  };

  const getStatusBadge = (status?: string) => {
    const statusMap = {
      active: { label: 'Ativo', color: 'bg-green-100 text-green-800' },
      trial: { label: 'Trial', color: 'bg-blue-100 text-blue-800' },
      expired: { label: 'Expirado', color: 'bg-red-100 text-red-800' },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.trial;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-gold" />
            <div>
              <h1 className="text-3xl font-bold text-navy">Gestão SaaS</h1>
              <p className="text-slate-600 mt-1">Gerencie assinaturas e acessos das empresas</p>
            </div>
          </div>
          <Button
            variant="primary"
            onClick={() => setShowNewCompanyModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nova Empresa
          </Button>
        </div>

        {/* Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Empresa</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Email do Proprietário</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Trial Termina Em</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Acesso</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {owners.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500">
                      Nenhum proprietário encontrado
                    </td>
                  </tr>
                ) : (
                  owners.map((owner) => (
                    <tr key={owner.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-navy">{owner.companyName || 'N/A'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-700">{owner.email}</div>
                        {owner.name && (
                          <div className="text-sm text-slate-500">{owner.name}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(owner.status)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-700">{formatDate(owner.trialEndsAt || owner.expirationDate)}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          owner.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {owner.isActive ? 'Ativo' : 'Bloqueado'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRenew(owner)}
                            className="flex items-center gap-1"
                            title="Renovar Assinatura"
                          >
                            <RefreshCw className="w-4 h-4" />
                            Renovar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditSubscription(owner)}
                            className="flex items-center gap-1"
                            title="Editar Assinatura"
                          >
                            <Edit2 className="w-4 h-4" />
                            Editar
                          </Button>
                          <Button
                            variant={owner.isActive ? "outline" : "primary"}
                            size="sm"
                            onClick={() => handleToggleAccess(owner)}
                            className="flex items-center gap-1"
                            title={owner.isActive ? "Pausar Acesso" : "Ativar Acesso"}
                          >
                            {owner.isActive ? (
                              <>
                                <Pause className="w-4 h-4" />
                                Pausar
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4" />
                                Ativar
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(owner)}
                            className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Excluir Empresa"
                          >
                            <Trash2 className="w-4 h-4" />
                            Excluir
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Edit Subscription Modal */}
        {editingOwner && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full">
              <h2 className="text-xl font-bold text-navy mb-4">Editar Assinatura</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-600 mb-2">
                    <strong>Empresa:</strong> {editingOwner.companyName || 'N/A'}
                  </p>
                  <p className="text-sm text-slate-600 mb-4">
                    <strong>Email:</strong> {editingOwner.email}
                  </p>
                </div>
                
                <Input
                  label="Data de Expiração"
                  type="date"
                  value={editForm.expirationDate}
                  onChange={(e) => setEditForm({ ...editForm, expirationDate: e.target.value })}
                />
                
                <Select
                  label="Status"
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as 'active' | 'trial' | 'expired' })}
                  options={[
                    { value: 'active', label: 'Ativo' },
                    { value: 'trial', label: 'Trial' },
                    { value: 'expired', label: 'Expirado' },
                  ]}
                />
                
                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingOwner(null)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleSaveSubscription}
                    className="flex-1"
                  >
                    Salvar
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Renew Subscription Modal */}
        {renewingOwner && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full">
              <h2 className="text-xl font-bold text-navy mb-4">Renovar Assinatura</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-600 mb-2">
                    <strong>Empresa:</strong> {renewingOwner.companyName || 'N/A'}
                  </p>
                  <p className="text-sm text-slate-600 mb-4">
                    <strong>Email:</strong> {renewingOwner.email}
                  </p>
                </div>
                
                <Input
                  label="Nova Data de Expiração"
                  type="date"
                  value={renewForm.expirationDate}
                  onChange={(e) => setRenewForm({ ...renewForm, expirationDate: e.target.value })}
                  required
                />
                
                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setRenewingOwner(null);
                      setRenewForm({ expirationDate: '' });
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleSaveRenewal}
                    className="flex-1"
                  >
                    Renovar
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* New Company Modal */}
        {showNewCompanyModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-navy mb-4">Nova Empresa</h2>
              <form onSubmit={handleCreateNewCompany} className="space-y-4">
                <Input
                  label="Nome da Empresa"
                  type="text"
                  value={newCompanyForm.companyName}
                  onChange={(e) => setNewCompanyForm({ ...newCompanyForm, companyName: e.target.value })}
                  required
                  placeholder="Minha Empresa"
                />
                
                <Input
                  label="Nome do Proprietário"
                  type="text"
                  value={newCompanyForm.ownerName}
                  onChange={(e) => setNewCompanyForm({ ...newCompanyForm, ownerName: e.target.value })}
                  required
                  placeholder="João Silva"
                />
                
                <Input
                  label="Email"
                  type="email"
                  value={newCompanyForm.email}
                  onChange={(e) => setNewCompanyForm({ ...newCompanyForm, email: e.target.value })}
                  required
                  placeholder="proprietario@email.com"
                />
                
                <Input
                  label="Telefone"
                  type="tel"
                  value={newCompanyForm.phone}
                  onChange={(e) => setNewCompanyForm({ ...newCompanyForm, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
                
                <Input
                  label="Senha"
                  type="password"
                  value={newCompanyForm.password}
                  onChange={(e) => setNewCompanyForm({ ...newCompanyForm, password: e.target.value })}
                  required
                  placeholder="••••••••"
                  minLength={6}
                />
                
                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowNewCompanyModal(false);
                      setNewCompanyForm({ companyName: '', ownerName: '', email: '', password: '', phone: '' });
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1"
                  >
                    Criar Empresa
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
