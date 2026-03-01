import { useState } from 'react';
import { createReview, updateReview } from '../services/ratingApi';

export default function ReviewForm({ albumMbid, artistMbid, existingReview, onSaved }) {
  const [text, setText] = useState(existingReview ? existingReview.review || '' : '');
  const [score, setScore] = useState(existingReview ? existingReview.score || '' : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEdit = existingReview && existingReview.rating_id;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) {
      setError('Review text is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      let result;
      if (isEdit) {
        result = await updateReview(existingReview.rating_id, {
          review: text,
          score: score ? parseInt(score) : undefined
        });
      } else {
        result = await createReview({
          album_id: albumMbid,
          artist_id: artistMbid,
          score: score ? parseInt(score) : null,
          review: text
        });
      }
      if (onSaved) onSaved(result);
      if (!isEdit) setText('');
    } catch (err) {
      setError('Failed to save review. Please try again.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <h5 className="text-light">{isEdit ? 'Edit Review' : 'Write a Review'}</h5>
      {error && <div className="alert alert-danger py-2">{error}</div>}
      <div className="form-group">
        <select
          className="form-control bg-dark text-light border-secondary mb-2"
          value={score}
          onChange={e => setScore(e.target.value)}
        >
          <option value="">Score (optional)</option>
          {[10,9,8,7,6,5,4,3,2,1].map(n => (
            <option key={n} value={n}>{n}/10</option>
          ))}
        </select>
        <textarea
          className="form-control bg-dark text-light border-secondary"
          rows={4}
          placeholder="Share your thoughts..."
          value={text}
          onChange={e => setText(e.target.value)}
        />
      </div>
      <button type="submit" className="btn btn-primary" disabled={saving}>
        {saving ? 'Saving...' : isEdit ? 'Update Review' : 'Post Review'}
      </button>
    </form>
  );
}
