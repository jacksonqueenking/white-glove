import { z } from 'zod';

// Password validation schema as per authentication.md requirements
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');

// Email validation
export const emailSchema = z.string().email('Valid email required');

// Phone validation
export const phoneSchema = z
  .string()
  .regex(/^[0-9-()+\s]+$/, 'Valid phone number required');

// User type
export const userTypeSchema = z.enum(['client', 'venue', 'vendor', 'admin']);

// Magic link login schema
export const magicLinkSchema = z.object({
  email: emailSchema,
  userType: userTypeSchema,
  redirectTo: z.string().optional(),
});

// Password login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Password signup schema
export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  name: z.string().min(2, 'Name is required'),
  userType: userTypeSchema,
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Client confirmation schema
export const clientConfirmationSchema = z.object({
  token: z.string().min(1, 'Confirmation token is required'),
  authMethod: z.enum(['magic', 'password']),
  password: passwordSchema.optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.authMethod === 'password') {
    return data.password && data.confirmPassword && data.password === data.confirmPassword;
  }
  return true;
}, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Venue registration schema
export const venueRegistrationSchema = z.object({
  token: z.string().min(1, 'Invitation token is required'),
  name: z.string().min(3, 'Venue name must be at least 3 characters'),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  phone: phoneSchema,
  contactName: z.string().min(2, 'Contact name is required'),
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().length(2, 'State must be 2 characters'),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Valid ZIP code required'),
  description: z.string().min(10, 'Please provide a brief description'),
  spaces: z.array(z.object({
    name: z.string(),
    description: z.string(),
    capacity: z.number(),
    main_image_url: z.string().optional(),
  })).optional(),
  offerings: z.array(z.object({
    name: z.string(),
    category: z.string(),
    price: z.number(),
    description: z.string(),
    lead_time_days: z.number().optional(),
  })).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Vendor registration schema
export const vendorRegistrationSchema = z.object({
  token: z.string().min(1, 'Invitation token is required'),
  name: z.string().min(3, 'Business name must be at least 3 characters'),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  phone: phoneSchema,
  contactName: z.string().min(2, 'Contact name is required'),
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().length(2, 'State must be 2 characters'),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Valid ZIP code required'),
  description: z.string().min(10, 'Please provide a brief description'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Password reset schema
export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

export const passwordResetSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Address validation
export const addressSchema = z.object({
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().length(2, 'State must be 2 characters'),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Valid ZIP code required'),
  country: z.string().default('US'),
});

// Types
export type UserType = z.infer<typeof userTypeSchema>;
export type MagicLinkInput = z.infer<typeof magicLinkSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ClientConfirmationInput = z.infer<typeof clientConfirmationSchema>;
export type VenueRegistrationInput = z.infer<typeof venueRegistrationSchema>;
export type VendorRegistrationInput = z.infer<typeof vendorRegistrationSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
export type Address = z.infer<typeof addressSchema>;
