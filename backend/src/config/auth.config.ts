export const authConfig = {
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    accessTokenExpiry: '15m',
    algorithm: 'HS256' as const,
  },
  
  refreshToken: {
    expiryDays: 30, // 30 dias
    length: 64, // bytes
  },
  
  cookies: {
    accessToken: {
      name: 'access_token',
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: 15 * 60 * 1000, // 15 minutos em ms
        path: '/',
      },
    },
    refreshToken: {
      name: 'refresh_token',
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dias em ms
        path: '/',
      },
    },
  },
  
  password: {
    minLength: 8,
    bcryptRounds: 12,
  },
  
  rateLimit: {
    windowMs: 60 * 1000, // 1 minuto
    maxAttempts: 5,
  },
};
