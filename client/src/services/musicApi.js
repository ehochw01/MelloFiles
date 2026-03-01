import axios from 'axios';

export const searchArtists = async (query) => {
  const res = await axios.get(`/api/music/search/${encodeURIComponent(query)}`);
  return res.data;
};

export const getArtist = async (mbid) => {
  const res = await axios.get(`/api/music/artist/${mbid}`);
  return res.data;
};

export const getAlbum = async (mbid) => {
  const res = await axios.get(`/api/music/album/${mbid}`);
  return res.data;
};

export const getNewReleases = async () => {
  const res = await axios.get('/api/music/new-releases');
  return res.data;
};

export const getArtistImage = async (mbid) => {
  const res = await axios.get(`/api/music/artist-image/${mbid}`);
  return res.data;
};

export const getAlbumListeners = async (releaseMbid) => {
  const res = await axios.get(`/api/music/album-listeners/${releaseMbid}`);
  return res.data;
};
