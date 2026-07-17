import type { ReactNode } from 'react';

import { HomeCatalogProvider } from '../../context/HomeCatalogContext';
import Footer from '../Footer';
import Header from '../Header';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <HomeCatalogProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="w-full flex-1">{children}</main>
        <Footer />
      </div>
    </HomeCatalogProvider>
  );
};

export default Layout;
