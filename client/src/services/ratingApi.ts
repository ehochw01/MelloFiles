import axios from 'axios';
import type { RatingData, Review, UserReview } from '../types';

const api = axios.create({ withCredentials: true });

export const getAverageRating = (albumMbid: string): Promise<number> =>
  api.get(`/api/ratings/average/${albumMbid}`).then(r => r.data);

export const getUserRating = (albumMbid: string): Promise<RatingData> =>
  api.get(`/api/ratings/user/${albumMbid}`).then(r => r.data);

export const createRating = (data: { album_id: string; artist_id: string; score: number }): Promise<RatingData> =>
  api.post('/api/ratings/', data).then(r => r.data);

export const updateRating = (ratingId: number, data: { score: number }): Promise<RatingData> =>
  api.put(`/api/ratings/${ratingId}`, data).then(r => r.data);

export const getReviews = (albumMbid: string): Promise<Review[]> =>
  api.get(`/api/reviews/${albumMbid}`).then(r => r.data);

export const getUserReview = (albumMbid: string): Promise<UserReview> =>
  api.get(`/api/reviews/user/${albumMbid}`).then(r => r.data);

export const createReview = (data: { album_id: string; artist_id: string; score: number | null; review: string }): Promise<Review> =>
  api.post('/api/reviews/', data).then(r => r.data);

export const updateReview = (ratingId: number, data: { review: string; score?: number }): Promise<Review> =>
  api.put(`/api/reviews/${ratingId}`, data).then(r => r.data);

export const deleteReview = (ratingId: number): Promise<void> =>
  api.delete(`/api/reviews/${ratingId}`).then(r => r.data);
