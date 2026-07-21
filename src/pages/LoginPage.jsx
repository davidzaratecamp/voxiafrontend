import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 6-10 7L2 6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61C3.35 8.5 2 12 2 12s3.5 7 10 7a9.14 9.14 0 0 0 5.05-1.5" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <path d="M2 2l20 20" />
    </svg>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo iniciar sesión.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-panel-brand">
        <div className="login-brand-mark">
          <div className="voice-bars" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <span className="login-brand-name">Voxia</span>
        </div>
        <h1>Agentes de voz con IA para tu call center</h1>
        <p>Llamadas salientes automatizadas con conversaciones naturales, en tiempo real, en el idioma de cada cliente.</p>
        <ul className="login-brand-features">
          <li>Voces expresivas y naturales</li>
          <li>Interrupciones en tiempo real</li>
          <li>Español e inglés por campaña</li>
        </ul>
      </div>

      <div className="login-panel-form">
        <form className="login-card" onSubmit={handleSubmit}>
          <div className="login-card-badge" aria-hidden="true">
            <LockIcon />
          </div>
          <h2>Bienvenido de nuevo</h2>
          <p className="login-subtitle">Ingresa con la cuenta que te entregó tu proveedor.</p>
          {error && <div className="banner error">{error}</div>}
          <div className="form-field">
            <label htmlFor="email">Email</label>
            <div className="input-icon-wrap">
              <span className="input-icon"><MailIcon /></span>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                autoFocus
                required
              />
            </div>
          </div>
          <div className="form-field">
            <label htmlFor="password">Contraseña</label>
            <div className="input-icon-wrap password-input-wrap">
              <span className="input-icon"><LockIcon /></span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>
          <button className="btn btn-block" type="submit" disabled={submitting}>
            {submitting && <span className="spinner" />}
            {submitting ? 'Ingresando...' : 'Ingresar'}
          </button>
          <p className="login-footer-note">¿Problemas para entrar? Contacta a tu administrador.</p>
        </form>
      </div>
    </div>
  );
}
