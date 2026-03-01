import { useState } from 'react';
import { Link } from 'react-router-dom';
import RatingDropdown from './RatingDropdown';

const PLACEHOLDER = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'><rect width='300' height='300' fill='%23333'/><text x='150' y='160' font-family='sans-serif' font-size='80' fill='%23999' text-anchor='middle'>%E2%99%AA</text></svg>";

export default function AlbumCard({ album, artistMbid, showArtist }) {
  const [imgSrc, setImgSrc] = useState(album.coverArtUrl);

  return (
    <div className="card h-100 bg-dark text-light border-secondary">
      <Link to={`/album/${album.mbid}`}>
        <img
          src={imgSrc}
          alt={album.title}
          className="card-img-top"
          style={{ objectFit: 'cover', height: '200px' }}
          onError={() => setImgSrc(PLACEHOLDER)}
        />
      </Link>
      <div className="card-body d-flex flex-column">
        <h6 className="card-title mb-1">
          <Link to={`/album/${album.mbid}`} className="text-light">{album.title}</Link>
        </h6>
        {showArtist && album.artists && album.artists.length > 0 && (
          <p className="card-text text-muted small mb-1">
            <Link to={`/artist/${album.artists[0].mbid}`} className="text-secondary">
              {album.artists[0].name}
            </Link>
          </p>
        )}
        {album.year && (
          <p className="card-text text-muted small mb-2">{album.year}</p>
        )}
        {album.averageRating !== undefined && (
          <span className="badge badge-secondary mb-2">
            {album.averageRating ? `${album.averageRating} avg` : 'No ratings'}
          </span>
        )}
        <div className="mt-auto">
          <RatingDropdown
            albumMbid={album.mbid}
            artistMbid={artistMbid || (album.artists && album.artists[0] && album.artists[0].mbid)}
            initialRating={album.userRating}
          />
        </div>
      </div>
    </div>
  );
}
