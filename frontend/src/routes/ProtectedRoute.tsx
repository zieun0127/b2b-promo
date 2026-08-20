import { Link, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import type { Role } from '../types/domain';

interface ProtectedRouteProps {
  requiredRole?: Role;
}

export default function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

  if (!accessToken || !user) {
    return <Navigate to="/login" replace />;
  }
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }
  return (
    <>
      <nav className="app-nav">
        <Link to="/">MBTI 테스트</Link>
        <Link to="/promotions">이벤트/프로모션</Link>
        <Link to="/mypage">마이페이지</Link>
        {user.role === 'ADMIN' && <Link to="/admin/stats">관리자 통계</Link>}
        {user.role === 'ADMIN' && <Link to="/admin/promotions">프로모션 관리</Link>}
      </nav>
      <Outlet />
    </>
  );
}
