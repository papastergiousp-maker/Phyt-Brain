
'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { UserNav } from '@/components/layout/user-nav';
import { navItems } from '@/config/site';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { WeatherForecast } from '@/components/weather/WeatherForecast';
import { RecentSearchesModal } from '@/components/dashboard/RecentSearchesModal';
import type { User } from '@/lib/types';
import { useAgroStore } from '@/lib/store';
import { useRouter } from 'next/navigation';

interface AppShellProps {
  children: React.ReactNode;
  user: User;
}

export function AppShell({ children, user }: AppShellProps) {
  const [isSearchModalOpen, setIsSearchModalOpen] = React.useState(false);
  const { logout } = useAgroStore();
  const router = useRouter();

  const handleSignOut = () => {
    logout();
    router.push('/login');
  };

  return (
    <>
      <Sidebar collapsible="icon" className="border-r">
        <SidebarHeader className="p-4 flex justify-center items-center gap-4 group-data-[collapsible=icon]:gap-2 group-data-[collapsible=icon]:flex-col">
          <Link
            href="/dashboard"
            aria-label="Μετάβαση στο Dashboard"
            className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md h-20 w-20 group-data-[collapsible=icon]:h-12 group-data-[collapsible=icon]:w-12 transition-all"
          >
            <Icons.Logo />
          </Link>
        </SidebarHeader>
        <SidebarContent className="p-2 justify-center">
          <SidebarNav items={navItems} onHistoryClick={() => setIsSearchModalOpen(true)} />
        </SidebarContent>
        <SidebarFooter className="p-2">
          <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start text-sidebar-foreground group-data-[collapsible=icon]:justify-center">
            <LogOut className="mr-2 h-4 w-4 group-data-[collapsible=icon]:mr-0" />
            <span className="group-data-[collapsible=icon]:hidden">Αποσύνδεση</span>
          </Button>
        </SidebarFooter>
      </Sidebar>
      <div className="flex flex-col flex-1 h-screen">
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4 md:px-8">
                <div className="flex items-center">
                <SidebarTrigger />
                </div>
                <div className="flex flex-1 items-center justify-end space-x-2 sm:space-x-4">
                  <WeatherForecast />
                  <UserNav user={user} signOut={handleSignOut} />
                </div>
            </div>
        </header>
        <main className="flex-1 overflow-y-auto">
            {children}
        </main>
      </div>
      <RecentSearchesModal isOpen={isSearchModalOpen} setIsOpen={setIsSearchModalOpen} />
    </>
  );
}
