import { createBrowserRouter } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import LoginPage from '../pages/LoginPage';
import SignupPage from '../pages/SignupPage';
import MbtiTestPage from '../pages/MbtiTestPage';
import ResultPage from '../pages/ResultPage';
import MyPage from '../pages/MyPage';
import AdminStatsPage from '../pages/AdminStatsPage';
import PromotionListPage from '../pages/PromotionListPage';
import AdminPromotionManagePage from '../pages/AdminPromotionManagePage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <SignupPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/', element: <MbtiTestPage /> },
      { path: '/result', element: <ResultPage /> },
      { path: '/mypage', element: <MyPage /> },
      { path: '/promotions', element: <PromotionListPage /> },
    ],
  },
  {
    element: <ProtectedRoute requiredRole="ADMIN" />,
    children: [
      { path: '/admin/stats', element: <AdminStatsPage /> },
      { path: '/admin/promotions', element: <AdminPromotionManagePage /> },
    ],
  },
]);
