import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <>
      <style>{`
        .main-layout-container {
          min-height: 100vh;
          background-color: hsl(var(--background));
        }

        .main-layout-content {
          display: flex;
        }

        .main-layout-main {
          flex: 1;
          margin-left: 16rem;
          margin-top: 3.5rem;
          padding: 1.5rem;
        }
      `}</style>

      <div className="main-layout-container">
        <Header />
        <div className="main-layout-content">
          <Sidebar />
          <main className="main-layout-main">
            {children}
          </main>
        </div>
      </div>
    </>
  );
};