
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/config/site';
import { useAgroStore } from '@/lib/store';
import { Edit, Home, Briefcase, UploadCloud, Settings, Users, Bot, Sparkles, ListOrdered, Map, History, type LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Home,
  Briefcase,
  UploadCloud,
  Edit,
  Settings,
  Users,
  Bot,
  Sparkles,
  ListOrdered,
  Map,
  History,
};


interface SidebarNavProps {
  items: NavItem[];
  onHistoryClick?: () => void;
}

export function SidebarNav({ items, onHistoryClick }: SidebarNavProps) {
  const pathname = usePathname();
  const { user } = useAgroStore(); 
  const isAdmin = user?.email?.toLowerCase() === (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').toLowerCase();

  if (!items?.length) {
    return null;
  }

  return (
    <SidebarMenu>
      {items.map((item, index) => {
        const Icon = iconMap[item.icon];
        
        if (!Icon) {
          return null;
        }
        
        if (!isAdmin) {
          if (item.adminOnly) {
            return null;
          }
          if (item.allowedRoles && (!user || !item.allowedRoles.includes(user.role))) {
            return null;
          }
        }
        
        const linkTarget = item.target || (item.external ? '_blank' : undefined);
        const linkRel = item.external ? 'noopener noreferrer' : undefined;

        if (item.isAction) {
           return (
             <SidebarMenuItem key={index}>
               <SidebarMenuButton
                  variant="default"
                  size="default"
                  disabled={item.disabled || !user}
                  tooltip={{ children: item.title, side: 'right', align: 'center' }}
                  aria-disabled={item.disabled}
                  className={cn(
                    'justify-start',
                    (item.disabled || !user) && 'cursor-not-allowed opacity-80'
                  )}
                  onClick={onHistoryClick}
                >
                    <Icon className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="truncate font-medium">{item.title}</span>
                </SidebarMenuButton>
             </SidebarMenuItem>
           );
        }

        return (
          item.href && (
            <SidebarMenuItem key={index}>
              <Link href={item.disabled ? '#' : item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  asChild
                  variant="default"
                  size="default"
                  isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))}
                  disabled={item.disabled}
                  tooltip={{ children: item.title, side: 'right', align: 'center' }}
                  aria-disabled={item.disabled}
                  className={cn(
                    'justify-start',
                    item.disabled && 'cursor-not-allowed opacity-80'
                  )}
                >
                  <a target={linkTarget} rel={linkRel}>
                    <Icon className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="truncate font-medium">{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          )
        );
      })}
    </SidebarMenu>
  );
}
