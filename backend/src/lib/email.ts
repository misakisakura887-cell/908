import { Resend } from 'resend'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@mirror-ai.com'

// 如果没有配置 API Key，使用 mock 模式（开发测试用）
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null

export async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  // Mock 模式：打印验证码到控制台
  if (!resend) {
    console.log(`📧 [MOCK EMAIL] To: ${email}`)
    console.log(`📧 [MOCK EMAIL] 验证码: ${code}`)
    return true
  }
  
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Mirror AI - 验证码',
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Mirror AI 登录验证</h2>
          <p style="color: #666;">您的验证码是：</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
            ${code}
          </div>
          <p style="color: #999; font-size: 14px;">验证码 10 分钟内有效，请勿泄露给他人。</p>
        </div>
      `,
    })
    return true
  } catch (error) {
    console.error('Failed to send email:', error)
    return false
  }
}

export async function sendOrderNotification(
  type: 'deposit' | 'withdraw',
  orderNo: string,
  amount: string,
  email: string
): Promise<boolean> {
  const action = type === 'deposit' ? '入金' : '出金'
  
  if (!resend) {
    console.log(`📧 [MOCK EMAIL] ${action}订单通知 - ${orderNo} - ${amount}`)
    return true
  }
  
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Mirror AI - ${action}订单 ${orderNo}`,
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">${action}订单已创建</h2>
          <p>订单号：<strong>${orderNo}</strong></p>
          <p>金额：<strong>${amount}</strong></p>
          <p style="color: #999; font-size: 14px;">请及时处理。</p>
        </div>
      `,
    })
    return true
  } catch (error) {
    console.error('Failed to send notification:', error)
    return false
  }
}
