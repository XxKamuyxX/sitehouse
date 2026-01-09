import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface Leaf {
  id: number;
  status: 'perfect' | 'attention' | 'damaged';
  defects: string[];
  photo?: string;
}

interface GeneralChecklistItem {
  task: string;
  completed: boolean;
  value?: string;
}

interface ManualService {
  id: string;
  description: string;
  price?: number;
}

interface WorkOrder {
  id: string;
  quoteId: string;
  clientName: string;
  scheduledDate: string;
  scheduledTime?: string;
  technician: string;
  status: string;
  checklist: { task: string; completed: boolean }[];
  notes: string;
  photos?: string[];
  approved?: boolean;
  technicalInspection?: {
    leaves: Leaf[];
    generalChecklist: GeneralChecklistItem[];
  };
  manualServices?: ManualService[];
  totalPrice?: number;
}

export function PublicWorkOrderApprove() {
  const { osId } = useParams<{ osId: string }>();
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    if (osId) {
      loadWorkOrder();
    }
  }, [osId]);

  const loadWorkOrder = async () => {
    try {
      if (!osId) {
        setError('ID da ordem de serviço não fornecido');
        setLoading(false);
        return;
      }

      const osDoc = await getDoc(doc(db, 'workOrders', osId));
      if (!osDoc.exists()) {
        setError('Ordem de serviço não encontrada');
        setLoading(false);
        return;
      }

      const osData = osDoc.data();
      setWorkOrder({
        id: osDoc.id,
        ...osData,
      } as WorkOrder);

      if (osData.approved) {
        setApproved(true);
      }
    } catch (err) {
      console.error('Error loading work order:', err);
      setError('Erro ao carregar ordem de serviço');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!osId || !workOrder) return;

    if (workOrder.approved) {
      alert('Esta ordem de serviço já foi aprovada');
      return;
    }

    if (!confirm('Deseja aprovar esta ordem de serviço?')) {
      return;
    }

    setUpdating(true);
    try {
      await updateDoc(doc(db, 'workOrders', osId), {
        approved: true,
        approvedAt: new Date(),
        updatedAt: new Date(),
      });
      setWorkOrder({ ...workOrder, approved: true });
      setApproved(true);
      alert('Ordem de Serviço Aprovada com Sucesso!');
    } catch (err) {
      console.error('Error approving work order:', err);
      alert('Erro ao aprovar ordem de serviço. Tente novamente.');
    } finally {
      setUpdating(false);
    }
  };

  const handleReject = async () => {
    if (!osId || !workOrder) return;

    if (!confirm('Deseja rejeitar esta ordem de serviço?')) {
      return;
    }

    setUpdating(true);
    try {
      await updateDoc(doc(db, 'workOrders', osId), {
        approved: false,
        rejected: true,
        rejectedAt: new Date(),
        updatedAt: new Date(),
      });
      alert('Ordem de serviço rejeitada');
    } catch (err) {
      console.error('Error rejecting work order:', err);
      alert('Erro ao rejeitar ordem de serviço. Tente novamente.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-navy animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Carregando ordem de serviço...</p>
        </div>
      </div>
    );
  }

  if (error || !workOrder) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-navy mb-2">Erro</h1>
          <p className="text-slate-600 mb-6">{error || 'Ordem de serviço não encontrada'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-center mb-4">
            <img src="/logo.png" alt="House Manutenção" className="h-16 w-16 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-navy text-center mb-2">Aprovar Ordem de Serviço</h1>
          <p className="text-center text-slate-600">
            Cliente: {workOrder.clientName}
          </p>
          {workOrder.scheduledDate && (
            <p className="text-center text-slate-600">
              Agendada para: {new Date(workOrder.scheduledDate).toLocaleDateString('pt-BR')}
              {workOrder.scheduledTime && ` às ${workOrder.scheduledTime}`}
            </p>
          )}
        </div>

        {/* Approval Status */}
        {approved && (
          <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6 mb-6 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-700 mb-2">Ordem de Serviço Aprovada!</h2>
            <p className="text-green-600">Esta ordem de serviço já foi aprovada anteriormente.</p>
          </div>
        )}

        {/* Technical Inspection - Leaves */}
        {workOrder.technicalInspection && workOrder.technicalInspection.leaves && workOrder.technicalInspection.leaves.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-navy mb-4">Vistoria Técnica - Folhas</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
              {workOrder.technicalInspection.leaves.map((leaf) => {
                const getStatusColor = () => {
                  switch (leaf.status) {
                    case 'perfect':
                      return 'bg-green-100 border-green-500 text-green-700';
                    case 'attention':
                      return 'bg-yellow-100 border-yellow-500 text-yellow-700';
                    case 'damaged':
                      return 'bg-red-100 border-red-500 text-red-700';
                    default:
                      return 'bg-slate-100 border-slate-300 text-slate-700';
                  }
                };

                const getStatusLabel = () => {
                  switch (leaf.status) {
                    case 'perfect':
                      return 'Perfeito';
                    case 'attention':
                      return 'Atenção';
                    case 'damaged':
                      return 'Danificado';
                    default:
                      return '';
                  }
                };

                return (
                  <div
                    key={leaf.id}
                    className={`p-4 border-2 rounded-lg ${getStatusColor()}`}
                  >
                    <p className="font-bold text-center mb-2">Folha {leaf.id}</p>
                    <p className="text-xs text-center mb-2">{getStatusLabel()}</p>
                    {leaf.defects.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium mb-1">Defeitos:</p>
                        <div className="flex flex-wrap gap-1">
                          {leaf.defects.map((defect, idx) => (
                            <span key={idx} className="text-xs bg-white/50 px-2 py-1 rounded">
                              {defect}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {leaf.photo && (
                      <img
                        src={leaf.photo}
                        alt={`Folha ${leaf.id}`}
                        className="mt-2 w-full h-24 object-cover rounded"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Technical Inspection - General Checklist */}
        {workOrder.technicalInspection && workOrder.technicalInspection.generalChecklist && workOrder.technicalInspection.generalChecklist.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-navy mb-4">Checklist Geral</h2>
            <div className="space-y-3">
              {workOrder.technicalInspection.generalChecklist.map((item, index) => {
                // Itens simples (sem valor)
                if (!item.value && item.task !== 'Guia' && !item.task.includes('Trilhos')) {
                  return (
                    <div key={index} className="flex items-center gap-3 p-2">
                      {item.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-slate-300" />
                      )}
                      <span className={item.completed ? 'text-slate-600' : 'text-slate-700'}>
                        {item.task}
                      </span>
                    </div>
                  );
                }

                // Guia
                if (item.task === 'Guia' && item.value) {
                  return (
                    <div key={index} className="p-3 bg-navy-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-navy">Guia:</span>
                        <span className="text-navy">
                          {item.value === 'com-guia' ? 'Com Guia' : 'Sem Guia'}
                        </span>
                      </div>
                    </div>
                  );
                }

                // Trilhos
                if (item.task.includes('Trilhos') && item.value) {
                  const getTrilhoLabel = () => {
                    if (item.task.includes('Amassado')) return 'Amassado';
                    if (item.task.includes('Ressecado')) return 'Ressecado';
                    if (item.task.includes('Sujo')) return 'Sujo';
                    return '';
                  };

                  const getLevelLabel = (value: string) => {
                    switch (value) {
                      case 'leve':
                        return 'Leve';
                      case 'moderado':
                        return 'Moderado';
                      case 'intenso':
                        return 'Intenso';
                      default:
                        return value;
                    }
                  };

                  return (
                    <div key={index} className="p-3 bg-navy-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-navy">Trilhos - {getTrilhoLabel()}:</span>
                        <span className="text-navy font-bold">{getLevelLabel(item.value)}</span>
                      </div>
                    </div>
                  );
                }

                return null;
              })}
            </div>
          </div>
        )}

        {/* Manual Services */}
        {workOrder.manualServices && workOrder.manualServices.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-navy mb-4">Serviços Realizados</h2>
            <div className="space-y-3">
              {workOrder.manualServices.map((service) => (
                <div key={service.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-navy">{service.description}</p>
                    {service.price !== undefined && service.price > 0 && (
                      <p className="text-sm text-slate-600">
                        R$ {service.price.toFixed(2).replace('.', ',')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {workOrder.totalPrice !== undefined && workOrder.totalPrice > 0 && (
              <div className="pt-3 border-t-2 border-navy flex justify-between mt-4">
                <span className="text-xl font-bold text-navy">Total:</span>
                <span className="text-xl font-bold text-navy">
                  R$ {workOrder.totalPrice.toFixed(2).replace('.', ',')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Photos from Technical Inspection */}
        {workOrder.technicalInspection && workOrder.technicalInspection.leaves && (
          (() => {
            const photosWithLabels = workOrder.technicalInspection.leaves
              .filter(leaf => leaf.photo)
              .map(leaf => ({
                url: leaf.photo!,
                label: `Folha ${leaf.id}${leaf.defects.length > 0 ? ` - ${leaf.defects.join(', ')}` : ''}`
              }));

            return photosWithLabels.length > 0 ? (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-bold text-navy mb-4">Fotos da Vistoria</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {photosWithLabels.map((photo, index) => (
                    <div key={index} className="space-y-2">
                      <img
                        src={photo.url}
                        alt={photo.label}
                        className="w-full h-48 object-cover rounded-lg border border-slate-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Erro+ao+carregar';
                        }}
                      />
                      <p className="text-xs text-slate-600 text-center">{photo.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null;
          })()
        )}

        {/* General Photos */}
        {workOrder.photos && workOrder.photos.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-navy mb-4">Fotos do Serviço</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {workOrder.photos.map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`Foto ${index + 1}`}
                  className="w-full h-48 object-cover rounded-lg border border-slate-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Erro+ao+carregar';
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Checklist */}
        {workOrder.checklist && workOrder.checklist.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-navy mb-4">Checklist de Serviços</h2>
            <div className="space-y-2">
              {workOrder.checklist.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  {item.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-slate-300" />
                  )}
                  <span className={item.completed ? 'text-slate-600' : 'text-slate-700'}>
                    {item.task}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {workOrder.notes && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-navy mb-4">Observações</h2>
            <p className="text-slate-700">{workOrder.notes}</p>
          </div>
        )}

        {/* Action Buttons */}
        {!approved && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleApprove}
                disabled={updating}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                {updating ? 'Aprovando...' : 'Aprovar Ordem de Serviço'}
              </button>
              <button
                onClick={handleReject}
                disabled={updating}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <XCircle className="w-5 h-5" />
                {updating ? 'Rejeitando...' : 'Rejeitar'}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-slate-600 text-sm">
          <p>House Manutenção - Especialistas em Cortinas de Vidro</p>
          <p className="mt-1">Rua Rio Grande do Norte, 726, Savassi, Belo Horizonte - MG</p>
          <p className="mt-1">Telefone: (31) 98279-8513</p>
        </div>
      </div>
    </div>
  );
}

