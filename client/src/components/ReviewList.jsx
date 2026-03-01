import { useAuth } from '../context/AuthContext';
import { deleteReview } from '../services/ratingApi';

export default function ReviewList({ reviews, onDelete }) {
  const { user } = useAuth();

  async function handleDelete(ratingId) {
    if (!window.confirm('Delete your review?')) return;
    try {
      await deleteReview(ratingId);
      if (onDelete) onDelete(ratingId);
    } catch (err) {
      console.error('Delete failed', err);
    }
  }

  if (!reviews || reviews.length === 0) {
    return <p className="text-muted">No reviews yet. Be the first!</p>;
  }

  return (
    <div>
      {reviews.map(review => (
        <div key={review.rating_id} className="card bg-dark border-secondary mb-3">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <strong className="text-light">
                  {review.User ? review.User.username : 'Unknown'}
                </strong>
                {review.score && (
                  <span className="badge badge-secondary ml-2">{review.score}/10</span>
                )}
              </div>
              {user && user.loggedIn && review.User && review.User.user_id === user.userId && (
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => handleDelete(review.rating_id)}
                >
                  Delete
                </button>
              )}
            </div>
            <p className="text-light mt-2 mb-0">{review.review}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
