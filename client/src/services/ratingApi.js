import axios from 'axios';

const api = axios.create({ withCredentials: true });

export const getAverageRating = (albumMbid) =>
  api.get(`/api/ratings/average/${albumMbid}`).then(r => r.data);

export const getUserRating = (albumMbid) =>
  api.get(`/api/ratings/user/${albumMbid}`).then(r => r.data);

export const createRating = (data) =>
  api.post('/api/ratings/', data).then(r => r.data);

export const updateRating = (ratingId, data) =>
  api.put(`/api/ratings/${ratingId}`, data).then(r => r.data);

export const getReviews = (albumMbid) =>
  api.get(`/api/reviews/${albumMbid}`).then(r => r.data);

export const getUserReview = (albumMbid) =>
  api.get(`/api/reviews/user/${albumMbid}`).then(r => r.data);

export const createReview = (data) =>
  api.post('/api/reviews/', data).then(r => r.data);

export const updateReview = (ratingId, data) =>
  api.put(`/api/reviews/${ratingId}`, data).then(r => r.data);

export const deleteReview = (ratingId) =>
  api.delete(`/api/reviews/${ratingId}`).then(r => r.data);
