import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Button } from './ui/Button';
import { ArrowLeft, Image as ImageIcon } from 'lucide-react';

interface MaintenanceServiceSelectorProps {
  category: string;
  onSelectService: (service: { name: string; description: string; imageUrl?: string; templateId?: string }) => void;
  onBack: () => void;
}

interface ServiceTemplate {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
}

const MAINTENANCE_SERVICES: Record<string, Array<{ name: string; description: string }>> = {
  box: [
    { name: 'Troca de Roldanas', description: 'Substituição por roldanas premium' },
    { name: 'Vedação/Silicone', description: 'Substituição da vedação e aplicação de silicone' },
    { name: 'Regulagem', description: 'Ajuste e regulagem do sistema' },
    { name: 'Limpeza', description: 'Limpeza profissional dos vidros e trilhos' },
    { name: 'Higienização', description: 'Limpeza profunda e higienização completa' },
  ],
  janela: [
    { name: 'Troca de Roldanas', description: 'Substituição por roldanas premium' },
    { name: 'Vedação/Silicone', description: 'Substituição da vedação e aplicação de silicone' },
    { name: 'Regulagem', description: 'Ajuste e regulagem do sistema' },
    { name: 'Limpeza', description: 'Limpeza profissional dos vidros e trilhos' },
    { name: 'Colagem de Vidro', description: 'Colagem profissional de vidros soltos' },
  ],
  porta: [
    { name: 'Troca de Roldanas', description: 'Substituição por roldanas premium' },
    { name: 'Vedação/Silicone', description: 'Substituição da vedação e aplicação de silicone' },
    { name: 'Regulagem', description: 'Ajuste e regulagem do sistema' },
    { name: 'Limpeza', description: 'Limpeza profissional dos vidros e trilhos' },
    { name: 'Blindagem', description: 'Blindagem nos trilhos para proteção' },
  ],
  sacada: [
    { name: 'Troca de Roldanas', description: 'Substituição por roldanas premium' },
    { name: 'Vedação/Silicone', description: 'Substituição da vedação e aplicação de silicone' },
    { name: 'Regulagem', description: 'Ajuste e regulagem do sistema' },
    { name: 'Limpeza', description: 'Limpeza profissional dos vidros e trilhos' },
    { name: 'Manutenção Preventiva', description: 'Manutenção preventiva completa' },
  ],
  outros: [
    { name: 'Visita Técnica/Diagnóstico', description: 'Diagnóstico completo do sistema' },
    { name: 'Reparo Geral', description: 'Reparo geral conforme necessidade' },
    { name: 'Outro Serviço', description: 'Serviço personalizado' },
  ],
};

const CATEGORY_LABELS: Record<string, string> = {
  box: 'Box',
  janela: 'Janela',
  porta: 'Porta',
  sacada: 'Sacada',
  outros: 'Outros',
};

export function MaintenanceServiceSelector({ category, onSelectService, onBack }: MaintenanceServiceSelectorProps) {
  const [templates, setTemplates] = useState<ServiceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const defaultServices = MAINTENANCE_SERVICES[category] || [];

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
        where('type', '==', 'maintenance'),
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
          Manutenção de {CATEGORY_LABELS[category]}
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
