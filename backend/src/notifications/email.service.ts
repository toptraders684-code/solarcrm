import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    const user = config.get<string>('gmail.user');
    const pass = config.get<string>('gmail.appPassword');

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
      });
    } else {
      this.logger.warn('Gmail credentials not configured — email will be logged only');
    }
  }

  async sendOtp(to: string, otp: string): Promise<void> {
    await this.send(to, 'Your OTP for Suryam CRM Login', `
      <p>Your OTP is: <strong>${otp}</strong></p>
      <p>Valid for 10 minutes. Do not share with anyone.</p>
    `);
  }

  async sendLeadAssigned(to: string, leadName: string, assignedBy: string): Promise<void> {
    await this.send(to, `Lead Assigned: ${leadName}`, `
      <p>A new lead <strong>${leadName}</strong> has been assigned to you by ${assignedBy}.</p>
      <p>Login to Suryam CRM to view details.</p>
    `);
  }

  async sendStageAdvanced(to: string, applicantCode: string, newStage: string): Promise<void> {
    await this.send(to, `Stage Update: ${applicantCode}`, `
      <p>Applicant <strong>${applicantCode}</strong> has moved to stage: <strong>${newStage}</strong>.</p>
    `);
  }

  async sendTransactionPendingApproval(to: string, amount: number, description: string): Promise<void> {
    await this.send(to, 'Transaction Pending Approval', `
      <p>A transaction of <strong>₹${amount}</strong> is pending your approval.</p>
      <p>Description: ${description}</p>
    `);
  }

  async sendCustomerUploadLink(to: string, link: string, applicantCode: string): Promise<void> {
    await this.send(to, `Document Upload Request — ${applicantCode}`, `
      <p>Please upload your documents for application <strong>${applicantCode}</strong>.</p>
      <p><a href="${link}">Click here to upload</a></p>
      <p>This link is valid for 24 hours.</p>
    `);
  }

  async sendAccountApproved(to: string, fullName: string): Promise<void> {
    await this.send(to, 'Your Suryam CRM Account is Approved', `
      <p>Dear ${fullName},</p>
      <p>Your account has been approved. You can now login at your CRM URL.</p>
    `);
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    const from = `"Suryam CRM" <${this.config.get('gmail.user')}>`;

    if (!this.transporter) {
      this.logger.log(`[EMAIL MOCK] To: ${to} | Subject: ${subject}`);
      return;
    }

    try {
      await this.transporter.sendMail({ from, to, subject, html });
    } catch (err: any) {
      this.logger.error(`Failed to send email to ${to}: ${err?.message || err}`);
    }
  }
}
