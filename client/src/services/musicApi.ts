import axios from 'axios';
import type { ArtistSearchResult, ArtistDetail, AlbumDetail, NewRelease } from '../types';

export const searchArtists = async (query: string): Promise<ArtistSearchResult[]> => {
  const res = await axios.get(`/api/music/search/${encodeURIComponent(query)}`);
  return res.data;
};

export const getArtist = async (mbid: string): Promise<ArtistDetail> => {
  const res = await axios.get(`/api/music/artist/${mbid}`);
  return res.data;
};

export const getAlbum = async (mbid: string): Promise<AlbumDetail> => {
  const res = await axios.get(`/api/music/album/${mbid}`);
  return res.data;
};

export const getNewReleases = async (): Promise<NewRelease[]> => {
  const res = await axios.get('/api/music/new-releases');
  return res.data;
};

export const getArtistImage = async (mbid: string): Promise<{ imageUrl: string | null }> => {
  const res = await axios.get(`/api/music/artist-image/${mbid}`);
  return res.data;
};

export const getAlbumListeners = async (releaseMbid: string): Promise<{ listeners: number }> => {
  const res = await axios.get(`/api/music/album-listeners/${releaseMbid}`);
  return res.data;
};
