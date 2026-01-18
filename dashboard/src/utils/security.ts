/**
 * Security utilities for anti-fraud protection
 */

// List of known disposable/temporary email domains
const DISPOSABLE_EMAIL_DOMAINS = [
  'yopmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'temp-mail.org',
  'mailinator.com',
  'superrito.com',
  'tempmail.com',
  'throwaway.email',
  'maildrop.cc',
  'trashmail.com',
  'getnada.com',
  'mohmal.com',
  'fakeinbox.com',
  'tempail.com',
  'sharklasers.com',
  'guerrillamailblock.com',
  'pokemail.net',
  'spam4.me',
  'bccto.me',
  'chitthi.in',
  'dispostable.com',
  'fakeinbox.com',
  'fakemailgenerator.com',
  'mintemail.com',
  'mytrashmail.com',
  'tempinbox.com',
  'tempmailaddress.com',
];

/**
 * Validates if an email domain is disposable/temporary
 * @param email - Email address to validate
 * @returns true if email is valid (not disposable), false if disposable
 */
export function validateEmailDomain(email: string): { valid: boolean; reason?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, reason: 'Email inválido' };
  }

  // Extract domain from email
  const emailParts = email.toLowerCase().trim().split('@');
  if (emailParts.length !== 2) {
    return { valid: false, reason: 'Formato de email inválido' };
  }

  const domain = emailParts[1];

  // Check if domain is in the blocklist
  if (DISPOSABLE_EMAIL_DOMAINS.includes(domain)) {
    return { 
      valid: false, 
      reason: 'Emails temporários não são permitidos. Use um email pessoal ou corporativo.' 
    };
  }

  return { valid: true };
}

/**
 * Sanitizes a phone number by removing all non-numeric characters
 * @param phone - Phone number to sanitize
 * @returns Sanitized phone number (digits only)
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return '';
  // Remove all non-numeric characters
  return phone.replace(/\D/g, '');
}

/**
 * Formats phone for storage (Brazilian format: removes country code if present)
 * @param phone - Phone number
 * @returns Formatted phone for registry
 */
export function formatPhoneForRegistry(phone: string): string {
  const sanitized = sanitizePhone(phone);
  // If starts with 55 (Brazil country code), remove it
  if (sanitized.startsWith('55') && sanitized.length > 10) {
    return sanitized.substring(2);
  }
  return sanitized;
}

/**
 * Sanitizes CNPJ/CPF by removing all non-numeric characters
 * @param taxId - CNPJ or CPF to sanitize
 * @returns Sanitized tax ID (digits only)
 */
export function sanitizeTaxId(taxId: string): string {
  if (!taxId) return '';
  // Remove all non-numeric characters
  return taxId.replace(/\D/g, '');
}

/**
 * Validates CNPJ format (14 digits) or CPF format (11 digits)
 * @param taxId - CNPJ or CPF to validate
 * @returns true if format is valid
 */
export function validateTaxIdFormat(taxId: string): boolean {
  const sanitized = sanitizeTaxId(taxId);
  // CNPJ has 14 digits, CPF has 11 digits
  return sanitized.length === 14 || sanitized.length === 11;
}

/**
 * Checks if a phone number is already registered
 * @param phone - Phone number to check
 * @returns Promise that resolves to true if phone is already registered
 */
export async function isPhoneRegistered(phone: string): Promise<boolean> {
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const { db } = await import('../lib/firebase');
    
    const formattedPhone = formatPhoneForRegistry(phone);
    const phoneDoc = await getDoc(doc(db, 'phone_registry', formattedPhone));
    return phoneDoc.exists();
  } catch (error) {
    console.error('Error checking phone registration:', error);
    return false; // Fail open (allow) if check fails
  }
}

/**
 * Checks if a tax ID (CNPJ/CPF) is already registered
 * @param taxId - Tax ID to check
 * @param currentUserId - Current user ID (optional, to allow same user)
 * @returns Promise that resolves to { exists: boolean, userId?: string } if tax ID exists
 */
export async function isTaxIdRegistered(taxId: string, currentUserId?: string): Promise<{ exists: boolean; userId?: string }> {
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const { db } = await import('../lib/firebase');
    
    const sanitized = sanitizeTaxId(taxId);
    if (!sanitized) {
      return { exists: false };
    }
    
    const taxDoc = await getDoc(doc(db, 'tax_id_registry', sanitized));
    
    if (!taxDoc.exists()) {
      return { exists: false };
    }
    
    const data = taxDoc.data();
    
    // If it's the same user, allow (they can update their own)
    if (currentUserId && data.userId === currentUserId) {
      return { exists: false };
    }
    
    return { exists: true, userId: data.userId };
  } catch (error) {
    console.error('Error checking tax ID registration:', error);
    return { exists: false }; // Fail open (allow) if check fails
  }
}
