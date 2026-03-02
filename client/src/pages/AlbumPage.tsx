import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAlbum } from '../services/musicApi';
import { getAverageRating, getReviews, getUserRating, getUserReview } from '../services/ratingApi';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../store';
import RatingDropdown from '../components/RatingDropdown';
import ReviewList from '../components/ReviewList';
import ReviewForm from '../components/ReviewForm';
import { PLACEHOLDER_IMAGE } from '../constants';
import type { AlbumDetail, Review, UserReview } from '../types';

export default function AlbumPage() {
  const { mbid } = useParams<{ mbid: string }>();
  const { user } = useAuth();
  const { albumDetails, avgRatings, setAlbumDetail, setAvgRating, setUserRating } = useStore();

  const cachedAlbum = albumDetails[mbid!] || null;
  const [album, setAlbum] = useState<AlbumDetail | null>(cachedAlbum);
  const [avgRating, setAvgRatingState] = useState<number | null>(mbid! in avgRatings ? avgRatings[mbid!] : null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<UserReview | null>(null);
  const [loading, setLoading] = useState(!cachedAlbum);
  const [error, setError] = useState('');
  const [imgSrc, setImgSrc] = useState(cachedAlbum?.coverArtUrl || '');

  useEffect(() => {
    const fetchAlbum = !albumDetails[mbid!];
    const fetchAvg = !(mbid! in avgRatings);

    if (fetchAlbum || fetchAvg) {
      setLoading(true);
      Promise.all([
        fetchAlbum ? getAlbum(mbid!) : Promise.resolve(albumDetails[mbid!]),
        fetchAvg ? getAverageRating(mbid!).catch(() => null) : Promise.resolve(avgRatings[mbid!]),
        getReviews(mbid!).catch(() => []),
      ]).then(([albumData, avg, reviewData]) => {
        setAlbum(albumData);
        setImgSrc(albumData.coverArtUrl);
        setAvgRatingState(avg);
        setReviews(reviewData);
        if (fetchAlbum) setAlbumDetail(mbid!, albumData);
        if (fetchAvg) setAvgRating(mbid!, avg);
      }).catch(() => setError('Failed to load album.'))
        .finally(() => setLoading(false));
    } else {
      getReviews(mbid!).catch(() => []).then(data => setReviews(data));
    }
  }, [mbid]);

  useEffect(() => {
    if (user && user.loggedIn) {
      getUserReview(mbid!).catch(() => null).then(r => setUserReview(r));
      getUserRating(mbid!).catch(() => null).then(r => setUserRating(mbid!, r));
    }
  }, [mbid, user]);

  function handleReviewSaved() {
    getReviews(mbid!).then(data => setReviews(data)).catch(() => {});
    if (user && user.loggedIn) {
      getUserReview(mbid!).catch(() => null).then(r => setUserReview(r));
    }
  }

  function handleReviewDeleted(ratingId: number) {
    setReviews(prev => prev.filter(r => r.rating_id !== ratingId));
    setUserReview(null);
  }

  if (loading) return <div className="container text-light mt-4"><p>Loading album...</p></div>;
  if (error) return <div className="container mt-4"><div className="alert alert-warning">{error}</div></div>;
  if (!album) return null;

  const artistMbid = album.artists && album.artists[0] ? album.artists[0].mbid : null;

  return (
    <div className="container-fluid bg-dark text-light min-vh-100 py-4">
      <div className="row mb-5">
        <div className="col-md-3 text-center">
          <img
            src={imgSrc}
            alt={album.title}
            className="img-fluid rounded mb-3"
            style={{ maxWidth: '250px' }}
            onError={() => setImgSrc(PLACEHOLDER_IMAGE)}
          />
        </div>
        <div className="col-md-9">
          <h2>{album.title}</h2>
          <p className="text-muted">
            {album.artists && album.artists.map((a, i) => (
              <span key={a.mbid}>
                {i > 0 && ', '}
                <Link to={`/artist/${a.mbid}`} className="text-secondary">{a.name}</Link>
              </span>
            ))}
          </p>
          {album.releaseDate && <p className="text-muted small">Released: {album.releaseDate}</p>}
          {album.label && <p className="text-muted small">Label: {album.label}</p>}
          <div className="mb-3">
            {avgRating !== null && avgRating !== undefined ? (
              <span className="badge badge-light mr-2" style={{ fontSize: '1.1em' }}>
                {avgRating} / 10 avg
              </span>
            ) : (
              <span className="text-muted">No ratings yet</span>
            )}
          </div>
          <div style={{ maxWidth: '200px' }}>
            <RatingDropdown albumMbid={mbid!} artistMbid={artistMbid} />
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-5">
          <h4>Tracklist</h4>
          <ol className="list-group list-group-flush">
            {album.tracks && album.tracks.map(track => (
              <li key={track.trackNumber} className="list-group-item bg-dark text-light border-secondary d-flex justify-content-between">
                <span>{track.trackNumber}. {track.name}</span>
                {track.length && <small className="text-muted">{track.length}</small>}
              </li>
            ))}
          </ol>
        </div>
        <div className="col-md-7">
          <h4>Reviews</h4>
          {user && user.loggedIn && (
            <ReviewForm
              albumMbid={mbid!}
              artistMbid={artistMbid}
              existingReview={userReview}
              onSaved={handleReviewSaved}
            />
          )}
          <ReviewList reviews={reviews} onDelete={handleReviewDeleted} />
        </div>
      </div>
    </div>
  );
}
