import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { signup, ApiError } from '../api/authApi';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [mismatchError, setMismatchError] = useState('');
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: () => signup(email, password),
    onSuccess: () => {
      navigate('/login', { replace: true });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirm) {
      setMismatchError('비밀번호가 일치하지 않습니다.');
      return;
    }
    setMismatchError('');
    mutation.mutate();
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1 className="auth-title">회원가입</h1>

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

        <label className="auth-field">
          비밀번호 확인
          <input
            className="auth-input"
            type="password"
            required
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
          />
        </label>

        {mismatchError && <p className="auth-error">{mismatchError}</p>}
        {mutation.isError && (
          <p className="auth-error">{(mutation.error as ApiError).message}</p>
        )}

        <button className="auth-button" type="submit" disabled={mutation.isPending}>
          가입하기
        </button>

        <p className="auth-footer">
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </p>
      </form>
    </div>
  );
}
