/**
 * Zod Validation Schemas
 *
 * This file contains all Zod schemas for validating data throughout the application.
 * These schemas are used for:
 * - API request validation
 * - Form validation
 * - Database insert/update validation
 * - LLM tool parameter validation
 */

import { z } from 'zod';

// ============================================================================
// COMMON TYPES
// ============================================================================

export const UserTypeSchema = z.enum(['client', 'venue', 'vendor', 'system']);
export type UserType = z.infer<typeof UserTypeSchema>;

export const AddressSchema = z.object({
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(2, 'State is required').max(2, 'State must be 2 characters'),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format'),
  country: z.string().default('USA'),
});
export type Address = z.infer<typeof AddressSchema>;

export const PersonSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  role: z.string().min(1, 'Role is required'),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
});
export type Person = z.infer<typeof PersonSchema>;

export const ContactPersonSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  role: z.string().min(1, 'Role is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(1, 'Phone is required'),
  is_primary: z.boolean().default(false),
});
export type ContactPerson = z.infer<typeof ContactPersonSchema>;

// ============================================================================
// CLIENT SCHEMAS
// ============================================================================

export const ClientPreferencesSchema = z.object({
  people: z.array(PersonSchema).default([]),
  food: z.string().default(''),
  notes: z.string().default(''),
});
export type ClientPreferences = z.infer<typeof ClientPreferencesSchema>;

export const ClientSchema = z.object({
  client_id: z.string().uuid(),
  name: z.string().min(3, 'Name must be at least 3 characters'),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  credit_card_stripe_id: z.string().nullable().optional(),
  billing_address: AddressSchema.nullable().optional(),
  preferences: ClientPreferencesSchema.default({ people: [], food: '', notes: '' }),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable().optional(),
});
export type Client = z.infer<typeof ClientSchema>;

export const CreateClientSchema = ClientSchema.omit({
  client_id: true,
  created_at: true,
  updated_at: true,
  deleted_at: true,
});
export type CreateClient = z.infer<typeof CreateClientSchema>;

export const UpdateClientSchema = CreateClientSchema.partial();
export type UpdateClient = z.infer<typeof UpdateClientSchema>;

// ============================================================================
// VENUE SCHEMAS
// ============================================================================

export const VenueSchema = z.object({
  venue_id: z.string().uuid(),
  name: z.string().min(3, 'Venue name must be at least 3 characters'),
  description: z.string().nullable().optional(),
  address: AddressSchema,
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable().optional(),
});
export type Venue = z.infer<typeof VenueSchema>;

export const CreateVenueSchema = VenueSchema.omit({
  venue_id: true,
  created_at: true,
  updated_at: true,
  deleted_at: true,
});
export type CreateVenue = z.infer<typeof CreateVenueSchema>;

export const UpdateVenueSchema = CreateVenueSchema.partial();
export type UpdateVenue = z.infer<typeof UpdateVenueSchema>;

// ============================================================================
// VENDOR SCHEMAS
// ============================================================================

export const VendorSchema = z.object({
  vendor_id: z.string().uuid(),
  name: z.string().min(3, 'Vendor name must be at least 3 characters'),
  email: z.string().email('Invalid email format'),
  phone_number: z.string().min(10, 'Phone number must be at least 10 digits'),
  address: AddressSchema,
  description: z.string().nullable().optional(),
  contact_persons: z.array(ContactPersonSchema).default([]),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable().optional(),
});
export type Vendor = z.infer<typeof VendorSchema>;

export const CreateVendorSchema = VendorSchema.omit({
  vendor_id: true,
  created_at: true,
  updated_at: true,
  deleted_at: true,
});
export type CreateVendor = z.infer<typeof CreateVendorSchema>;

export const UpdateVendorSchema = CreateVendorSchema.partial();
export type UpdateVendor = z.infer<typeof UpdateVendorSchema>;

// ============================================================================
// EVENT SCHEMAS
// ============================================================================

