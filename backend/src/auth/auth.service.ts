import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notifications/email.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private emailService: EmailService,
  ) {}

  async requestOtp(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findFirst({ where: { email } });
    if (!user) {
      return { message: 'If this email exists, an OTP has been sent.' };
    }

    if (user.status === 'inactive') {
      throw new ForbiddenException('Account inactive. Contact admin.');
    }

    // Store OTP as a temporary refresh token (using OtpAttempt table if present, else skip for now)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // In production, store OTP hash with expiry; for now, email it
    await this.emailService.sendOtp(email, otp);

    return { message: 'If this email exists, an OTP has been sent.' };
  }

  async login(email: string, password: string, ipAddress: string) {
    const user = await this.prisma.user.findFirst({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    if (user.status === 'inactive') {
      throw new ForbiddenException('Account inactive. Contact admin.');
    }

    if (user.status === 'pending_approval') {
      throw new ForbiddenException('Account pending approval by admin.');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ForbiddenException('Account locked. Try again later or contact admin.');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Password not set. Use OTP login.');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      await this.handleFailedAttempt(user.id, user.failedLoginCount);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset failed attempts
    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lockedUntil: null },
    });

    return this.generateTokens(user);
  }

  async refresh(refreshToken: string) {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const tokenRecord = await this.prisma.refreshToken.findFirst({
      where: { tokenHash },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.revokedAt || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = tokenRecord.user;
    if (user.status !== 'active') {
      throw new UnauthorizedException('User not active');
    }

    // Revoke old token
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revokedAt: new Date() },
    });

    return this.generateTokens(user);
  }

  async logout(refreshToken: string) {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
    return { message: 'Logged out successfully' };
  }

  private async generateTokens(user: any) {
    const payload = { sub: user.id, role: user.role, companyId: user.companyId };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.config.get('jwt.accessTokenExpiry'),
    });

    const refreshTokenValue = uuidv4();
    const tokenHash = crypto.createHash('sha256').update(refreshTokenValue).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: { tokenHash, userId: user.id, expiresAt },
    });

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
      },
    };
  }

  private async handleFailedAttempt(userId: string, currentCount: number) {
    const attempts = (currentCount || 0) + 1;
    let lockedUntil: Date | null = null;

    if (attempts >= 10) {
      lockedUntil = new Date('9999-12-31');
    } else if (attempts >= 5) {
      lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
    } else if (attempts >= 3) {
      lockedUntil = new Date(Date.now() + 30 * 1000);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { failedLoginCount: attempts, lockedUntil },
    });
  }
}
