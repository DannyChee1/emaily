/**
 * Encryption utilities for secure storage
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

/**
 * Get encryption key from environment
 */
function getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
        throw new Error('ENCRYPTION_KEY not set in environment');
    }
    
    // Ensure key is 32 bytes
    return crypto.createHash('sha256').update(key).digest();
}

/**
 * Encrypt a string
 * @param text - Plain text to encrypt
 * @returns Encrypted text with IV and auth tag
 */
export function encrypt(text: string): string {
    if (!text) return '';
    
    try {
        const key = getEncryptionKey();
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        // Combine IV + encrypted data + auth tag
        return iv.toString('hex') + ':' + encrypted + ':' + authTag.toString('hex');
        
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt data');
    }
}

/**
 * Decrypt a string
 * @param encryptedText - Encrypted text with IV and auth tag
 * @returns Decrypted plain text
 */
export function decrypt(encryptedText: string): string {
    if (!encryptedText) return '';
    
    try {
        const key = getEncryptionKey();
        const parts = encryptedText.split(':');
        
        if (parts.length !== 3) {
            throw new Error('Invalid encrypted text format');
        }
        
        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];
        const authTag = Buffer.from(parts[2], 'hex');
        
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
        
    } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Failed to decrypt data');
    }
}

/**
 * Hash a password or sensitive string
 * @param text - Text to hash
 * @returns Hashed text
 */
export function hash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Generate a random token
 * @param length - Length in bytes
 * @returns Random hex token
 */
export function generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
}