export const EventStatusSchema = z.enum([
  'inquiry',
  'pending_confirmation',
  'confirmed',
  'in_planning',
  'finalized',
  'completed',
  'cancelled',
]);
export type EventStatus = z.infer<typeof EventStatusSchema>;

export const TimelineItemSchema = z.object({
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
  duration_minutes: z.number().int().positive(),
  activity: z.string().min(1, 'Activity description is required'),
  space_id: z.string().uuid().optional(),
  notes: z.string().optional(),
});
export type TimelineItem = z.infer<typeof TimelineItemSchema>;

export const EventScheduleSchema = z.object({
  date: z.string(),
  timeline: z.array(TimelineItemSchema).default([]),
});
export type EventSchedule = z.infer<typeof EventScheduleSchema>;

export const EventSchema = z.object({
  event_id: z.string().uuid(),
  name: z.string().min(3, 'Event name must be at least 3 characters'),
  description: z.string().nullable().optional(),
  date: z.string(),
  client_id: z.string().uuid().nullable().optional(),
  venue_id: z.string().uuid(),
  calendar: EventScheduleSchema.nullable().optional(),
  status: EventStatusSchema.default('inquiry'),
  rsvp_deadline: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable().optional(),
});
export type Event = z.infer<typeof EventSchema>;

export const CreateEventSchema = EventSchema.omit({
  event_id: true,
  created_at: true,
  updated_at: true,
  deleted_at: true,
});
export type CreateEvent = z.infer<typeof CreateEventSchema>;

export const UpdateEventSchema = CreateEventSchema.partial();
export type UpdateEvent = z.infer<typeof UpdateEventSchema>;

// ============================================================================
// SPACE SCHEMAS
// ============================================================================

export const PhotoSchema = z.object({
  url: z.string().url('Invalid photo URL'),
  caption: z.string().optional(),
  order: z.number().int().nonnegative(),
});
export type Photo = z.infer<typeof PhotoSchema>;

export const SpaceSchema = z.object({
  space_id: z.string().uuid(),
  venue_id: z.string().uuid(),
  name: z.string().min(1, 'Space name is required'),
  description: z.string().nullable().optional(),
  main_image_url: z.string().url().nullable().optional(),
  photos: z.array(PhotoSchema).default([]),
  floorplan_url: z.string().url().nullable().optional(),
  capacity: z.number().int().positive().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable().optional(),
});
export type Space = z.infer<typeof SpaceSchema>;

export const CreateSpaceSchema = SpaceSchema.omit({
  space_id: true,
  created_at: true,
  updated_at: true,
  deleted_at: true,
});
export type CreateSpace = z.infer<typeof CreateSpaceSchema>;

export const UpdateSpaceSchema = CreateSpaceSchema.partial();
export type UpdateSpace = z.infer<typeof UpdateSpaceSchema>;

// ============================================================================
// ELEMENT SCHEMAS
// ============================================================================

export const SeasonalPricingSchema = z.object({
  start_date: z.string(),
  end_date: z.string(),
  price_multiplier: z.number().positive(),
});
export type SeasonalPricing = z.infer<typeof SeasonalPricingSchema>;

export const AvailabilityRulesSchema = z.object({
  lead_time_days: z.number().int().nonnegative().default(0),
  blackout_dates: z.array(z.string()).optional(),
  seasonal_pricing: z.array(SeasonalPricingSchema).optional(),
});
export type AvailabilityRules = z.infer<typeof AvailabilityRulesSchema>;

export const ElementSchema = z.object({
  element_id: z.string().uuid(),
  venue_vendor_id: z.string().uuid(),
  name: z.string().min(1, 'Element name is required'),
  category: z.string().nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  price: z.number().nonnegative().default(0),
  description: z.string().nullable().optional(),
  files: z.array(z.any()).default([]),
  contract: z.any().nullable().optional(),
  availability_rules: AvailabilityRulesSchema.default({ lead_time_days: 0 }),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable().optional(),
});
export type Element = z.infer<typeof ElementSchema>;

