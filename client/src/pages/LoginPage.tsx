import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createRating, updateRating, getUserRating } from '../services/ratingApi';

export default function LoginPage() {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from || '/';

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ username: '', email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [signupError, setSignupError] = useState('');
  const [loading, setLoading] = useState(false);

  async function applyPendingRating() {
    const pending = sessionStorage.getItem('pendingRating');
    if (!pending) return;
    sessionStorage.removeItem('pendingRating');
    const { albumMbid, artistMbid, score } = JSON.parse(pending);
    try {
      let existingRating = null;
      try {
        existingRating = await getUserRating(albumMbid);
      } catch {
        existingRating = null;
      }
      if (existingRating && existingRating.id) {
        await updateRating(existingRating.id, { score });
      } else {
        await createRating({ album_id: albumMbid, artist_id: artistMbid, score });
      }
    } catch (err) {
      console.error('Failed to apply pending rating', err);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');
    setLoading(true);
    try {
      await login(loginData.email, loginData.password);
      await applyPendingRating();
      navigate(from);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setLoginError(message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setSignupError('');
    setLoading(true);
    try {
      await signup(signupData.username, signupData.email, signupData.password);
      await applyPendingRating();
      navigate(from);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setSignupError(message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-md-6">
          <div className="card bg-dark text-light border-secondary">
            <div className="card-body">
              <h4 className="card-title">Login</h4>
              {loginError && <div className="alert alert-danger py-2">{loginError}</div>}
              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    className="form-control bg-dark text-light border-secondary"
                    value={loginData.email}
                    onChange={e => setLoginData({ ...loginData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    className="form-control bg-dark text-light border-secondary"
                    value={loginData.password}
                    onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card bg-dark text-light border-secondary">
            <div className="card-body">
              <h4 className="card-title">Sign Up</h4>
              {signupError && <div className="alert alert-danger py-2">{signupError}</div>}
              <form onSubmit={handleSignup}>
                <div className="form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    className="form-control bg-dark text-light border-secondary"
                    value={signupData.username}
                    onChange={e => setSignupData({ ...signupData, username: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    className="form-control bg-dark text-light border-secondary"
                    value={signupData.email}
                    onChange={e => setSignupData({ ...signupData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    className="form-control bg-dark text-light border-secondary"
                    value={signupData.password}
                    onChange={e => setSignupData({ ...signupData, password: e.target.value })}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-success" disabled={loading}>
                  {loading ? 'Creating account...' : 'Sign Up'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
