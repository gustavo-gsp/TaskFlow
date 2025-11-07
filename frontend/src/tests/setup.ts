import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Cleanup após cada teste
afterEach(() => {
  cleanup();
});

// Mock do fetch global se necessário
global.fetch = global.fetch || (() => Promise.reject(new Error('Fetch não configurado')));
