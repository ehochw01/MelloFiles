import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createRating, updateRating, getUserRating } from '../services/ratingApi';
import { useStore } from '../store';
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
  const { userRatings, setUserRating } = useStore();
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
      // Use cached rating if available, otherwise fetch
      let existingRating = userRatings[albumMbid] !== undefined
        ? userRatings[albumMbid]
        : await getUserRating(albumMbid).catch(() => null);

      if (existingRating && existingRating.id) {
        await updateRating(existingRating.id, { score });
        setUserRating(albumMbid, { ...existingRating, score });
      } else {
        const created = await createRating({ album_id: albumMbid, artist_id: artistMbid ?? '', score });
        setUserRating(albumMbid, created);
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
