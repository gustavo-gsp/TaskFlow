import request from 'supertest';
import app from '../../app';
import { createTestUser, getAuthCookiesForRequest } from '../utils/test-helpers';
import '../setup';

describe('GET /auth/me', () => {
  it('should return user data with valid token', async () => {
    const testUser = await createTestUser({
      email: 'me@example.com',
      password: 'Password@123',
    });

    const cookies = await getAuthCookiesForRequest(app, testUser.email, testUser.password);

    const response = await request(app)
      .get('/auth/me')
      .set('Cookie', cookies)
      .expect(200);

    expect(response.body).toHaveProperty('user');
    expect(response.body.user.email).toBe(testUser.email);
    expect(response.body.user.name).toBe(testUser.name);
    expect(response.body.user).not.toHaveProperty('password');
  });

  it('should return 401 without token', async () => {
    const response = await request(app)
      .get('/auth/me')
      .expect(401);

    expect(response.body.error).toContain('Não autenticado');
  });

  it('should return 401 with invalid token', async () => {
    const response = await request(app)
      .get('/auth/me')
      .set('Cookie', ['access_token=invalid-token'])
      .expect(401);

    expect(response.body.error).toBeDefined();
  });
});
