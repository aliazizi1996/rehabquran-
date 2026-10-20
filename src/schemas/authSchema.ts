import { z } from 'zod';

export const userRoleSchema = z.enum([
  'student',
  'teacher',
  'academic_supervisor',
  'system_admin',
  'parent',
  'quality_auditor',
]);

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(3, 'يرجى إدخال بريد إلكتروني أو رقم هاتف صحيح'),
  password: z
    .string()
    .min(6, 'كلمة المرور يجب ألا تقل عن 6 أحرف أو أرقام'),
});

export const registerSchema = z.object({
  fullName: z
    .string()
    .min(3, 'الاسم الكامل يجب أن يتكون من 3 أحرف على الأقل'),
  phone: z
    .string()
    .regex(/^(\+?[0-9]{7,15})$/, 'رقم الهاتف غير صالح'),
  email: z
    .string()
    .email('صيغة البريد الإلكتروني غير صحيحة')
    .optional()
    .or(z.literal('')),
  role: userRoleSchema,
  gender: z.enum(['male', 'female']),
  country: z.string().default('اليمن'),
  timezone: z.string().default('Asia/Aden'),
  password: z
    .string()
    .min(6, 'كلمة المرور يجب ألا تقل عن 6 خانات'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'كلمة المرور وتأكيدها غير متطابقين',
  path: ['confirmPassword'],
});

export const passwordResetSchema = z.object({
  email: z.string().email('يرجى إدخال بريد إلكتروني صالح لاستعادة الحساب'),
});

export const userProfileUpdateSchema = z.object({
  fullName: z.string().min(3).optional(),
  phone: z.string().optional(),
  gender: z.enum(['male', 'female']).optional(),
  country: z.string().optional(),
  timezone: z.string().optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  notificationPreferences: z.object({
    email: z.boolean(),
    push: z.boolean(),
    whatsapp: z.boolean(),
    halqaReminders: z.boolean(),
  }).optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type PasswordResetFormData = z.infer<typeof passwordResetSchema>;
export type UserProfileUpdateData = z.infer<typeof userProfileUpdateSchema>;
