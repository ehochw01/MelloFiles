import { useState } from 'react';
import { Link } from 'react-router-dom';
import RatingDropdown from './RatingDropdown';
import { PLACEHOLDER_IMAGE } from '../constants';
import type { Album, NewRelease } from '../types';

type AlbumCardProps = {
  album: (Album | NewRelease) & { averageRating?: number; userRating?: number };
  artistMbid?: string;
  showArtist?: boolean;
};

export default function AlbumCard({ album, artistMbid, showArtist }: AlbumCardProps) {
  const [imgSrc, setImgSrc] = useState(album.coverArtUrl);
  const [hidden, setHidden] = useState(false);

  if (hidden) return null;

  return (
    <div className="card h-100 bg-dark text-light border-secondary">
      <Link to={`/album/${album.mbid}`}>
        <img
          src={imgSrc}
          alt={album.title}
          className="card-img-top"
          style={{ objectFit: 'cover', height: '200px' }}
          onError={() => showArtist ? setHidden(true) : setImgSrc(PLACEHOLDER_IMAGE)}
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
