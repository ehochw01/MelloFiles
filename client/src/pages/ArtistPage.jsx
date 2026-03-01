import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getArtist, getArtistImage } from '../services/musicApi';
import AlbumCard from '../components/AlbumCard';

const PLACEHOLDER = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'><rect width='300' height='300' fill='%23333'/><text x='150' y='160' font-family='sans-serif' font-size='80' fill='%23999' text-anchor='middle'>%E2%99%AA</text></svg>";

export default function ArtistPage() {
  const { mbid } = useParams();
  const [artist, setArtist] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortOrder, setSortOrder] = useState(
    () => localStorage.getItem('albumSortOrder') || 'desc'
  );

  useEffect(() => {
    setLoading(true);
    setError('');
    getArtist(mbid)
      .then(data => {
        setArtist(data);
        return getArtistImage(mbid);
      })
      .then(imgData => {
        if (imgData && imgData.imageUrl) setImageUrl(imgData.imageUrl);
      })
      .catch(() => setError('Failed to load artist.'))
      .finally(() => setLoading(false));
  }, [mbid]);

  function handleSortChange(order) {
    setSortOrder(order);
    localStorage.setItem('albumSortOrder', order);
  }

  const sortedAlbums = artist ? [...artist.albums].sort((a, b) => {
    const ya = parseInt(a.year || 0);
    const yb = parseInt(b.year || 0);
    return sortOrder === 'desc' ? yb - ya : ya - yb;
  }) : [];

  if (loading) return <div className="container text-light mt-4"><p>Loading artist...</p></div>;
  if (error) return <div className="container mt-4"><div className="alert alert-warning">{error}</div></div>;
  if (!artist) return null;

  return (
    <div className="container-fluid bg-dark text-light min-vh-100 py-4">
      <div className="row mb-4 align-items-center">
        <div className="col-auto">
          <img
            src={imageUrl || PLACEHOLDER}
            alt={artist.name}
            className="rounded"
            style={{ width: '160px', height: '160px', objectFit: 'cover' }}
            onError={e => { e.target.src = PLACEHOLDER; }}
          />
        </div>
        <div className="col">
          <h2>{artist.name}</h2>
          {artist.genres && artist.genres.length > 0 && (
            <p className="text-muted">
              {artist.genres.map(g => (
                <span key={g} className="badge badge-secondary mr-1">{g}</span>
              ))}
            </p>
          )}
        </div>
      </div>

      <div className="d-flex align-items-center mb-3">
        <h4 className="mr-3 mb-0">Albums</h4>
        <div className="btn-group btn-group-sm">
          <button
            className={`btn btn-outline-secondary ${sortOrder === 'desc' ? 'active' : ''}`}
            onClick={() => handleSortChange('desc')}
          >
            Newest First
          </button>
          <button
            className={`btn btn-outline-secondary ${sortOrder === 'asc' ? 'active' : ''}`}
            onClick={() => handleSortChange('asc')}
          >
            Oldest First
          </button>
        </div>
      </div>

      <div className="row">
        {sortedAlbums.map(album => (
          <div key={album.mbid} className="col-6 col-sm-4 col-md-3 col-lg-2 mb-4">
            <AlbumCard album={album} artistMbid={mbid} />
          </div>
        ))}
        {sortedAlbums.length === 0 && (
          <p className="text-muted col-12">No albums found.</p>
        )}
      </div>
    </div>
  );
}
