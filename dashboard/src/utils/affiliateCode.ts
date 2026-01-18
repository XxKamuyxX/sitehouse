import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Generates a unique affiliate code for a company.
 * Format: First 3 letters of company name (uppercase) + 4 random digits
 * Example: "VID4829"
 */
export async function generateAffiliateCode(companyName: string): Promise<string> {
  // Extract first 3 letters (or use full name if less than 3 characters)
  const sanitizedName = companyName
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^A-Z]/g, ''); // Remove non-letters
  
  let prefix = sanitizedName.substring(0, 3);
  
  // If company name has less than 3 letters, pad with 'X'
  while (prefix.length < 3) {
    prefix += 'X';
  }
  
  // Generate unique code with retry logic
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    // Generate 4 random digits
    const randomDigits = Math.floor(1000 + Math.random() * 9000).toString();
    const code = `${prefix}${randomDigits}`;
    
    // Check if code already exists
    const existingCodesQuery = query(
      collection(db, 'companies'),
      where('affiliateCode', '==', code)
    );
    const existingCodesSnapshot = await getDocs(existingCodesQuery);
    
    if (existingCodesSnapshot.empty) {
      // Code is unique
      return code;
    }
    
    attempts++;
  }
  
  // If we couldn't generate a unique code after max attempts, add timestamp
  const timestamp = Date.now().toString().slice(-4);
  return `${prefix}${timestamp}`;
}

/**
 * Validates if an affiliate code format is correct
 */
export function isValidAffiliateCode(code: string): boolean {
  // Format: 3 uppercase letters + 4 digits
  return /^[A-Z]{3}\d{4}$/.test(code);
}
