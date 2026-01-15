import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SignatureCanvas } from '../components/SignatureCanvas';

interface WorkOrder {
  id: string;
  clientName: string;
  status: string;
  clientAccepted?: boolean;
  acceptedAt?: any;
  companyId?: string;
  signatureImage?: string;
  deviceInfo?: string;
  clientIp?: string;
}

export function WorkOrderAcceptance() {
  const { osId } = useParams<{ osId: string }>();
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [termAccepted, setTermAccepted] = useState(false);
  const [signatureEmpty, setSignatureEmpty] = useState(true);
  const [signatureDataUrl, setSignatureDataUrl] = useState('');
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    if (osId) {
      loadWorkOrder();
    }
  }, [osId]);

  const loadWorkOrder = async () => {
    try {
      if (!osId) return;
      const docRef = doc(db, 'workOrders', osId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setLoading(false);
        return;
      }

      const data = docSnap.data();
      setWorkOrder({
        id: docSnap.id,
        clientName: data.clientName || '',
        status: data.status || '',
        clientAccepted: data.clientAccepted || false,
        acceptedAt: data.acceptedAt,
        companyId: data.companyId,
        signatureImage: data.signatureImage,
        deviceInfo: data.deviceInfo,
        clientIp: data.clientIp,
      });

      if (data.clientAccepted) {
        setAccepted(true);
      }

      // Load company name
      const companyId = data.companyId;
      if (companyId) {
        try {
          const companyDoc = await getDoc(doc(db, 'companies', companyId));
          if (companyDoc.exists()) {
            const companyData = companyDoc.data();
            setCompanyName(companyData.name || 'a empresa');
          } else {
            setCompanyName('a empresa');
          }
        } catch (error) {
          console.error('Error loading company:', error);
          setCompanyName('a empresa');
        }
      } else {
        setCompanyName('a empresa');
      }
    } catch (error) {
      console.error('Error loading work order:', error);
    } finally {
      setLoading(false);
    }
  };

  const getClientIp = async (): Promise<string> => {
    try {
      // Try to get IP from a free API
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || 'unknown';
    } catch (error) {
      console.error('Error getting IP:', error);
      return 'unknown';
    }
  };

  const getDeviceInfo = (): string => {
    const ua = navigator.userAgent;
    // Simple device detection
    let device = 'Unknown Device';
    
    if (/iPhone/.test(ua)) {
      device = 'iPhone';
    } else if (/iPad/.test(ua)) {
      device = 'iPad';
    } else if (/Android/.test(ua)) {
      device = 'Android';
    } else if (/Windows/.test(ua)) {
      device = 'Windows PC';
    } else if (/Mac/.test(ua)) {
      device = 'Mac';
    } else if (/Linux/.test(ua)) {
      device = 'Linux';
    }

    // Browser detection
    let browser = 'Unknown Browser';
    if (/Chrome/.test(ua) && !/Edg|OPR/.test(ua)) {
      browser = 'Chrome';
    } else if (/Firefox/.test(ua)) {
      browser = 'Firefox';
    } else if (/Safari/.test(ua) && !/Chrome/.test(ua)) {
      browser = 'Safari';
    } else if (/Edg/.test(ua)) {
      browser = 'Edge';
    }

    return `${device} - ${browser}`;
  };

  const handleAccept = async () => {
    if (!osId || !workOrder) return;

    if (!termAccepted) {
      alert('Por favor, leia e aceite o termo de vistoria.');
      return;
    }

    if (signatureEmpty || !signatureDataUrl) {
      alert('Por favor, assine o documento.');
      return;
    }

    setAccepting(true);
    try {
      // Get client IP and device info
      const clientIp = await getClientIp();
      const deviceInfo = getDeviceInfo();

      await updateDoc(doc(db, 'workOrders', osId), {
        clientAccepted: true,
        acceptedAt: serverTimestamp(),
        clientIp: clientIp,
        deviceInfo: deviceInfo,
        signatureImage: signatureDataUrl,
      });

      setAccepted(true);
      setWorkOrder({
        ...workOrder,
        clientAccepted: true,
        acceptedAt: new Date(),
        clientIp: clientIp,
        deviceInfo: deviceInfo,
        signatureImage: signatureDataUrl,
      });

      alert('Aceite confirmado com sucesso! Obrigado.');
    } catch (error) {
      console.error('Error accepting work order:', error);
      alert('Erro ao confirmar aceite. Tente novamente.');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-navy animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-navy mb-2">Ordem de Serviço não encontrada</h1>
            <p className="text-slate-600">O link pode estar incorreto ou a ordem de serviço foi removida.</p>
          </div>
        </Card>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <div className="text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-green-700 mb-2">Aceite Confirmado!</h1>
            <p className="text-slate-600 mb-4">
              O recebimento do serviço foi confirmado em{' '}
              {workOrder.acceptedAt?.toDate ? 
                new Date(workOrder.acceptedAt.toDate()).toLocaleString('pt-BR') :
                new Date(workOrder.acceptedAt).toLocaleString('pt-BR')
              }
            </p>
            <p className="text-sm text-slate-500">
              Cliente: {workOrder.clientName}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-8">
      <Card className="max-w-2xl w-full">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-navy mb-2">Confirmação de Recebimento</h1>
            <p className="text-slate-600">
              Cliente: <strong>{workOrder.clientName}</strong>
            </p>
          </div>

          {/* Section 1: Legal Term */}
          <div>
            <h2 className="text-lg font-semibold text-navy mb-3">Termo de Vistoria</h2>
            <div className="bg-slate-100 border border-slate-300 rounded-lg p-4 max-h-48 overflow-y-auto">
              <p className="text-sm text-slate-700 leading-relaxed">
                Declaro para os devidos fins que <strong>VISTORIEI</strong> os serviços executados e produtos entregues pela{' '}
                <strong>{companyName}</strong>, confirmando que os mesmos se encontram em <strong>PERFEITO ESTADO</strong> de funcionamento, 
                conservação e limpeza, isentos de riscos, manchas ou avarias aparentes.
                {'\n\n'}
                Declaro que o serviço foi concluído conforme o combinado e dou plena quitação em relação à execução e instalação.
              </p>
            </div>
            <label className="flex items-start gap-3 mt-4 cursor-pointer">
              <input
                type="checkbox"
                checked={termAccepted}
                onChange={(e) => setTermAccepted(e.target.checked)}
                className="mt-1 w-5 h-5 text-navy focus:ring-navy border-slate-300 rounded"
              />
              <span className="text-sm text-slate-700">
                Li e concordo com o termo de vistoria acima.
              </span>
            </label>
          </div>

          {/* Section 2: Digital Signature Pad */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Assine abaixo (Use o dedo):
            </label>
            <SignatureCanvas
              onSignatureChange={(isEmpty) => {
                setSignatureEmpty(isEmpty);
              }}
              onSignatureComplete={(dataUrl) => {
                setSignatureDataUrl(dataUrl);
                setSignatureEmpty(!dataUrl || dataUrl === '');
              }}
            />
          </div>

          {/* Submit Button */}
          <Button
            variant="primary"
            size="lg"
            onClick={handleAccept}
            disabled={accepting || !termAccepted || signatureEmpty}
            className="w-full"
          >
            {accepting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Confirmando...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Confirmar e Receber
              </>
            )}
          </Button>

          {(!termAccepted || signatureEmpty) && (
            <p className="text-xs text-red-600 text-center">
              {!termAccepted && '• Aceite o termo de vistoria'}
              {!termAccepted && signatureEmpty && ' • '}
              {signatureEmpty && '• Assine o documento'}
            </p>
          )}

          <p className="text-xs text-slate-500 text-center">
            Ao confirmar, você está declarando que vistoriou e recebeu o serviço conforme descrito na ordem de serviço.
          </p>
        </div>
      </Card>
    </div>
  );
}
