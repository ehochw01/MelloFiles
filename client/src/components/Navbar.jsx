import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { searchArtists } from '../services/musicApi';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setError('');
    try {
      const results = await searchArtists(query.trim());
      if (results && results.length > 0) {
        navigate(`/artist/${results[0].mbid}`);
      } else {
        setError('No artist found');
      }
    } catch {
      setError('Search failed');
    } finally {
      setSearching(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <Link className="navbar-brand" to="/">melloFiles</Link>
      <button
        className="navbar-toggler"
        type="button"
        data-toggle="collapse"
        data-target="#navbarNav"
      >
        <span className="navbar-toggler-icon"></span>
      </button>
      <div className="collapse navbar-collapse" id="navbarNav">
        <form className="form-inline ml-auto" onSubmit={handleSearch}>
          <input
            className="form-control mr-sm-2"
            type="search"
            placeholder="Search artist..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button className="btn btn-outline-light my-2 my-sm-0" type="submit" disabled={searching}>
            {searching ? 'Searching...' : 'Search'}
          </button>
          {error && <span className="text-warning ml-2">{error}</span>}
        </form>
        <ul className="navbar-nav ml-3">
          {user && user.loggedIn ? (
            <li className="nav-item">
              <button className="btn btn-link nav-link text-light" onClick={handleLogout}>
                Logout
              </button>
            </li>
          ) : (
            <li className="nav-item">
              <Link className="nav-link" to="/login">Login</Link>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}
