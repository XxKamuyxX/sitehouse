import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Button } from './ui/Button';
import { ArrowLeft, Image as ImageIcon } from 'lucide-react';

interface ServiceItem {
  name: string;
  description: string;
  imageUrl?: string;
  templateId?: string;
  isTemplate?: boolean;
}

interface InstallationServiceSelectorProps {
  category: string;
  onSelectService: (service: ServiceItem) => void;
  onBack: () => void;
}

interface ServiceTemplate {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
}

const INSTALLATION_SERVICES: Record<string, Array<{ name: string; description: string }>> = {
  box: [
    { name: 'Box de Banheiro (Vidro Temperado)', description: 'Instalação completa de box com vidro temperado' },
    { name: 'Box de Canto', description: 'Box de canto com perfil de alumínio' },
    { name: 'Box Frontal', description: 'Box frontal com portas de correr' },
    { name: 'Box com Porta Pivotante', description: 'Box com sistema pivotante' },
    { name: 'Outro tipo de Box', description: 'Box personalizado' },
  ],
  janela: [
    { name: 'Janela de Correr', description: 'Janela de vidro temperado com perfil de alumínio' },
    { name: 'Janela Maxim-Ar', description: 'Janela basculante com sistema maxim-ar' },
    { name: 'Janela Fixa', description: 'Janela fixa de vidro temperado' },
    { name: 'Janela de Abrir', description: 'Janela com sistema de abertura' },
    { name: 'Outro tipo de Janela', description: 'Janela personalizada' },
  ],
  porta: [
    { name: 'Porta de Vidro Temperado', description: 'Porta de correr de vidro temperado' },
    { name: 'Porta Pivotante', description: 'Porta pivotante de vidro' },
    { name: 'Porta de Abrir', description: 'Porta de vidro com dobradiças' },
    { name: 'Porta de Correr', description: 'Porta de correr com perfil de alumínio' },
    { name: 'Outro tipo de Porta', description: 'Porta personalizada' },
  ],
  sacada: [
    { name: 'Envidraçamento de Sacada', description: 'Fechamento completo de sacada com vidros' },
    { name: 'Cortina de Vidro', description: 'Sistema de cortina de vidro' },
    { name: 'Outro tipo de Envidraçamento', description: 'Envidraçamento personalizado' },
  ],
  espelho: [
    { name: 'Espelho para Banheiro', description: 'Espelho sob medida para banheiro' },
    { name: 'Espelho de Parede', description: 'Espelho decorativo de parede' },
    { name: 'Espelho com Bisotê', description: 'Espelho com acabamento bisotê' },
    { name: 'Espelho de Corpo Inteiro', description: 'Espelho grande de corpo inteiro' },
    { name: 'Outro tipo de Espelho', description: 'Espelho personalizado' },
  ],
  'guarda-corpo': [
    { name: 'Guarda-Corpo de Vidro Temperado', description: 'Guarda-corpo com vidro temperado 10mm' },
    { name: 'Guarda-Corpo com Inox', description: 'Guarda-corpo de vidro com perfil de inox' },
    { name: 'Guarda-Corpo Frameless', description: 'Guarda-corpo sem perfil aparente' },
    { name: 'Guarda-Corpo de Escada', description: 'Guarda-corpo específico para escadas' },
    { name: 'Outro tipo de Guarda-Corpo', description: 'Guarda-corpo personalizado' },
  ],
  divisorio: [
    { name: 'Divisória de Ambiente', description: 'Divisória de vidro para separar ambientes' },
    { name: 'Divisória de Escritório', description: 'Divisória com perfil de alumínio para escritório' },
    { name: 'Divisória Acústica', description: 'Divisória com isolamento acústico' },
    { name: 'Divisória Piso-Teto', description: 'Divisória que vai do piso ao teto' },
    { name: 'Outro tipo de Divisória', description: 'Divisória personalizada' },
  ],
  'vidro-fixo': [
    { name: 'Vidro Fixo de Fachada', description: 'Vidro fixo para fachada de imóveis' },
    { name: 'Vidro Fixo de Vitrine', description: 'Vidro fixo para vitrines comerciais' },
    { name: 'Vidro Fixo Decorativo', description: 'Vidro fixo para decoração de ambientes' },
    { name: 'Vidro Fixo de Varanda', description: 'Vidro fixo para fechamento de varanda' },
    { name: 'Outro tipo de Vidro Fixo', description: 'Vidro fixo personalizado' },
  ],
  outros: [
    { name: 'Blindex', description: 'Instalação de blindex' },
    { name: 'Coberturas de Vidro', description: 'Coberturas e telhados de vidro' },
    { name: 'Tampo de Mesa em Vidro', description: 'Tampo de vidro temperado para mesa' },
    { name: 'Prateleiras de Vidro', description: 'Prateleiras de vidro temperado' },
    { name: 'Outro Serviço', description: 'Serviço personalizado de instalação' },
  ],
};

const CATEGORY_LABELS: Record<string, string> = {
  box: 'Box',
  janela: 'Janela',
  porta: 'Porta',
  sacada: 'Sacada',
  espelho: 'Espelho',
  'guarda-corpo': 'Guarda-Corpo',
  divisorio: 'Divisório',
  'vidro-fixo': 'Vidro Fixo',
  outros: 'Outros',
};

export function InstallationServiceSelector({ category, onSelectService, onBack }: InstallationServiceSelectorProps) {
  const [templates, setTemplates] = useState<ServiceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const defaultServices = INSTALLATION_SERVICES[category] || [];

  useEffect(() => {
    loadTemplates();
  }, [category]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      // Query templates for this category
      const q = query(
        collection(db, 'projectTemplates'),
        where('profession', '==', 'vidracaria'),
        where('type', '==', 'installation'),
        where('category', '==', category)
      );
      const snapshot = await getDocs(q);
      const templatesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        title: doc.data().title,
        description: doc.data().description,
        imageUrl: doc.data().imageUrl,
      }));
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  // Combine default services with templates
  const allServices = [
    ...templates.map((template) => ({
      name: template.title,
      description: template.description,
      imageUrl: template.imageUrl,
      templateId: template.id,
      isTemplate: true,
    })),
    ...defaultServices.map((service) => ({
      ...service,
      isTemplate: false,
    })),
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <h2 className="text-xl font-bold text-secondary">
          Instalação de {CATEGORY_LABELS[category]}
        </h2>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-slate-600">Carregando serviços...</p>
        </div>
      ) : allServices.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-600">Nenhum serviço disponível para esta categoria</p>
        </div>
      ) : (
        <div className="space-y-3">
          {allServices.map((service, index) => (
            <button
              key={`${service.name}-${index}`}
              onClick={() => onSelectService(service)}
              className="w-full p-4 border-2 border-slate-200 rounded-lg hover:border-primary transition-all bg-white hover:bg-glass-blue text-left"
            >
              <div className="flex gap-4">
                {/* Image */}
                {service.imageUrl ? (
                  <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100">
                    <img
                      src={service.imageUrl}
                      alt={service.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 flex-shrink-0 rounded-lg bg-slate-100 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-slate-300" />
                  </div>
                )}
                
                {/* Content */}
                <div className="flex-1">
                  <h3 className="font-bold text-secondary mb-1">{service.name}</h3>
                  <p className="text-sm text-slate-600">{service.description}</p>
                  {service.isTemplate && (
                    <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                      Template Personalizado
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
