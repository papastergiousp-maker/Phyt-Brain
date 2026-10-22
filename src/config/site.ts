
import type { UserRole } from '@/types';

export interface NavItem {
  title: string;
  href?: string;
  icon: string; // Changed from LucideIcon to string to avoid server-side client imports
  disabled?: boolean;
  adminOnly?: boolean;
  external?: boolean;
  target?: string;
  allowedRoles?: UserRole[];
  isAction?: boolean; // To identify items that trigger actions instead of navigating
}

export const navItems: NavItem[] = [
  { title: 'AgroAssist', href: '/dashboard', icon: 'Sparkles' },
  { title: 'Ανάλυση Αγρού', href: '/smart-crop-planning', icon: 'Map' },
  { title: 'Οι Παραγγελίες μου', href: '/my-orders', icon: 'ListOrdered' },
  { title: 'Ιστορικό', icon: 'History', isAction: true },
  { title: 'Οι Πελάτες μου', href: '/my-business/my-clients', icon: 'Briefcase', allowedRoles: ['agronomist', 'agronomist-premium', 'agronomist-trial', 'company'] },
  { title: 'Διαχείριση Προϊόντων', href: '/my-business/products', icon: 'ListOrdered' },
  { title: 'Διαχείριση Προσωπικού', href: '/my-business', icon: 'Users', allowedRoles: ['agronomist-premium', 'company'] },
  { title: 'Ρυθμίσεις', href: '/settings', icon: 'Settings' },
  { title: 'Ρυθμίσεις Διαχειριστή', href: '/admin/settings', icon: 'Edit', adminOnly: true },
];


export const siteConfig = {
  name: 'Phyt AI',
  description: 'Ο βοηθός γεωπόνου σας με τεχνητή νοημοσύνη, με προγνώσεις καιρού και ανάλυση προϊόντων.',
};
