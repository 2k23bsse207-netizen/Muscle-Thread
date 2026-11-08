import { compare, hash } from 'bcryptjs'

// cost 2^12 — comparable strength to the scrypt settings it replaced
const ROUNDS = 12

export async function hashPassword(password: string): Promise<string> {
  return hash(password, ROUNDS)
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    return await compare(password, stored)
  } catch {
    // legacy (scrypt) or malformed hash formats make compare reject
    return false
  }
}
