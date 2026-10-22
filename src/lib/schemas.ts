import { z } from 'zod';
import type { UserRole } from '@/types';

const userRoleValues: UserRole[] = ['farmer', 'farmer-pro', 'agronomist', 'agronomist-trial', 'agronomist-premium', 'company'];
const signupRoleValues: UserRole[] = ['farmer', 'agronomist'];

export const LoginSchema = z.object({
  email: z.string().email('Το email δεν είναι έγκυρο.'),
  password: z.string().min(1, 'Ο κωδικός πρόσβασης απαιτείται.'),
  rememberMe: z.boolean().optional(),
});
export type LoginFormData = z.infer<typeof LoginSchema>;

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Το email δεν είναι έγκυρο.'),
});
export type ForgotPasswordFormData = z.infer<typeof ForgotPasswordSchema>;

export const SignupSchema = z.object({
  name: z.string().min(2, 'Το όνομα πρέπει να είναι τουλάχιστον 2 χαρακτήρες.'),
  email: z.string().email('Το email δεν είναι έγκυρο.'),
  password: z.string().min(6, 'Ο κωδικός πρόσβασης πρέπει να είναι τουλάχιστον 6 χαρακτήρες.'),
  confirmPassword: z.string().min(6, 'Η επιβεβαίωση κωδικού πρέπει να είναι τουλάχιστον 6 χαρακτήρες.'),
  role: z.enum(signupRoleValues, {
    required_error: 'Παρακαλώ επιλέξτε τον ρόλο σας.',
    invalid_type_error: "Παρακαλώ επιλέξτε έναν έγκυρο ρόλο."
  }),
  phone: z.string().min(10, 'Το τηλέφωνο πρέπει να είναι τουλάχιστον 10 ψηφία.').optional().or(z.literal('')),
  address: z.string().min(5, 'Η διεύθυνση πρέπει να είναι τουλάχιστον 5 χαρακτήρες.').optional().or(z.literal('')),
  areaSize: z.coerce.number({invalid_type_error: "Η έκταση πρέπει να είναι αριθμός."}).positive("Η έκταση πρέπει να είναι θετικός αριθμός.").optional(),
  productionTypes: z.array(z.string()).optional(),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'Πρέπει να αποδεχτείτε τους όρους χρήσης και την πολιτική απορρήτου.' }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Οι κωδικοί πρόσβασης δεν ταιριάζουν.",
  path: ["confirmPassword"], // Set the error on the confirmation field
});
export type SignupFormData = z.infer<typeof SignupSchema>;

export const ProfileUpdateSchema = z.object({
  name: z.string().min(2, 'Το όνομα πρέπει να είναι τουλάχιστον 2 χαρακτήρες.'),
  phone: z.string().min(10, 'Το τηλέφωνο πρέπει να είναι τουλάχιστον 10 ψηφία.').optional().or(z.literal('')),
  address: z.string().min(5, 'Η διεύθυνση πρέπει να είναι τουλάχιστον 5 χαρακτήρες.').optional().or(z.literal('')),
  areaSize: z.coerce.number({invalid_type_error: "Η έκταση πρέπει να είναι αριθμός."}).positive("Η έκταση πρέπει να είναι θετικός αριθμός.").optional(),
  productionTypes: z.array(z.string()).optional(),
  photoURL: z.string().url().optional().or(z.literal('')),
  role: z.enum(signupRoleValues, {
    required_error: 'Παρακαλώ επιλέξτε τον ρόλο σας.',
  }),
});
export type ProfileUpdateFormData = z.infer<typeof ProfileUpdateSchema>;


export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Ο τρέχων κωδικός απαιτείται.'),
  newPassword: z.string().min(6, 'Ο νέος κωδικός πρέπει να είναι τουλάχιστον 6 χαρακτήρες.'),
  confirmNewPassword: z.string().min(6, 'Η επιβεβαίωση νέου κωδικού πρέπει να είναι τουλάχιστον 6 χαρακτήρες.'),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Οι νέοι κωδικοί δεν ταιριάζουν.',
  path: ['confirmNewPassword'], // path of error
});
export type ChangePasswordFormData = z.infer<typeof ChangePasswordSchema>;

export const OrderItemSchema = z.object({
  productId: z.string({ required_error: "Παρακαλώ επιλέξτε προϊόν."}).min(1, "Παρακαλώ επιλέξτε προϊόν."),
  quantity: z.coerce.number({invalid_type_error: "Η ποσότητα πρέπει να είναι αριθμός."}).min(1, "Η ποσότητα πρέπει να είναι τουλάχιστον 1."),
});

export const CreateOrderSchema = z.object({
  customerName: z.string().min(3, "Το όνομα πελάτη απαιτείται."),
  shippingAddress: z.string().min(10, "Η διεύθυνση αποστολής απαιτείται."),
  notes: z.string().optional(),
  items: z.array(OrderItemSchema).min(1, "Η παραγγελία πρέπει να έχει τουλάχιστον ένα προϊόν."),
});

export type CreateOrderFormData = z.infer<typeof CreateOrderSchema>;
