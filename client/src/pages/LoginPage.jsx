import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ username: '', email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [signupError, setSignupError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError('');
    setLoading(true);
    try {
      await login(loginData.email, loginData.password);
      applyPendingRating();
      navigate(from);
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    setSignupError('');
    setLoading(true);
    try {
      await signup(signupData.username, signupData.email, signupData.password);
      applyPendingRating();
      navigate(from);
    } catch (err) {
      setSignupError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function applyPendingRating() {
    const pending = sessionStorage.getItem('pendingRating');
    if (pending) {
      sessionStorage.removeItem('pendingRating');
      // RatingDropdown will handle applying on next render
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
