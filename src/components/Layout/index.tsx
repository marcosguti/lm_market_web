import type { ReactNode } from 'react';

import Footer from '../Footer';
import Header from '../Header';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="w-full flex-1">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
