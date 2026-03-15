import { Outlet } from 'react-router-dom';
import TopBar from './TopBar.jsx';

export default function Layout() {
  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
