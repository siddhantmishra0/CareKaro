import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import DashboardSidebar from "./DashboardSidebar";

interface LayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
  showFooter?: boolean;
}

const Layout = ({ children, showSidebar = false, showFooter = true }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        {showSidebar && <DashboardSidebar />}
        <main className="flex-1">
          {children}
        </main>
      </div>
      {showFooter && <Footer />}
    </div>
  );
};

export default Layout;
