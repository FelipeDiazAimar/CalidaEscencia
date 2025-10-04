'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Home,
  Package,
  Users,
  MessageSquareQuote,
  GalleryHorizontal,
  Sparkles,
  UserCheck,
  Gem,
  CircleDollarSign,
  ShoppingCart,
  Info,
  Megaphone,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Toaster } from 'sonner';

const navItems = [
  { href: '/adminpanel', label: 'Dashboard', icon: Home },
  { href: '/adminpanel/products', label: 'Productos', icon: Package },
  { href: '/adminpanel/names', label: 'Categorías', icon: Users },
  { href: '/adminpanel/models', label: 'Subcategorías', icon: Users },
  { href: '/adminpanel/faq', label: 'Preguntas frecuentes', icon: MessageSquareQuote },
  { href: '/adminpanel/carousel', label: 'Carrusel', icon: GalleryHorizontal },
  { href: '/adminpanel/vistaprincipal', label: 'Vista Principal', icon: Sparkles },
  { href: '/adminpanel/about', label: 'Sobre Nosotros', icon: Info },
  { href: '/adminpanel/materials', label: 'Materiales', icon: Gem },
  { href: '/adminpanel/testimonials', label: 'Nuestros clientes', icon: UserCheck },
  { href: '/adminpanel/announcementbar', label: 'Announcement Bar', icon: Megaphone },
  { href: '/adminpanel/finances', label: 'Finanzas', icon: CircleDollarSign },
  { href: '/adminpanel/orders', label: 'Pedidos', icon: ShoppingCart },
];

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Hide announcement bar when in admin panel
  useEffect(() => {
    document.body.setAttribute('data-admin', 'true');
    
    return () => {
      document.body.setAttribute('data-admin', 'false');
    };
  }, []);

  // DEVELOPMENT MODE: Skip auth check for admin access
  // TODO: Re-enable auth check when auth system is ready
  /*
  // Redirect non-admin users
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push('/');
    }
  }, [user, isAdmin, loading, router]);
  */

  // DEVELOPMENT MODE: Skip loading check
  // TODO: Re-enable loading check when auth system is ready
  /*
  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user || !isAdmin) {
    return null;
  }
  */

  return (
    <div className="min-h-screen">
      {/* Fixed Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-40">
        {/* Sidebar Header */}
        <div className="flex flex-col items-center p-4 border-b" style={{ marginTop: '80px' }}>
          <h3 className="text-sm font-bold text-black">ADMIN PANEL</h3>
        </div>
        
        {/* Sidebar Navigation */}
        <nav className="mt-6">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link 
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-gray-100 hover:text-gray-900 ${
                      isActive 
                        ? 'bg-gray-100 text-gray-900 font-medium' 
                        : 'text-gray-500'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
      
      {/* Main Content Area */}
      <div className="w-full" style={{ marginLeft: '256px' }}>
        <main className="min-h-screen p-4 md:p-6" style={{ marginRight: '288.5px' }}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminLayoutContent>{children}</AdminLayoutContent>
      <Toaster />
    </>
  );
}