export const CreateElementSchema = ElementSchema.omit({
  element_id: true,
  created_at: true,
  updated_at: true,
  deleted_at: true,
});
export type CreateElement = z.infer<typeof CreateElementSchema>;

export const UpdateElementSchema = CreateElementSchema.partial();
export type UpdateElement = z.infer<typeof UpdateElementSchema>;

// ============================================================================
// EVENT ELEMENT SCHEMAS
// ============================================================================

export const ElementStatusSchema = z.enum([
  'to-do',
  'in_progress',
  'completed',
  'needs_attention',
]);
export type ElementStatus = z.infer<typeof ElementStatusSchema>;

export const EventElementSchema = z.object({
  event_element_id: z.string().uuid(),
  event_id: z.string().uuid(),
  element_id: z.string().uuid(),
  status: ElementStatusSchema.default('to-do'),
  customization: z.string().nullable().optional(),
  amount: z.number().nonnegative(),
  contract_completed: z.boolean().default(false),
  notes: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type EventElement = z.infer<typeof EventElementSchema>;

export const CreateEventElementSchema = EventElementSchema.omit({
  event_element_id: true,
  created_at: true,
  updated_at: true,
});
export type CreateEventElement = z.infer<typeof CreateEventElementSchema>;

export const UpdateEventElementSchema = CreateEventElementSchema.partial();
export type UpdateEventElement = z.infer<typeof UpdateEventElementSchema>;

// ============================================================================
// TASK SCHEMAS
// ============================================================================

export const TaskStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'cancelled']);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const PrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);
export type Priority = z.infer<typeof PrioritySchema>;

export const TaskSchema = z.object({
  task_id: z.string().uuid(),
  event_id: z.string().uuid(),
  assigned_to_id: z.string().uuid(),
  assigned_to_type: UserTypeSchema,
  status: TaskStatusSchema.default('pending'),
  name: z.string().min(1, 'Task name is required'),
  description: z.string().min(1, 'Task description is required'),
  form_schema: z.any().nullable().optional(),
  form_response: z.any().nullable().optional(),
  priority: PrioritySchema.default('medium'),
  due_date: z.string().nullable().optional(),
  created_by: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  completed_at: z.string().nullable().optional(),
});
export type Task = z.infer<typeof TaskSchema>;

export const CreateTaskSchema = TaskSchema.omit({
  task_id: true,
  created_at: true,
  updated_at: true,
  completed_at: true,
});
export type CreateTask = z.infer<typeof CreateTaskSchema>;

export const UpdateTaskSchema = CreateTaskSchema.partial();
export type UpdateTask = z.infer<typeof UpdateTaskSchema>;

// ============================================================================
// GUEST SCHEMAS
// ============================================================================

export const RSVPStatusSchema = z.enum(['yes', 'no', 'undecided']);
export type RSVPStatus = z.infer<typeof RSVPStatusSchema>;

