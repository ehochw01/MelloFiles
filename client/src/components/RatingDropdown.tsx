import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createRating, updateRating, getUserRating } from '../services/ratingApi';
import { RATING_LABELS } from '../constants';

type RatingDropdownProps = {
  albumMbid: string;
  artistMbid: string | undefined | null;
  initialRating?: number;
  onRated?: (score: number) => void;
};

export default function RatingDropdown({ albumMbid, artistMbid, initialRating, onRated }: RatingDropdownProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [selected, setSelected] = useState<number | ''>(initialRating || '');
  const [saving, setSaving] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const score = parseInt(e.target.value);
    setSelected(score);

    if (!user || !user.loggedIn) {
      sessionStorage.setItem('pendingRating', JSON.stringify({ albumMbid, artistMbid, score }));
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    setSaving(true);
    try {
      let existingRating = null;
      try {
        existingRating = await getUserRating(albumMbid);
      } catch {
        existingRating = null;
      }

      if (existingRating && existingRating.id) {
        await updateRating(existingRating.id, { score });
      } else {
        await createRating({ album_id: albumMbid, artist_id: artistMbid ?? '', score });
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
      {RATING_LABELS.map(([n, label]) => (
        <option key={n} value={n}>{n} — {label}</option>
      ))}
    </select>
  );
}
