// src/app/(dashboard)/layout.tsx 
// Pastikan path import ini benar relatif terhadap file ini
import DashboardLayout from '@/components/dashboard/DashboardLayout'; 

interface DashboardRootLayoutProps {
  children: React.ReactNode;
}

export default function DashboardRootLayout({ children }: DashboardRootLayoutProps) {
  return (
    <DashboardLayout> 
      {children}
    </DashboardLayout>
  );
}