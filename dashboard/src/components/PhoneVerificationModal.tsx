import { useState, useEffect, useRef } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { X, Loader2, CheckCircle2, MessageCircle } from 'lucide-react';
import { formatPhoneForRegistry, sanitizePhone } from '../utils/security';
import { useAuth } from '../contexts/AuthContext';

interface PhoneVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
  requiredFor?: string; // "quote" | "workOrder" | etc.
}

export function PhoneVerificationModal({ 
  isOpen, 
  onClose, 
  onVerified,
  requiredFor = 'esta ação'
}: PhoneVerificationModalProps) {
  const { user } = useAuth();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'input' | 'verify'>('input');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setPhone('');
      setCode('');
      setStep('input');
      setError('');
      setSuccess(false);
      setConfirmationResult(null);
      // Clean up recaptcha
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    }
  }, [isOpen]);

  const initializeRecaptcha = () => {
    if (!recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            // reCAPTCHA verified
          },
          'expired-callback': () => {
            setError('reCAPTCHA expirado. Tente novamente.');
          },
        });
      } catch (error) {
        console.error('Error initializing reCAPTCHA:', error);
        setError('Erro ao inicializar verificação. Recarregue a página.');
      }
    }
    return recaptchaVerifierRef.current;
  };

  const handleSendCode = async () => {
    if (!phone) {
      setError('Digite um número de telefone');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Check if phone is already registered
      const formattedPhone = formatPhoneForRegistry(phone);
      const phoneDoc = await getDoc(doc(db, 'phone_registry', formattedPhone));
      
      if (phoneDoc.exists()) {
        const phoneData = phoneDoc.data();
        if (phoneData.userId !== user?.uid) {
          setError('Este número já foi usado em outra conta. Use outro número.');
          setLoading(false);
          return;
        }
      }

      // Format phone for Firebase (add +55 for Brazil)
      const sanitized = sanitizePhone(phone);
      const firebasePhone = sanitized.startsWith('55') 
        ? `+${sanitized}` 
        : `+55${sanitized}`;

      // Initialize recaptcha
      const verifier = initializeRecaptcha();
      if (!verifier) {
        setError('Erro ao inicializar verificação. Recarregue a página.');
        setLoading(false);
        return;
      }
      
      // Send OTP via SMS
      const confirmation = await signInWithPhoneNumber(auth, firebasePhone, verifier);
      setConfirmationResult(confirmation);
      setStep('verify');
      setSuccess(false);
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      
      if (error.code === 'auth/invalid-phone-number') {
        setError('Número de telefone inválido. Use o formato: (11) 99999-9999');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Muitas tentativas. Aguarde um momento e tente novamente.');
      } else {
        setError(error.message || 'Erro ao enviar código. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      setError('Digite o código de 6 dígitos');
      return;
    }

    if (!confirmationResult) {
      setError('Erro: confirmação não encontrada. Reinicie o processo.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Verify the code
      await confirmationResult.confirm(code);

      // If verification successful, update user profile
      if (user) {
        const formattedPhone = formatPhoneForRegistry(phone);
        
        // Update user document
        await setDoc(doc(db, 'users', user.uid), {
          mobileVerified: true,
          phone: formattedPhone,
          phoneVerifiedAt: serverTimestamp(),
        }, { merge: true });

        // Register phone in phone_registry (CRITICAL: Anti-fraud)
        await setDoc(doc(db, 'phone_registry', formattedPhone), {
          userId: user.uid,
          usedAt: serverTimestamp(),
        }, { merge: true });

        setSuccess(true);
        
        // Call onVerified callback after a short delay
        setTimeout(() => {
          onVerified();
          onClose();
        }, 1500);
      }
    } catch (error: any) {
      console.error('Error verifying code:', error);
      
      if (error.code === 'auth/invalid-verification-code') {
        setError('Código inválido. Verifique e tente novamente.');
      } else if (error.code === 'auth/code-expired') {
        setError('Código expirado. Solicite um novo código.');
        setStep('input');
        setConfirmationResult(null);
      } else {
        setError(error.message || 'Erro ao verificar código. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-numeric
    
    // Format as (XX) XXXXX-XXXX
    if (value.length <= 2) {
      value = value;
    } else if (value.length <= 7) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    } else {
      value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7, 11)}`;
    }
    
    setPhone(value);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-navy">Verificação de Telefone</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {success ? (
            <div className="text-center py-4">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-green-700 font-medium mb-2">Telefone verificado com sucesso!</p>
              <p className="text-sm text-slate-600">Você já pode continuar usando o sistema.</p>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Para sua segurança e liberar {requiredFor}, precisamos verificar seu número de telefone.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {step === 'input' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Número de Telefone (WhatsApp)
                    </label>
                    <Input
                      type="tel"
                      value={phone}
                      onChange={handlePhoneChange}
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                      disabled={loading}
                      className="w-full"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Enviaremos um código SMS para este número
                    </p>
                  </div>

                  {/* reCAPTCHA container (invisible) */}
                  <div id="recaptcha-container"></div>

                  <Button
                    variant="primary"
                    onClick={handleSendCode}
                    disabled={loading || !phone}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-5 h-5" />
                        Enviar Código
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800">
                      Código enviado para {phone}. Digite o código de 6 dígitos abaixo.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Código de Verificação
                    </label>
                    <Input
                      type="text"
                      value={code}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setCode(value);
                      }}
                      placeholder="000000"
                      maxLength={6}
                      disabled={loading}
                      className="w-full text-center text-2xl tracking-widest font-mono"
                      autoFocus
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setStep('input');
                        setCode('');
                        setError('');
                        setConfirmationResult(null);
                      }}
                      disabled={loading}
                      className="flex-1"
                    >
                      Voltar
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleVerifyCode}
                      disabled={loading || code.length !== 6}
                      className="flex-1 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Verificando...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          Validar
                        </>
                      )}
                    </Button>
                  </div>

                  <button
                    onClick={handleSendCode}
                    disabled={loading}
                    className="text-sm text-blue-600 hover:underline w-full text-center"
                  >
                    Reenviar código
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
