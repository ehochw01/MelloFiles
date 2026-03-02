import { create } from 'zustand';
import type { NewRelease, ArtistDetail, AlbumDetail, RatingData } from './types';

type Store = {
  // Home page new releases — expensive parallel load, only changes on Fridays
  newReleases: NewRelease[];
  newReleasesLoaded: boolean;
  setNewReleases: (albums: NewRelease[]) => void;

  // Artist detail + image, keyed by mbid
  artists: Record<string, ArtistDetail>;
  artistImages: Record<string, string | null>;
  setArtist: (mbid: string, data: ArtistDetail) => void;
  setArtistImage: (mbid: string, url: string | null) => void;

  // Album detail + average rating, keyed by mbid
  albumDetails: Record<string, AlbumDetail>;
  avgRatings: Record<string, number | null>;
  setAlbumDetail: (mbid: string, data: AlbumDetail) => void;
  setAvgRating: (mbid: string, rating: number | null) => void;

  // User's ratings keyed by albumMbid — cleared on logout
  userRatings: Record<string, RatingData | null>;
  setUserRating: (albumMbid: string, rating: RatingData | null) => void;
  clearUserRatings: () => void;
};

export const useStore = create<Store>((set) => ({
  newReleases: [],
  newReleasesLoaded: false,
  setNewReleases: (albums) => set({ newReleases: albums, newReleasesLoaded: true }),

  artists: {},
  artistImages: {},
  setArtist: (mbid, data) => set((s) => ({ artists: { ...s.artists, [mbid]: data } })),
  setArtistImage: (mbid, url) => set((s) => ({ artistImages: { ...s.artistImages, [mbid]: url } })),

  albumDetails: {},
  avgRatings: {},
  setAlbumDetail: (mbid, data) => set((s) => ({ albumDetails: { ...s.albumDetails, [mbid]: data } })),
  setAvgRating: (mbid, rating) => set((s) => ({ avgRatings: { ...s.avgRatings, [mbid]: rating } })),

  userRatings: {},
  setUserRating: (albumMbid, rating) => set((s) => ({ userRatings: { ...s.userRatings, [albumMbid]: rating } })),
  clearUserRatings: () => set({ userRatings: {} }),
}));
