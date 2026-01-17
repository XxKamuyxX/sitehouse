import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { doc, updateDoc, serverTimestamp, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Loader2, CheckCircle2, MessageCircle } from 'lucide-react';
import { formatPhoneForRegistry, sanitizePhone } from '../utils/security';
import { useAuth } from '../contexts/AuthContext';

export function Activate() {
  const { user, userMetadata, loading: authLoading, refreshUserProfile } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'input' | 'verify'>('input');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  // Redirect if already verified
  useEffect(() => {
    if (!authLoading && user && userMetadata?.mobileVerified) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, userMetadata, authLoading, navigate]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    // Clean up recaptcha on unmount
    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

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
            setIsLoading(false);
          },
        });
      } catch (error) {
        console.error('Error initializing reCAPTCHA:', error);
        setError('Erro ao inicializar verificação. Recarregue a página.');
        setIsLoading(false);
      }
    }
    return recaptchaVerifierRef.current;
  };

  const handleSendCode = async () => {
    if (!phone) {
      setError('Digite um número de telefone');
      return;
    }

    if (!user) {
      setError('Usuário não autenticado');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Check if phone is already registered
      const formattedPhone = formatPhoneForRegistry(phone);
      const phoneDoc = await getDoc(doc(db, 'phone_registry', formattedPhone));
      
      if (phoneDoc.exists()) {
        const phoneData = phoneDoc.data();
        if (phoneData.userId !== user.uid) {
          setError('Este número já foi usado em outra conta. Use outro número.');
          setIsLoading(false);
          return;
        }
        // If phone is registered to this user, allow recovery (continue with OTP send)
        // This handles cases where phone was registered but mobileVerified wasn't set
        console.log('Recovery scenario: Phone already registered to this user, proceeding with verification...');
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
        setIsLoading(false);
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
      setIsLoading(false);
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

    if (!user) {
      setError('Usuário não autenticado');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Verify the code
      await confirmationResult.confirm(code);

      // If verification successful, update or create user profile (UPSERT logic)
      const formattedPhone = formatPhoneForRegistry(phone);
      const userRef = doc(db, 'users', user.uid);
      
      // Check if user document exists
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        // Document exists: update it
        await updateDoc(userRef, {
          mobileVerified: true,
          phoneNumber: formattedPhone,
          phone: formattedPhone, // Keep phone for backward compatibility
          phoneVerifiedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else {
        // Document doesn't exist: create it (self-healing recovery)
        // This handles cases where Auth User exists but Firestore document is missing
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email || '',
          name: user.displayName || 'Usuário',
          mobileVerified: true,
          phoneNumber: formattedPhone,
          phone: formattedPhone,
          phoneVerifiedAt: serverTimestamp(),
          role: 'owner', // Default fallback for recovery
          companyId: '', // Empty initially, will be set later
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        console.log('User profile created during activation (self-healing)');
      }

      // Register phone in phone_registry (CRITICAL: Anti-fraud)
      // Handle recovery case: phone_registry might already exist from a previous attempt
      try {
        await setDoc(doc(db, 'phone_registry', formattedPhone), {
          userId: user.uid,
          usedAt: serverTimestamp(),
        }, { merge: true });
      } catch (registryError: any) {
        // Recovery flow: If phone_registry already exists, check ownership
        console.log('Phone registry creation failed, checking for recovery scenario:', registryError);
        
        // Check if the phone number is already registered to this user
        const existingPhoneDoc = await getDoc(doc(db, 'phone_registry', formattedPhone));
        
        if (existingPhoneDoc.exists()) {
          const existingPhoneData = existingPhoneDoc.data();
          
          // If it's the same user, this is a recovery scenario - proceed normally
          if (existingPhoneData.userId === user.uid) {
            console.log('Recovery scenario detected: Phone already registered to this user, proceeding...');
            // Continue with success flow - user profile was already updated above
          } else {
            // Phone belongs to a different user - this is an error
            throw new Error('Este número já está em uso por outra conta. Use outro número de telefone.');
          }
        } else {
          // Document doesn't exist but creation failed - rethrow original error
          throw registryError;
        }
      }

      setSuccess(true);
      
      // Refresh user profile to update local state immediately
      // This prevents redirect loops by ensuring userMetadata.mobileVerified is updated
      await refreshUserProfile();
      
      // Small delay to ensure state propagation, then redirect
      // Using window.location ensures a full page reload if needed to break any cache issues
      setTimeout(() => {
        // Double-check that we're verified before redirecting
        // If refresh didn't work, force a page reload
        window.location.href = '/dashboard';
      }, 2000);
    } catch (error: any) {
      console.error('Error verifying code:', error);
      
      // Handle Firebase Auth errors
      if (error.code === 'auth/invalid-verification-code') {
        setError('Código inválido. Verifique e tente novamente.');
      } else if (error.code === 'auth/code-expired') {
        setError('Código expirado. Solicite um novo código.');
        setStep('input');
        setConfirmationResult(null);
      } 
      // Handle Firestore permission errors
      else if (error.code === 'permission-denied' || error.code === 'PERMISSION_DENIED') {
        setError('Erro de permissão: Não foi possível salvar a verificação. Entre em contato com o suporte.');
        console.error('Firestore permission denied. Check firestore.rules for users collection update permissions.');
      }
      // Handle phone already registered to different user
      else if (error.message && error.message.includes('já está em uso por outra conta')) {
        setError(error.message);
      }
      // Handle Firestore "not-found" errors (document doesn't exist but updateDoc was called)
      else if (error.code === 'not-found' || error.code?.includes('not-found')) {
        // This shouldn't happen anymore with upsert logic, but handle it gracefully
        setError('Erro: Perfil não encontrado. Tente novamente ou entre em contato com o suporte.');
        console.error('User document not found error:', error);
      }
      // Handle Firestore other errors
      else if (error.code?.startsWith('firestore/') || error.code?.startsWith('PERMISSION')) {
        setError('Erro ao salvar verificação no banco de dados. Verifique suas permissões ou entre em contato com o suporte.');
        console.error('Firestore error:', error);
      }
      // Generic error
      else {
        setError(error.message || 'Erro ao verificar código. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
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

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Don't render if user is not logged in (redirect will happen)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-navy mb-2">Ative sua Conta</h1>
          <p className="text-slate-600">
            Para segurança da sua empresa e dos seus clientes, precisamos validar seu WhatsApp. Isso é feito apenas uma vez.
          </p>
        </div>

        <div className="space-y-4">
          {success ? (
            <div className="text-center py-4">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-green-700 font-medium mb-2">Telefone verificado com sucesso!</p>
              <p className="text-sm text-slate-600">Redirecionando para o dashboard...</p>
            </div>
          ) : (
            <>
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
                      disabled={isLoading}
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
                    disabled={isLoading || !phone}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
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
                      disabled={isLoading}
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
                      disabled={isLoading}
                      className="flex-1"
                    >
                      Voltar
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleVerifyCode}
                      disabled={isLoading || code.length !== 6}
                      className="flex-1 flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
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
                    disabled={isLoading}
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