export const GuestSchema = z.object({
  guest_id: z.string().uuid(),
  event_id: z.string().uuid(),
  name: z.string().min(1, 'Guest name is required'),
  title: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  notes: z.string().nullable().optional(),
  rsvp_status: RSVPStatusSchema.default('undecided'),
  dietary_restrictions: z.string().nullable().optional(),
  plus_one: z.boolean().default(false),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Guest = z.infer<typeof GuestSchema>;

export const CreateGuestSchema = GuestSchema.omit({
  guest_id: true,
  created_at: true,
  updated_at: true,
});
export type CreateGuest = z.infer<typeof CreateGuestSchema>;

export const UpdateGuestSchema = CreateGuestSchema.partial();
export type UpdateGuest = z.infer<typeof UpdateGuestSchema>;

// ============================================================================
// MESSAGE SCHEMAS
// ============================================================================

export const AttachmentSchema = z.object({
  url: z.string().url(),
  filename: z.string(),
  mimetype: z.string(),
  size: z.number().int().positive(),
});
export type Attachment = z.infer<typeof AttachmentSchema>;

export const MessageSchema = z.object({
  message_id: z.string().uuid(),
  thread_id: z.string().uuid(),
  event_id: z.string().uuid().nullable().optional(),
  sender_id: z.string().uuid(),
  sender_type: UserTypeSchema,
  recipient_id: z.string().uuid(),
  recipient_type: UserTypeSchema,
  content: z.string().min(1, 'Message content is required'),
  attachments: z.array(AttachmentSchema).default([]),
  action_required: z.boolean().default(false),
  suggested_response: z.string().nullable().optional(),
  read: z.boolean().default(false),
  created_at: z.string(),
});
export type Message = z.infer<typeof MessageSchema>;

export const CreateMessageSchema = MessageSchema.omit({
  message_id: true,
  created_at: true,
});
export type CreateMessage = z.infer<typeof CreateMessageSchema>;

// ============================================================================
// NOTIFICATION SCHEMAS
// ============================================================================

export const NotificationSchema = z.object({
  notification_id: z.string().uuid(),
  user_id: z.string().uuid(),
  user_type: UserTypeSchema,
  notification_type: z.string(),
  title: z.string().min(1, 'Notification title is required'),
  content: z.string().min(1, 'Notification content is required'),
  read: z.boolean().default(false),
  action_url: z.string().nullable().optional(),
  created_at: z.string(),
});
export type Notification = z.infer<typeof NotificationSchema>;

export const CreateNotificationSchema = NotificationSchema.omit({
  notification_id: true,
  created_at: true,
});
export type CreateNotification = z.infer<typeof CreateNotificationSchema>;

// ============================================================================
// INVITATION SCHEMAS
// ============================================================================

export const InvitationTypeSchema = z.enum(['venue', 'vendor', 'client']);
export type InvitationType = z.infer<typeof InvitationTypeSchema>;

export const InvitationStatusSchema = z.enum(['pending', 'accepted', 'declined', 'expired']);
export type InvitationStatus = z.infer<typeof InvitationStatusSchema>;

export const InvitationSchema = z.object({
  invitation_id: z.string().uuid(),
  token: z.string().min(32, 'Token must be at least 32 characters'),
  invitee_email: z.string().email('Invalid email format'),
  invited_by: z.string().uuid(),
  invitation_type: InvitationTypeSchema,
  status: InvitationStatusSchema.default('pending'),
  expires_at: z.string(),
  used_at: z.string().nullable().optional(),
  metadata: z.any().nullable().optional(),
  created_at: z.string(),
});
export type Invitation = z.infer<typeof InvitationSchema>;

export const CreateInvitationSchema = InvitationSchema.omit({
  invitation_id: true,
  created_at: true,
  used_at: true,
});
export type CreateInvitation = z.infer<typeof CreateInvitationSchema>;

// ============================================================================
// AUTHENTICATION SCHEMAS
// ============================================================================

export const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');

export const SignUpSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: PasswordSchema,
  name: z.string().min(3, 'Name must be at least 3 characters'),
  user_type: UserTypeSchema,
});
export type SignUp = z.infer<typeof SignUpSchema>;

export const SignInSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});
export type SignIn = z.infer<typeof SignInSchema>;

export const MagicLinkSchema = z.object({
  email: z.string().email('Invalid email format'),
  user_type: UserTypeSchema,
});
export type MagicLink = z.infer<typeof MagicLinkSchema>;

// ============================================================================
// ACTION HISTORY SCHEMAS
// ============================================================================

export const ActionHistorySchema = z.object({
  action_id: z.string().uuid(),
  event_id: z.string().uuid().nullable().optional(),
  user_id: z.string().uuid().nullable().optional(),
  user_type: UserTypeSchema.nullable().optional(),
  action_type: z.string().min(1, 'Action type is required'),
  description: z.string().min(1, 'Description is required'),
  metadata: z.any().nullable().optional(),
  created_at: z.string(),
});
export type ActionHistory = z.infer<typeof ActionHistorySchema>;

export const CreateActionHistorySchema = ActionHistorySchema.omit({
  action_id: true,
  created_at: true,
});
export type CreateActionHistory = z.infer<typeof CreateActionHistorySchema>;
