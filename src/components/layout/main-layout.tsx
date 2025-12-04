'use client';
import React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  BarChart,
  HeartHandshake,
  ShieldCheck,
  Receipt,
  Gavel,
  FileClock,
  ScanEye,
  LifeBuoy,
  Settings,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import AppHeader from './header';

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/users', label: 'Users', icon: Users },
    { href: '/therapists', label: 'Terapeutas', icon: HeartHandshake },
    { href: '/verification', label: 'Verificação', icon: ShieldCheck },
    { href: '/billing', label: 'Billing', icon: Receipt },
    { href: '/content', label: 'Content', icon: FileText },
    { href: '/subscriptions', label: 'Subscriptions', icon: CreditCard },
    { href: '/seo', label: 'SEO', icon: BarChart },
    { href: '/legal', label: 'Legal', icon: Gavel },
    { href: '/logs', label: 'Logs', icon: FileClock },
    { href: '/moderation', label: 'Moderação', icon: ScanEye },
    { href: '/support', label: 'Suporte', icon: LifeBuoy },
    { href: '/settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="w-8 h-8 text-primary"
              fill="currentColor"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5-10-5-10 5z" />
            </svg>
            <h1 className="text-xl font-headline font-semibold">MasseurMatch</h1>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                  <SidebarMenuButton
                    isActive={pathname.startsWith(item.href)}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 flex flex-col gap-4">
           <div className="flex items-center gap-3">
             <Avatar>
              <AvatarImage src="https://picsum.photos/seed/admin/40/40" data-ai-hint="person face" />
              <AvatarFallback>A</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-semibold">Admin User</span>
              <span className="text-xs text-muted-foreground">admin@example.com</span>
            </div>
           </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <AppHeader />
        <main className="p-4 lg:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default MainLayout;
