import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { login, ApiError } from '../api/authApi';
import { getMyLatestResult } from '../api/testSubmissionApi';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: () => login(email, password),
    onSuccess: async (data) => {
      useAuthStore
        .getState()
        .setAuth({ access_token: data.access_token, refresh_token: data.refresh_token }, data.user);
      const latestResult = await getMyLatestResult().catch(() => null);
      navigate(latestResult ? '/promotions' : '/', { replace: true });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1 className="auth-title">사장님 MBTI</h1>

        <label className="auth-field">
          이메일
          <input
            className="auth-input"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label className="auth-field">
          비밀번호
          <input
            className="auth-input"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {mutation.isError && (
          <p className="auth-error">{(mutation.error as ApiError).message}</p>
        )}

        <button className="auth-button" type="submit" disabled={mutation.isPending}>
          로그인
        </button>

        <p className="auth-footer">
          아직 계정이 없으신가요? <Link to="/signup">회원가입</Link>
        </p>
      </form>
    </div>
  );
}
