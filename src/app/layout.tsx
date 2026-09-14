import '@/styles/globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { FeatureFlagsProvider } from '@/context/FeatureFlagsContext';
import { DataGridSelectionProvider } from '@/context/DataGridSelectionContext';

export const metadata = {
  title: 'Aura Heights | Luxury Real Estate & 3D PlayCanvas Virtual Walkthroughs',
  description:
    'Explore premier architectural villas, penthouses, and smart residences with interactive 3D virtual walkthroughs and verified transparent deals.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body className="bg-[#0a0d14] text-slate-100 min-h-screen selection:bg-blue-500 selection:text-white antialiased">
        <AuthProvider>
          <FeatureFlagsProvider>
            <DataGridSelectionProvider>
              {children}
            </DataGridSelectionProvider>
          </FeatureFlagsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
