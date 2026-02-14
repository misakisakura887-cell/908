import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

import { authRoutes } from './routes/auth';
import { strategyRoutes } from './routes/strategies';

const fastify = Fastify({ logger: true });
const prisma = new PrismaClient();

// CORS
fastify.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
});

// JWT
fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'supersecret',
});

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Routes
fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(strategyRoutes, { prefix: '/api/strategies' });

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3001');
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Server running on http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
