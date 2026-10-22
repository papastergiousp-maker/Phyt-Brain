

export type UserRole = 'farmer' | 'farmer-pro' | 'agronomist' | 'agronomist-trial' | 'agronomist-premium' | 'company';

export const userRoles: { value: UserRole; label: string }[] = [
  { value: 'farmer', label: 'Αγρότης' },
  { value: 'farmer-pro', label: 'Αγρότης Pro' },
  { value: 'agronomist', label: 'Γεωπόνος' },
  { value: 'agronomist-trial', label: 'Γεωπόνος (Δοκιμή)' },
  { value: 'agronomist-premium', label: 'Γεωπόνος Premium' },
  { value: 'company', label: 'Εταιρεία' },
];
