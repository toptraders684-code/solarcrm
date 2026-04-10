import { Bell, Search, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';

export function Header() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // ignore
    }
    clearAuth();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center gap-4 px-6 flex-shrink-0">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search..." className="pl-9 h-8 bg-gray-50" />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Notifications bell */}
        <Button variant="ghost" size="icon" className="relative text-gray-500 hover:text-gray-700">
          <Bell className="w-4 h-4" />
        </Button>

        {/* User avatar dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2">
              <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-brand-400 hover:ring-offset-1 transition-all">
                <AvatarFallback className="bg-brand-500 text-white text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user?.role?.replace(/_/g, ' ')}
                </p>
                {user?.email && (
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
