import request from 'supertest';
import app from '../../app';
import { createTestUser, getAuthCookies, getAuthCookiesForRequest } from '../utils/test-helpers';
import '../setup';

describe('POST /auth/logout', () => {
  it('should logout successfully with valid session', async () => {
    const testUser = await createTestUser({
      email: 'logout@example.com',
      password: 'Password@123',
    });

    const cookies = await getAuthCookiesForRequest(app, testUser.email, testUser.password);

    const response = await request(app)
      .post('/auth/logout')
      .set('Cookie', cookies)
      .expect(200);

    expect(response.body.message).toContain('sucesso');
  });

  it('should revoke session on logout', async () => {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const testUser = await createTestUser({
      email: 'revoke@example.com',
      password: 'Password@123',
    });

    const cookies = await getAuthCookiesForRequest(app, testUser.email, testUser.password);

    // Logout
    await request(app)
      .post('/auth/logout')
      .set('Cookie', cookies)
      .expect(200);

    // Check that all sessions are revoked
    const sessions = await prisma.session.findMany({
      where: {
        userId: testUser.id,
        isRevoked: false,
      },
    });

    expect(sessions).toHaveLength(0);

    await prisma.$disconnect();
  });

  it('should clear cookies on logout', async () => {
    const testUser = await createTestUser({
      email: 'clearcookies@example.com',
      password: 'Password@123',
    });

    const cookies = await getAuthCookiesForRequest(app, testUser.email, testUser.password);

    const response = await request(app)
      .post('/auth/logout')
      .set('Cookie', cookies)
      .expect(200);

    const setCookies = response.headers['set-cookie'] as unknown as string[];

    // Check that cookies are being cleared (maxAge=0 or expires in the past)
    const accessTokenCookie = setCookies?.find((c: string) =>
      c.startsWith('access_token=')
    );
    const refreshTokenCookie = setCookies?.find((c: string) =>
      c.startsWith('refresh_token=')
    );

    // Cookies should be cleared
    expect(
      accessTokenCookie?.includes('Max-Age=0') ||
        accessTokenCookie?.includes('access_token=;')
    ).toBeTruthy();
    expect(
      refreshTokenCookie?.includes('Max-Age=0') ||
        refreshTokenCookie?.includes('refresh_token=;')
    ).toBeTruthy();
  });

  it('should return 200 even without authentication', async () => {
    // Logout é uma operação que sempre pode ser chamada,
    // mesmo sem autenticação (apenas limpa cookies)
    const response = await request(app)
      .post('/auth/logout')
      .expect(200);

    expect(response.body.message).toBeDefined();
  });

  it('should not allow using session after logout', async () => {
    const testUser = await createTestUser({
      email: 'noreuse@example.com',
      password: 'Password@123',
    });

    const cookies = await getAuthCookiesForRequest(app, testUser.email, testUser.password);

    // Logout
    await request(app)
      .post('/auth/logout')
      .set('Cookie', cookies)
      .expect(200);

    // Try to use the same cookies for a protected route
    // O middleware irá rejeitar porque a sessão não existe mais no banco
    const response = await request(app)
      .get('/auth/me')
      .set('Cookie', cookies)
      .expect(401);

    expect(response.body.error).toBeDefined();
  });
});
