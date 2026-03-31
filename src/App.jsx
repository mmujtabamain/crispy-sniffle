import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Demo from './pages/Demo';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Demo />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
