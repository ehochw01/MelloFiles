import { useEffect, useState, useRef } from 'react';
import { getNewReleases } from '../services/musicApi';
import AlbumCard from '../components/AlbumCard';

const QUOTES = [
  '"Without music, life would be a mistake." — Nietzsche',
  '"Music gives a soul to the universe." — Plato',
  '"One good thing about music, when it hits you, you feel no pain." — Bob Marley',
  '"Music is the shorthand of emotion." — Tolstoy',
  '"Where words fail, music speaks." — H.C. Andersen',
];

export default function HomePage() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quote, setQuote] = useState('');
  const [displayed, setDisplayed] = useState('');
  const typewriterRef = useRef(null);

  useEffect(() => {
    getNewReleases()
      .then(data => setAlbums(data.slice(0, 12)))
      .catch(() => setError('Failed to load new releases.'))
      .finally(() => setLoading(false));
  }, []);

  // Typewriter effect
  useEffect(() => {
    const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    setQuote(randomQuote);
    setDisplayed('');
    let i = 0;
    clearInterval(typewriterRef.current);
    typewriterRef.current = setInterval(() => {
      i++;
      setDisplayed(randomQuote.slice(0, i));
      if (i >= randomQuote.length) clearInterval(typewriterRef.current);
    }, 40);
    return () => clearInterval(typewriterRef.current);
  }, []);

  return (
    <div className="container-fluid bg-dark text-light min-vh-100 py-4">
      <div className="text-center mb-5">
        <h1 className="display-4">melloFiles</h1>
        <p className="lead text-muted" style={{ minHeight: '2em' }}>{displayed}</p>
      </div>

      <h3 className="mb-3">New Releases</h3>

      {loading && <p className="text-muted">Loading...</p>}
      {error && <div className="alert alert-warning">{error}</div>}

      <div className="row">
        {albums.map(album => (
          <div key={album.mbid} className="col-6 col-sm-4 col-md-3 col-lg-2 mb-4">
            <AlbumCard album={album} showArtist />
          </div>
        ))}
      </div>
    </div>
  );
}
