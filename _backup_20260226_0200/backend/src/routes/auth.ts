import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { verifyMessage } from 'viem';

const prisma = new PrismaClient();

export async function authRoutes(fastify: FastifyInstance) {
  // Get nonce for wallet signature
  fastify.post('/nonce', async (request, reply) => {
    const { walletAddress } = request.body as { walletAddress: string };

    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return reply.code(400).send({ error: 'Invalid wallet address' });
    }

    // Find or create user
    const user = await prisma.user.upsert({
      where: { walletAddress: walletAddress.toLowerCase() },
      update: {
        nonce: generateNonce(),
      },
      create: {
        walletAddress: walletAddress.toLowerCase(),
        nonce: generateNonce(),
      },
    });

    return { nonce: user.nonce };
  });

  // Verify signature and login
  fastify.post('/verify', async (request, reply) => {
    const { walletAddress, signature, message } = request.body as {
      walletAddress: string;
      signature: string;
      message: string;
    };

    if (!walletAddress || !signature || !message) {
      return reply.code(400).send({ error: 'Missing required fields' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() },
    });

    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }

    // Verify message contains correct nonce
    if (!message.includes(user.nonce)) {
      return reply.code(401).send({ error: 'Invalid nonce' });
    }

    try {
      // Verify signature using viem
      const isValid = await verifyMessage({
        address: walletAddress as `0x${string}`,
        message,
        signature: signature as `0x${string}`,
      });

      if (!isValid) {
        return reply.code(401).send({ error: 'Invalid signature' });
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLogin: new Date(),
          nonce: generateNonce(), // Refresh nonce
        },
      });

      // Generate JWT
      const token = fastify.jwt.sign({
        userId: user.id,
        walletAddress: user.walletAddress,
      });

      return {
        token,
        user: {
          id: user.id,
          walletAddress: user.walletAddress,
        },
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Signature verification failed' });
    }
  });
}

function generateNonce(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
