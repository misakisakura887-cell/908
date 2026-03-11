import { db } from '../../lib/db.js'
import { redis } from '../../lib/redis.js'
import { sendVerificationEmail } from '../../lib/email.js'
import { ethers } from 'ethers'

const CODE_TTL = 600 // 10 minutes
const RATE_LIMIT_TTL = 60 // 1 minute between sends
const NONCE_TTL = 300 // 5 minutes

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function generateNonceMessage(walletAddress: string, nonce: string): string {
  return `Welcome to Mirror AI!\n\nSign this message to authenticate.\n\nWallet: ${walletAddress}\nNonce: ${nonce}\nTimestamp: ${Date.now()}`
}

export const authService = {
  async sendVerificationCode(email: string): Promise<{ success: boolean; error?: string }> {
    // Rate limit check
    const rateLimitKey = `mirror:auth:ratelimit:${email}`
    const existing = await redis.get(rateLimitKey)
    
    if (existing) {
      return { success: false, error: '请稍后再试' }
    }
    
    // Generate code
    const code = generateCode()
    
    // Store in Redis
    const codeKey = `mirror:auth:code:${email}`
    await redis.setex(codeKey, CODE_TTL, code)
    await redis.setex(rateLimitKey, RATE_LIMIT_TTL, '1')
    
    // Send email
    const sent = await sendVerificationEmail(email, code)
    
    if (!sent) {
      return { success: false, error: '邮件发送失败，请稍后再试' }
    }
    
    // Also store in DB for audit
    await db.emailVerification.create({
      data: {
        email,
        code,
        type: 'login',
        expiresAt: new Date(Date.now() + CODE_TTL * 1000),
      }
    })
    
    return { success: true }
  },

  async verifyCode(email: string, code: string): Promise<{ 
    success: boolean
    error?: string
    user?: { id: string; email: string; usdtBalance: any }
  }> {
    // Check code in Redis
    const codeKey = `mirror:auth:code:${email}`
    const storedCode = await redis.get(codeKey)
    
    if (!storedCode || storedCode !== code) {
      return { success: false, error: '验证码错误或已过期' }
    }
    
    // Delete used code
    await redis.del(codeKey)
    
    // Mark verification as used
    await db.emailVerification.updateMany({
      where: { email, code, usedAt: null },
      data: { usedAt: new Date() }
    })
    
    // Find or create user
    let user = await db.user.findUnique({ where: { email } })
    
    if (!user) {
      user = await db.user.create({
        data: {
          email,
          emailVerified: true,
        }
      })
    } else if (!user.emailVerified) {
      user = await db.user.update({
        where: { id: user.id },
        data: { emailVerified: true }
      })
    }
    
    // Create audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'login',
        details: { method: 'email_code' },
      }
    })
    
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        usdtBalance: user.usdtBalance,
      }
    }
  },

  async getUserById(userId: string) {
    return db.user.findUnique({ where: { id: userId } })
  },

  async generateNonce(walletAddress: string): Promise<string> {
    const nonce = ethers.hexlify(ethers.randomBytes(16))
    const message = generateNonceMessage(walletAddress, nonce)
    
    const nonceKey = `mirror:auth:nonce:${walletAddress.toLowerCase()}`
    await redis.setex(nonceKey, NONCE_TTL, message)
    
    return message
  },

  async verifyWalletSignature(
    walletAddress: string,
    message: string,
    signature: string
  ): Promise<{
    success: boolean
    error?: string
    user?: { id: string; walletAddress: string | null; email: string | null; usdtBalance: any }
  }> {
    try {
      // 验证 nonce 是否存在且未过期
      const nonceKey = `mirror:auth:nonce:${walletAddress.toLowerCase()}`
      const storedMessage = await redis.get(nonceKey)
      
      if (!storedMessage || storedMessage !== message) {
        return { success: false, error: 'Nonce 已过期或无效' }
      }
      
      // 验证签名 (EIP-191)
      const recoveredAddress = ethers.verifyMessage(message, signature)
      
      if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        return { success: false, error: '签名验证失败' }
      }
      
      // 删除已使用的 nonce
      await redis.del(nonceKey)
      
      // 查找或创建用户
      const lowerWalletAddress = walletAddress.toLowerCase()
      let user = await db.user.findUnique({ where: { walletAddress: lowerWalletAddress } })
      
      if (!user) {
        user = await db.user.create({
          data: {
            walletAddress: lowerWalletAddress,
          }
        })
      }
      
      // 创建审计日志
      await db.auditLog.create({
        data: {
          userId: user.id,
          action: 'login',
          details: { method: 'wallet', walletAddress: lowerWalletAddress },
        }
      })
      
      return {
        success: true,
        user: {
          id: user.id,
          walletAddress: user.walletAddress,
          email: user.email,
          usdtBalance: user.usdtBalance,
        }
      }
    } catch (error) {
      console.error('Wallet signature verification error:', error)
      return { success: false, error: '签名验证失败' }
    }
  }
}
