import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Ensure database connection
  await prisma.$connect();
});

afterAll(async () => {
  // Cleanup and disconnect - sessions primeiro devido ao foreign key
  await prisma.session.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.$disconnect();
});

afterEach(async () => {
  // Clean up after each test - sessions primeiro devido ao foreign key
  await prisma.session.deleteMany({});
  await prisma.user.deleteMany({});
});
