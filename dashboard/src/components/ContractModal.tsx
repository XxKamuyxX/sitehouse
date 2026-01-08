import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { X, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCompany } from '../hooks/useCompany';

interface QuoteItem {
  serviceName: string;
  quantity: number;
  total: number;
  dimensions?: {
    width?: number;
    height?: number;
  };
}

interface ContractModalProps {
  quote: {
    id: string;
    clientName: string;
    clientAddress?: string;
    items: QuoteItem[];
    total: number;
  };
  onClose: () => void;
  onGenerate: (contractData: ContractData) => void;
}

export interface ContractData {
  // Contratante
  clientName: string;
  clientCpfCnpj: string;
  clientRg: string;
  clientAddress: string;
  
  // Execução
  startDate: string;
  deliveryDate: string;
  
  // Pagamento
  paymentMethod: 'pix' | 'card' | 'cash' | 'bank_transfer';
  paymentDetails: string;
  
  // Testemunhas (opcional)
  witness1Name?: string;
  witness1Cpf?: string;
  witness2Name?: string;
  witness2Cpf?: string;
  
  // Template editado
  contractText?: string;
}

// Helper function to format CPF/CNPJ
const formatCpfCnpj = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  
  if (numbers.length <= 11) {
    // CPF: 000.000.000-00
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  } else {
    // CNPJ: 00.000.000/0000-00
    return numbers
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  }
};

