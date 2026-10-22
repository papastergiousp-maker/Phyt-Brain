
'use client';

import Link from 'next/link';
import { LogOut, Edit, Settings, Briefcase, CreditCard } from 'lucide-react'; 
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { userRoles } from '@/types'; 
import type { User } from '@/lib/store';
import { useAgroStore } from '@/lib/store';

interface UserNavProps {
    user: User;
    signOut: () => void;
}

export function UserNav({ user, signOut }: UserNavProps) {
  const router = useRouter();

  const handleLogout = () => {
    signOut();
    router.push('/login');
  };

  const isAdmin = user?.email?.toLowerCase() === (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').toLowerCase();

  const getInitials = (name?: string) => {
    if (!name && user?.email) return user.email.substring(0,2).toUpperCase();
    if (!name) return 'PA'; 
    const names = name.split(' ');
    if (names.length > 1) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const roleLabel = isAdmin ? 'Admin' : userRoles.find(r => r.value === user.role)?.label || user.role;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0"> 
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.photoURL || undefined} alt={user.name || user.email} />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount> 
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name || 'Phyt AI User'}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            <p className="text-xs leading-none text-muted-foreground capitalize pt-1">
              Ρόλος: {roleLabel}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href="/pricing" passHref>
            <DropdownMenuItem>
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Πακέτα Τιμολόγησης</span>
            </DropdownMenuItem>
          </Link>
          <Link href="/settings" passHref> 
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Ρυθμίσεις</span>
            </DropdownMenuItem>
          </Link>
          {isAdmin && (
            <Link href="/admin/settings" passHref>
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                <span>Ρυθμίσεις Διαχειριστή</span>
              </DropdownMenuItem>
            </Link>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Αποσύνδεση</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

    
