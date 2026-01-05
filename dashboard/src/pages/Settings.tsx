import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Save, Database } from 'lucide-react';
import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { queryWithCompanyId } from '../lib/queries';
import { useAuth } from '../contexts/AuthContext';

interface ServiceConfig {
  id: string;
  name: string;
  description: string;
  type: 'unit' | 'meter' | 'package';
  defaultPrice: number;
}

interface PDFConfig {
  companyName: string;
  address: string;
  city: string;
  phone: string;
  email: string;
}

export function Settings() {
  const { userMetadata } = useAuth();
  const companyId = userMetadata?.companyId;
  const [pdfConfig, setPdfConfig] = useState<PDFConfig>({
    companyName: 'House Manutenção',
    address: 'Rua Rio Grande do Norte, 726, Savassi',
    city: 'Belo Horizonte - MG',
    phone: '(31) 98279-8513',
    email: 'contato@housemanutencao.com.br',
  });
  const [migrating, setMigrating] = useState(false);

  const [services, setServices] = useState<ServiceConfig[]>([
    {
      id: 'troca-roldanas',
      name: 'Troca de Roldanas',
      description: 'Substituição por roldanas premium',
      type: 'unit',
      defaultPrice: 50,
    },
    {
      id: 'vedacao',
      name: 'Vedação',
      description: 'Substituição da vedação',
      type: 'unit',
      defaultPrice: 35,
    },
    {
      id: 'higienizacao',
      name: 'Higienização',
      description: 'Limpeza profunda e higienização completa',
      type: 'unit',
      defaultPrice: 200,
    },
    {
      id: 'limpeza',
      name: 'Limpeza',
      description: 'Limpeza profissional dos vidros e trilhos',
      type: 'unit',
      defaultPrice: 150,
    },
    {
      id: 'blindagem',
      name: 'Blindagem',
      description: 'Blindagem nos trilhos para proteção',
      type: 'unit',
      defaultPrice: 100,
    },
    {
      id: 'colagem-vidro',
      name: 'Colagem de Vidro',
      description: 'Colagem profissional de vidros soltos',
      type: 'unit',
      defaultPrice: 120,
    },
    {
      id: 'visita-tecnica',
      name: 'Visita Técnica/Diagnóstico',
      description: 'Diagnóstico completo do sistema',
      type: 'unit',
      defaultPrice: 150,
    },
  ]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'config'));
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        if (data.pdfConfig) setPdfConfig(data.pdfConfig);
        if (data.services) setServices(data.services);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePDFConfig = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'config'), {
        pdfConfig,
        services,
        updatedAt: new Date(),
      }, { merge: true });
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleServiceChange = (index: number, field: keyof ServiceConfig, value: any) => {
    const newServices = [...services];
    newServices[index] = { ...newServices[index], [field]: value };
    setServices(newServices);
  };

  const handleMigrateData = async () => {
    if (!companyId) {
      alert('Erro: companyId não encontrado');
      return;
    }

    if (!confirm(
      `Esta ação irá adicionar o companyId "${companyId}" a todos os documentos existentes que não possuem este campo.\n\n` +
      `Coleções afetadas:\n` +
      `- clients\n` +
      `- workOrders\n` +
      `- expenses\n` +
      `- quotes\n` +
      `- receipts\n\n` +
      `Deseja continuar?`
    )) {
      return;
    }

    setMigrating(true);
    let migratedCount = 0;
    let errorCount = 0;

    try {
      const collections = ['clients', 'workOrders', 'expenses', 'quotes', 'receipts'];
      
      for (const collectionName of collections) {
        try {
          // Try to read all documents - if rules block, try with companyId filter
          let snapshot;
          try {
            // First, try to read all documents (for documents without companyId)
            // This might fail if rules require companyId, so we'll catch and try alternative
            snapshot = await getDocs(collection(db, collectionName));
          } catch (readError: any) {
            // If reading all fails, try reading with companyId filter first
            // Then we'll need to handle documents without companyId differently
            console.warn(`Cannot read all ${collectionName} documents. Trying with companyId filter...`);
            try {
              const q = queryWithCompanyId(collectionName, companyId);
              snapshot = await getDocs(q);
              // If we can only read documents with companyId, skip migration for this collection
              console.log(`All documents in ${collectionName} already have companyId or cannot be accessed.`);
              continue;
            } catch (filterError) {
              console.error(`Cannot read ${collectionName} with companyId filter either:`, filterError);
              throw readError; // Re-throw original error
            }
          }
          
          const docsToUpdate = snapshot.docs.filter((docSnap) => {
            const data = docSnap.data();
            return !data.companyId || data.companyId !== companyId;
          });

          for (const docSnap of docsToUpdate) {
            try {
              // Use merge to preserve existing fields
              await updateDoc(doc(db, collectionName, docSnap.id), { 
                companyId 
              });
              migratedCount++;
            } catch (error: any) {
              console.error(`Error updating doc ${docSnap.id} in ${collectionName}:`, error);
              // If update fails due to permissions, the document might already have a different companyId
              // or the rules are blocking - log but continue
              errorCount++;
            }
          }

          if (docsToUpdate.length > 0) {
            console.log(`Migrated ${docsToUpdate.length} documents in ${collectionName}`);
          } else {
            console.log(`No documents to migrate in ${collectionName}`);
          }
        } catch (error: any) {
          console.error(`Error migrating ${collectionName}:`, error);
          // Don't increment errorCount here as it's a collection-level error
          // Individual document errors are already counted above
        }
      }

      if (migratedCount > 0) {
        alert(`Migração concluída!\n\nDocumentos migrados: ${migratedCount}\nErros: ${errorCount}`);
      } else if (errorCount > 0) {
        alert(
          `Migração não pôde ser concluída devido a erros de permissão.\n\n` +
          `Erros: ${errorCount}\n\n` +
          `Isso geralmente acontece quando as regras do Firestore bloqueiam a leitura de documentos sem companyId.\n\n` +
          `Solução:\n` +
          `1. Verifique o arquivo FIREBASE_RULES_MIGRATION.md para regras temporárias\n` +
          `2. Ou atualize as regras do Firestore para permitir leitura de documentos sem companyId temporariamente\n` +
          `3. Execute a migração novamente`
        );
      } else {
        alert('Nenhum documento precisa ser migrado. Todos os documentos já possuem companyId.');
      }
    } catch (error: any) {
      console.error('Error during migration:', error);
      const errorMessage = error?.message || 'Erro desconhecido';
      alert(
        `Erro durante a migração: ${errorMessage}\n\n` +
        `Se você está vendo erros de permissão, verifique o arquivo FIREBASE_RULES_MIGRATION.md ` +
        `para instruções sobre regras temporárias necessárias para a migração.`
      );
    } finally {
      setMigrating(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <Card>
          <p className="text-center text-slate-600 py-8">Carregando configurações...</p>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-navy">Configurações</h1>
          <p className="text-slate-600 mt-1">Configure informações do PDF e serviços</p>
        </div>

        {/* PDF Configuration */}
        <Card>
          <h2 className="text-xl font-bold text-navy mb-4">Informações do PDF</h2>
          <div className="space-y-4">
            <Input
              label="Nome da Empresa"
              value={pdfConfig.companyName}
              onChange={(e) => setPdfConfig({ ...pdfConfig, companyName: e.target.value })}
            />
            <Input
              label="Endereço"
              value={pdfConfig.address}
              onChange={(e) => setPdfConfig({ ...pdfConfig, address: e.target.value })}
            />
            <Input
              label="Cidade/Estado"
              value={pdfConfig.city}
              onChange={(e) => setPdfConfig({ ...pdfConfig, city: e.target.value })}
            />
            <Input
              label="Telefone"
              value={pdfConfig.phone}
              onChange={(e) => setPdfConfig({ ...pdfConfig, phone: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              value={pdfConfig.email}
              onChange={(e) => setPdfConfig({ ...pdfConfig, email: e.target.value })}
            />
          </div>
        </Card>

        {/* Services Configuration */}
        <Card>
          <h2 className="text-xl font-bold text-navy mb-4">Configuração de Serviços</h2>
          <div className="space-y-4">
            {services.map((service, index) => (
              <div key={service.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Nome</label>
                    <input
                      type="text"
                      value={service.name}
                      onChange={(e) => handleServiceChange(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Descrição</label>
                    <input
                      type="text"
                      value={service.description}
                      onChange={(e) => handleServiceChange(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Tipo</label>
                    <select
                      value={service.type}
                      onChange={(e) => handleServiceChange(index, 'type', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy text-sm"
                    >
                      <option value="unit">Unidade</option>
                      <option value="meter">Metro</option>
                      <option value="package">Pacote</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Preço Padrão</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={service.defaultPrice}
                      onChange={(e) => handleServiceChange(index, 'defaultPrice', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Data Migration Section */}
        <Card className="border-amber-200 bg-amber-50">
          <h2 className="text-xl font-bold text-navy mb-4">Migração de Dados</h2>
          <p className="text-slate-600 mb-4">
            Se você tiver dados antigos sem o campo <code className="bg-amber-100 px-2 py-1 rounded">companyId</code>, 
            use este botão para adicionar automaticamente o <code className="bg-amber-100 px-2 py-1 rounded">companyId</code> 
            aos seus documentos existentes (clients, workOrders, expenses).
          </p>
          <Button
            variant="outline"
            size="lg"
            onClick={handleMigrateData}
            disabled={migrating}
            className="flex items-center gap-2 border-amber-600 text-amber-700 hover:bg-amber-100"
          >
            <Database className="w-5 h-5" />
            {migrating ? 'Migrando...' : 'Migrar Dados Antigos'}
          </Button>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            variant="primary"
            size="lg"
            onClick={handleSavePDFConfig}
            disabled={saving}
            className="flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </div>
    </Layout>
  );
}