export function ContractModal({ quote, onClose, onGenerate }: ContractModalProps) {
  const { company } = useCompany();
  const [formData, setFormData] = useState<ContractData>({
    clientName: quote.clientName,
    clientCpfCnpj: '',
    clientRg: '',
    clientAddress: quote.clientAddress || '',
    startDate: '',
    deliveryDate: '',
    paymentMethod: 'pix',
    paymentDetails: '',
    witness1Name: '',
    witness1Cpf: '',
    witness2Name: '',
    witness2Cpf: '',
    contractText: '',
  });
  const [showPreview, setShowPreview] = useState(false);

  // Load contract template from company settings
  useEffect(() => {
    if (company && (company as any).contractTemplate) {
      setFormData(prev => ({
        ...prev,
        contractText: (company as any).contractTemplate,
      }));
    } else {
      // Default template if none exists
      setFormData(prev => ({
        ...prev,
        contractText: `CONTRATO DE PRESTAÇÃO DE SERVIÇOS

Pelo presente instrumento particular de contrato de prestação de serviços, de um lado {COMPANY_NAME}, inscrita no CNPJ sob o nº {COMPANY_CNPJ}, com sede em {COMPANY_ADDRESS}, doravante denominada CONTRATADA, e de outro lado {CLIENT_NAME}, {CLIENT_CPF_CNPJ}, RG {CLIENT_RG}, residente e domiciliado em {CLIENT_ADDRESS}, doravante denominado CONTRATANTE, têm entre si justo e contratado o seguinte:

CLÁUSULA 1ª - DO OBJETO
O presente contrato tem por objeto a prestação de serviços de instalação/manutenção de vidros conforme especificado no orçamento anexo, no valor total de R$ {TOTAL}.

CLÁUSULA 2ª - DO PRAZO
O serviço terá início em {START_DATE} e será concluído até {DELIVERY_DATE}.

CLÁUSULA 3ª - DO PAGAMENTO
O pagamento será efetuado da seguinte forma: {PAYMENT_DETAILS} através de {PAYMENT_METHOD}.

CLÁUSULA 4ª - DAS OBRIGAÇÕES DA CONTRATADA
A CONTRATADA se compromete a executar os serviços com qualidade e dentro do prazo estabelecido.

CLÁUSULA 5ª - DAS OBRIGAÇÕES DO CONTRATANTE
O CONTRATANTE se compromete a fornecer acesso ao local e condições adequadas para a execução dos serviços.

CLÁUSULA 6ª - DA GARANTIA
Os serviços executados terão garantia de 90 (noventa) dias contra defeitos de execução.

E, por estarem assim justos e contratados, firmam o presente contrato em duas vias de igual teor e forma, na presença das testemunhas abaixo assinadas.

{CITY}, {DATE}

_________________________________
{COMPANY_NAME}
CNPJ: {COMPANY_CNPJ}

_________________________________
{CLIENT_NAME}
CPF/CNPJ: {CLIENT_CPF_CNPJ}

Testemunhas:
{WITNESS1_NAME} - CPF: {WITNESS1_CPF}
{WITNESS2_NAME} - CPF: {WITNESS2_CPF}`,
      }));
    }
  }, [company]);

  // Replace template variables with actual data
  const replaceVariables = (text: string): string => {
    if (!text) return '';
    
    const today = new Date();
    const formattedDate = today.toLocaleDateString('pt-BR');
    const city = company?.address?.split(',')?.[company.address.split(',').length - 2]?.trim() || 'Belo Horizonte';
    
    return text
      .replace(/{CLIENT_NAME}/g, formData.clientName)
      .replace(/{CLIENT_CPF_CNPJ}/g, formData.clientCpfCnpj || '_________________')
      .replace(/{CLIENT_RG}/g, formData.clientRg || '_________________')
      .replace(/{CLIENT_ADDRESS}/g, formData.clientAddress)
      .replace(/{START_DATE}/g, formData.startDate ? new Date(formData.startDate).toLocaleDateString('pt-BR') : '_________________')
      .replace(/{DELIVERY_DATE}/g, formData.deliveryDate ? new Date(formData.deliveryDate).toLocaleDateString('pt-BR') : '_________________')
      .replace(/{PAYMENT_METHOD}/g, {
        pix: 'PIX',
        card: 'Cartão de Crédito/Débito',
        cash: 'Dinheiro',
        bank_transfer: 'Transferência Bancária',
      }[formData.paymentMethod] || formData.paymentMethod)
      .replace(/{PAYMENT_DETAILS}/g, formData.paymentDetails || '_________________')
      .replace(/{TOTAL}/g, quote.total.toFixed(2).replace('.', ','))
      .replace(/{COMPANY_NAME}/g, company?.name || '_________________')
      .replace(/{COMPANY_CNPJ}/g, company?.cnpj || '_________________')
      .replace(/{COMPANY_ADDRESS}/g, company?.address || '_________________')
      .replace(/{WITNESS1_NAME}/g, formData.witness1Name || '_________________')
      .replace(/{WITNESS1_CPF}/g, formData.witness1Cpf || '_________________')
      .replace(/{WITNESS2_NAME}/g, formData.witness2Name || '_________________')
      .replace(/{WITNESS2_CPF}/g, formData.witness2Cpf || '_________________')
      .replace(/{DATE}/g, formattedDate)
      .replace(/{CITY}/g, city);
  };

  const handleCpfCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCpfCnpj(e.target.value);
    setFormData({ ...formData, clientCpfCnpj: formatted });
  };

  const handleWitnessCpfChange = (witness: 1 | 2, value: string) => {
    const formatted = formatCpfCnpj(value);
    if (witness === 1) {
      setFormData({ ...formData, witness1Cpf: formatted });
    } else {
      setFormData({ ...formData, witness2Cpf: formatted });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.clientCpfCnpj || !formData.clientRg || !formData.clientAddress) {
      alert('Preencha todos os campos obrigatórios do Contratante');
      return;
    }
    
    if (!formData.startDate || !formData.deliveryDate) {
      alert('Preencha as datas de início e entrega');
      return;
    }
    
    if (!formData.paymentDetails) {
      alert('Preencha os detalhes do pagamento');
      return;
    }
    
    if (!formData.contractText || formData.contractText.trim() === '') {
      alert('O texto do contrato não pode estar vazio');
      return;
    }
    
    onGenerate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-navy" />
            <h2 className="text-2xl font-bold text-navy">Gerar Contrato</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contratante */}
          <div>
            <h3 className="text-lg font-bold text-navy mb-4">Dados do Contratante</h3>
            <div className="space-y-4">
              <Input
                label="Nome Completo *"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                required
                disabled
              />
              
              <Input
                label="CPF/CNPJ *"
                value={formData.clientCpfCnpj}
                onChange={handleCpfCnpjChange}
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                required
                maxLength={18}
              />
              
              <Input
                label="RG *"
                value={formData.clientRg}
                onChange={(e) => setFormData({ ...formData, clientRg: e.target.value })}
                placeholder="00.000.000-0"
                required
              />
              
              <Input
                label="Endereço Completo *"
                value={formData.clientAddress}
                onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
                placeholder="Rua, número, bairro, cidade - UF"
                required
              />
            </div>
          </div>

          {/* Execução */}
          <div>
            <h3 className="text-lg font-bold text-navy mb-4">Execução do Serviço</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Data de Início *"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
              
              <Input
                label="Prazo de Entrega *"
                type="date"
                value={formData.deliveryDate}
                onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Pagamento */}
          <div>
            <h3 className="text-lg font-bold text-navy mb-4">Pagamento</h3>
            <div className="space-y-4">
              <Select
                label="Forma de Pagamento *"
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                options={[
                  { value: 'pix', label: 'PIX' },
                  { value: 'card', label: 'Cartão de Crédito/Débito' },
                  { value: 'cash', label: 'Dinheiro' },
                  { value: 'bank_transfer', label: 'Transferência Bancária' },
                ]}
                required
              />
              
              <Input
                label="Detalhes do Pagamento *"
                value={formData.paymentDetails}
                onChange={(e) => setFormData({ ...formData, paymentDetails: e.target.value })}
                placeholder="Ex: 50% entrada + 50% na entrega"
                required
              />
            </div>
          </div>

          {/* Testemunhas (Opcional) */}
          <div>
            <h3 className="text-lg font-bold text-navy mb-4">Testemunhas (Opcional)</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nome da 1ª Testemunha"
                  value={formData.witness1Name}
                  onChange={(e) => setFormData({ ...formData, witness1Name: e.target.value })}
                  placeholder="Nome completo"
                />
                
                <Input
                  label="CPF da 1ª Testemunha"
                  value={formData.witness1Cpf}
                  onChange={(e) => handleWitnessCpfChange(1, e.target.value)}
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nome da 2ª Testemunha"
                  value={formData.witness2Name}
                  onChange={(e) => setFormData({ ...formData, witness2Name: e.target.value })}
                  placeholder="Nome completo"
                />
                
                <Input
                  label="CPF da 2ª Testemunha"
                  value={formData.witness2Cpf}
                  onChange={(e) => handleWitnessCpfChange(2, e.target.value)}
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
              </div>
            </div>
          </div>

          {/* Contract Text Preview/Edit */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-secondary">Texto do Contrato</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="text-slate-600 hover:text-secondary"
              >
                {showPreview ? 'Editar' : 'Visualizar'}
              </Button>
            </div>
            {showPreview ? (
              <div className="p-4 border border-slate-300 rounded-lg bg-slate-50 max-h-96 overflow-y-auto whitespace-pre-wrap text-sm">
                {replaceVariables(formData.contractText || '')}
              </div>
            ) : (
              <textarea
                value={formData.contractText}
                onChange={(e) => setFormData({ ...formData, contractText: e.target.value })}
                rows={15}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                placeholder="Digite o texto do contrato aqui..."
                required
              />
            )}
            <p className="text-xs text-slate-500 mt-2">
              Use as variáveis {'{CLIENT_NAME}'}, {'{DELIVERY_DATE}'}, {'{TOTAL}'}, etc. que serão substituídas automaticamente.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1 flex items-center justify-center gap-2"
            >
              <FileText className="w-5 h-5" />
              Gerar PDF do Contrato
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
