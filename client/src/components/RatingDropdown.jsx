import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createRating, updateRating, getUserRating } from '../services/ratingApi';

const RATING_LABELS = {
  10: 'Classic',
  9: 'Masterpiece',
  8: 'Excellent',
  7: 'Great',
  6: 'Good',
  5: 'Decent',
  4: 'Mediocre',
  3: 'Poor',
  2: 'Bad',
  1: 'Unbearable',
};

export default function RatingDropdown({ albumMbid, artistMbid, initialRating, onRated }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [selected, setSelected] = useState(initialRating || '');
  const [saving, setSaving] = useState(false);

  async function handleChange(e) {
    const score = parseInt(e.target.value);
    setSelected(score);

    if (!user || !user.loggedIn) {
      sessionStorage.setItem('pendingRating', JSON.stringify({ albumMbid, artistMbid, score }));
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    setSaving(true);
    try {
      // Check if user already has a rating
      let existingRating = null;
      try {
        existingRating = await getUserRating(albumMbid);
      } catch {
        existingRating = null;
      }

      if (existingRating && existingRating.id) {
        await updateRating(existingRating.id, { score });
      } else {
        await createRating({ album_id: albumMbid, artist_id: artistMbid, score });
      }
      if (onRated) onRated(score);
    } catch (err) {
      console.error('Rating failed', err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <select
      className="form-control form-control-sm"
      value={selected}
      onChange={handleChange}
      disabled={saving}
    >
      <option value="">Rate...</option>
      {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(n => (
        <option key={n} value={n}>{n} — {RATING_LABELS[n]}</option>
      ))}
    </select>
  );
}
