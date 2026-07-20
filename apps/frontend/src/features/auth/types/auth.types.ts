import { z } from 'zod';
import { loginSchema } from '../schemas/login.schema';
import { otpSchema } from '../schemas/otp.schema';
import { forgotPasswordSchema } from '../schemas/forgot-password.schema';
import { resetPasswordSchema } from '../schemas/reset-password.schema';

export type LoginInput = z.infer<typeof loginSchema>;
export type OTPInput = z.infer<typeof otpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
}
