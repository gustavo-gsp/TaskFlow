import { PrismaClient } from '@prisma/client';
import { authService } from '../../services/auth.service';
import request from 'supertest';
import { Express } from 'express';

const prisma = new PrismaClient();

export interface TestUser {
  id: string;
  name: string;
  email: string;
  password: string; // Plain password for testing
}

/**
 * Creates a test user in the database
 */
export async function createTestUser(
  data: Partial<TestUser> = {}
): Promise<TestUser> {
  const defaultUser = {
    name: data.name || 'Test User',
    email: data.email || `test${Date.now()}@example.com`,
    password: data.password || 'Test@123',
  };

  const hashedPassword = await authService.hashPassword(defaultUser.password);

  const user = await prisma.user.create({
    data: {
      name: defaultUser.name,
      email: defaultUser.email,
      password: hashedPassword,
    },
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    password: defaultUser.password,
  };
}

/**
 * Logs in a user and returns the authentication cookies
 */
export async function getAuthCookies(
  app: Express,
  email: string,
  password: string
): Promise<string[]> {
  const response = await request(app).post('/auth/login').send({
    email,
    password,
  });

  return response.headers['set-cookie'] || [];
}

/**
 * Logs in and returns cookies in format ready for supertest
 */
export async function getAuthCookiesForRequest(
  app: Express,
  email: string,
  password: string
): Promise<string> {
  const cookies = await getAuthCookies(app, email, password);
  
  // Extract only the cookie name=value pairs
  return cookies
    .map((cookie) => {
      const match = cookie.match(/^([^=]+=[^;]+)/);
      return match ? match[1] : '';
    })
    .filter(Boolean)
    .join('; ');
}

/**
 * Extracts a specific cookie value from set-cookie headers
 */
export function extractCookie(cookies: string[], name: string): string | null {
  const cookie = cookies.find((c) => c.startsWith(`${name}=`));
  if (!cookie) return null;

  const match = cookie.match(new RegExp(`${name}=([^;]+)`));
  return match ? match[1] : null;
}

/**
 * Cleans up test data
 */
export async function cleanupDatabase(): Promise<void> {
  await prisma.session.deleteMany({});
  await prisma.user.deleteMany({});
}
