// lib/auth.ts
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '30d';

export interface UserPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  isEmailVerified?: boolean;
}

export function generateToken(payload: UserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

// Helper to generate random tokens (for email verification, password reset)
export function generateRandomToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Hash token for storage
export function hashToken(token: string): string {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
}