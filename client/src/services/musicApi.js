import axios from 'axios';

export const searchArtists = (query) =>
  axios.get(`/api/music/search/${encodeURIComponent(query)}`).then(r => r.data);

export const getArtist = (mbid) =>
  axios.get(`/api/music/artist/${mbid}`).then(r => r.data);

export const getAlbum = (mbid) =>
  axios.get(`/api/music/album/${mbid}`).then(r => r.data);

export const getNewReleases = () =>
  axios.get('/api/music/new-releases').then(r => r.data);

export const getArtistImage = (mbid) =>
  axios.get(`/api/music/artist-image/${mbid}`).then(r => r.data);

export const getAlbumListeners = async (releaseMbid) => {
  const res = await axios.get(`/api/music/album-listeners/${releaseMbid}`);
  return res.data;
};
