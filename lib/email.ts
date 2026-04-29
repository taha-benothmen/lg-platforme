import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

// Charger les variables d'environnement
dotenv.config()

interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
  tls?: {
    rejectUnauthorized: boolean
  }
  connectionTimeout?: number
  greetingTimeout?: number
  socketTimeout?: number
}

interface EmailData {
  to: string
  subject: string
  html: string
  text?: string
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null
  private config: EmailConfig

  constructor() {
    this.config = {
      host: process.env.SMTP_HOST || 'ssl0.ovh.net',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: true,
      auth: {
        user: process.env.SMTP_USER || 'admin@lgetu.tn',
        pass: process.env.SMTP_PASSWORD || ''
      },
      tls: {
        rejectUnauthorized: false
      }
    }
  }

  private async initializeTransporter(): Promise<nodemailer.Transporter> {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport(this.config)
      console.log('Email transporter created (verification skipped)')
    }
    return this.transporter
  }

  async sendEmail(emailData: EmailData): Promise<void> {
    try {
      const transporter = await this.initializeTransporter()
      
      const mailOptions = {
        from: `"LG Platform" <${this.config.auth.user}>`,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text || this.generateTextFromHtml(emailData.html)
      }

      await transporter.sendMail(mailOptions)
      console.log(`Email sent successfully to ${emailData.to}`)
    } catch (error) {
      console.error('Error sending email:', error)
      throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private generateTextFromHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim()
  }

  async sendCredentialsEmail(to: string, firstName: string, email: string, password: string, role: string): Promise<void> {
    const html = this.generateCredentialsEmailTemplate(firstName, email, password, role)
    
    await this.sendEmail({
      to,
      subject: 'Vos identifiants de connexion - LG Platform',
      html
    })
  }

  private generateCredentialsEmailTemplate(firstName: string, email: string, password: string, role: string): string {
    const roleLabel = role === 'RESPONSABLE' ? 'Responsable' : role === 'ADMIN' ? 'Administrateur' : 'Établissement'
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Vos identifiants - LG Platform</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1e3c72; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px; }
          .credentials { background: #667eea; color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .credential-item { background: rgba(255,255,255,0.9); color: #333; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .label { font-weight: bold; color: #667eea; margin-bottom: 5px; }
          .value { font-family: monospace; font-size: 16px; word-break: break-all; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { background: #2c3e50; color: white; padding: 20px; text-align: center; border-radius: 8px; margin-top: 20px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>LG Platform</h1>
        </div>
        
        <div class="content">
          <p>Bonjour${firstName ? ' ' + firstName : ''},</p>
          
          <p>Votre compte ${roleLabel} a été créé sur LG Platform.</p>
          
          <div class="credentials">
            <h3>Vos identifiants</h3>
            
            <div class="credential-item">
              <div class="label">Email</div>
              <div class="value">${email}</div>
            </div>
            
            <div class="credential-item">
              <div class="label">Mot de passe</div>
              <div class="value">${password}</div>
            </div>
            
            <div class="credential-item">
              <div class="label">Rôle</div>
              <div class="value">${roleLabel}</div>
            </div>
          </div>
          
          <p style="color: #d63031; font-weight: bold;">
            ⚠️ Important : Conservez ces identifiants en sécurité.
          </p>
          
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/login" class="button">
            Se connecter
          </a>
          
          <p>Cordialement,<br>L'équipe LG Platform</p>
        </div>
        
        <div class="footer">
          <p>&copy; 2026 LG Platform. Tous droits réservés.</p>
        </div>
      </body>
      </html>
    `
  }
}

export const emailService = new EmailService()
