export type User =
  | { loggedIn: true; userId: number }
  | { loggedIn: false };

export type ArtistSearchResult = {
  mbid: string;
  name: string;
  disambiguation: string;
  genres: string[];
  score: number;
};

export type AlbumArtist = {
  mbid: string;
  name: string;
};

export type Track = {
  trackNumber: number;
  name: string;
  length: string | null;
};

export type Album = {
  mbid: string;
  title: string;
  year: string | null;
  coverArtUrl: string;
  artists: AlbumArtist[];
};

export type AlbumDetail = Album & {
  releaseDate: string | null;
  label: string | null;
  tracks: Track[];
};

export type NewRelease = Album & {
  releaseMbid: string;
  listeners?: number;
};

export type ArtistDetail = {
  mbid: string;
  name: string;
  genres: string[];
  albums: Album[];
};

export type ReviewUser = {
  user_id: number;
  username: string;
};

export type Review = {
  rating_id: number;
  review: string;
  score: number | null;
  user: ReviewUser;
};

export type UserReview = {
  rating_id: number;
  review: string;
  score: number | null;
};

export type RatingData = {
  id: number;
  score: number;
  album_id: string;
  artist_id: string;
};
