import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import WorkspacePage from './pages/WorkspacePage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<WorkspacePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
