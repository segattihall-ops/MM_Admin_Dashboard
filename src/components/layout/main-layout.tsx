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
  LifeBuoy,
  Settings,
  LogOut,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import AppHeader from './header';

const navSections = [
  {
    title: 'Core',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/users', label: 'Users', icon: Users },
      { href: '/therapists', label: 'Therapists', icon: HeartHandshake },
      { href: '/review', label: 'Review', icon: ShieldCheck },
    ],
  },
  {
    title: 'Business',
    items: [
      { href: '/billing', label: 'Billing', icon: Receipt },
      { href: '/subscriptions', label: 'Subscriptions', icon: CreditCard },
      { href: '/logs', label: 'Logs', icon: FileClock },
    ],
  },
  {
    title: 'Content',
    items: [
      { href: '/content', label: 'Content', icon: FileText },
      { href: '/seo', label: 'SEO', icon: BarChart },
    ],
  },
  {
    title: 'Ops',
    items: [
      { href: '/support', label: 'Support', icon: LifeBuoy },
      { href: '/legal', label: 'Legal', icon: Gavel },
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

type LayoutProps = {
  children: React.ReactNode;
  adminEmail?: string;
};

function ProtectedLayout({ children, adminEmail }: LayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="icon">
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
            {navSections.map((section) => (
              <div key={section.title} className="mb-2">
                <div className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {section.title}
                </div>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <Link href={item.href}>
                      <SidebarMenuButton isActive={pathname.startsWith(item.href)} tooltip={item.label}>
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                ))}
              </div>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 flex flex-col gap-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout} tooltip="Logout">
                <LogOut />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <AppHeader adminEmail={adminEmail} onLogout={handleLogout} />
        <main className="p-4 lg:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

const MainLayout = ({ children, adminEmail }: LayoutProps) => {
  const pathname = usePathname();

  return pathname === '/login' ? <>{children}</> : <ProtectedLayout adminEmail={adminEmail}>{children}</ProtectedLayout>;
};

export default MainLayout;
