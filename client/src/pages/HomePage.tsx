import { useEffect, useState, useRef } from 'react';
import { getNewReleases, getAlbumListeners } from '../services/musicApi';
import AlbumCard from '../components/AlbumCard';
import { useStore } from '../store';
import type { NewRelease } from '../types';

const QUOTES = [
  '"Writing about music is like dancing about architecture" — Unknown',
  '"Without music, life would be a mistake." — Nietzsche',
  '"Music gives a soul to the universe." — Plato',
  '"One good thing about music, when it hits you, you feel no pain." — Bob Marley',
  '"Music is the shorthand of emotion." — Tolstoy',
  '"Where words fail, music speaks." — H.C. Andersen',
];

export default function HomePage() {
  const { newReleases, newReleasesLoaded, setNewReleases } = useStore();
  const [albums, setAlbums] = useState<NewRelease[]>(newReleases);
  const [loading, setLoading] = useState(!newReleasesLoaded);
  const [error, setError] = useState('');
  const [displayed, setDisplayed] = useState('');
  const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (newReleasesLoaded) return;

    const loadReleases = async () => {
      try {
        const candidates = await getNewReleases();

        if (candidates.length === 0) {
          setLoading(false);
          return;
        }

        let completed = 0;

        const enrichAlbum = async (album: NewRelease) => {
          try {
            const { listeners } = await getAlbumListeners(album.releaseMbid);
            const img = new Image();
            img.src = album.coverArtUrl;
            await img.decode();
            setAlbums(prev => {
              if (prev.some(a => a.mbid === album.mbid)) return prev;
              return [...prev, { ...album, listeners }];
            });
          } catch {
            // skip albums where Last.fm lookup or cover art fails
          }
          completed++;
          if (completed === candidates.length) {
            setAlbums(prev => {
              const sorted = [...prev].sort((a, b) => (b.listeners ?? 0) - (a.listeners ?? 0));
              setNewReleases(sorted);
              return sorted;
            });
            setLoading(false);
          }
        };

        for (const album of candidates) {
          enrichAlbum(album);
        }
      } catch {
        setError('Failed to load new releases.');
        setLoading(false);
      }
    };

    loadReleases();
  }, []);

  useEffect(() => {
    const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    setDisplayed('');
    let i = 0;
    if (typewriterRef.current) clearInterval(typewriterRef.current);
    typewriterRef.current = setInterval(() => {
      i++;
      setDisplayed(randomQuote.slice(0, i));
      if (i >= randomQuote.length && typewriterRef.current) clearInterval(typewriterRef.current);
    }, 40);
    return () => { if (typewriterRef.current) clearInterval(typewriterRef.current); };
  }, []);

  return (
    <div className="container-fluid bg-dark text-light min-vh-100 py-4">
      <div className="text-center mb-5">
        <h1 className="display-4">melloFiles</h1>
        <p className="lead text-muted" style={{ minHeight: '2em' }}>{displayed}</p>
      </div>

      <h3 className="mb-3">New Releases</h3>

      {error && albums.length === 0 && <div className="alert alert-warning">{error}</div>}

      {albums.length > 0 && (
        <div className="row album-fade-in">
          {albums.map(album => (
            <div key={album.mbid} className="col-6 col-sm-4 col-md-3 col-lg-2 mb-4">
              <AlbumCard album={album} showArtist />
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="d-flex justify-content-center py-4">
          <div className="spinner-border text-light" role="status" />
        </div>
      )}
    </div>
  );
}
