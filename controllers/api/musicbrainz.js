const router = require('express').Router();
const { mbFetch } = require('../../utils/mbFetch');

const MB_BASE = 'https://musicbrainz.org/ws/2';
const PLACEHOLDER_IMAGE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="%23333"/><text x="150" y="160" font-family="sans-serif" font-size="80" fill="%23999" text-anchor="middle">♪</text></svg>';

// --- Spotify token cache ---
let spotifyToken = null;
let spotifyTokenExpiry = 0;

async function getSpotifyToken() {
  if (spotifyToken && Date.now() < spotifyTokenExpiry) return spotifyToken;
  const creds = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64');
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Authorization': `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials'
  });
  const data = await res.json();
  spotifyToken = data.access_token;
  spotifyTokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return spotifyToken;
}

// --- Helpers ---

function cleanAlbumName(name) {
  let temp = name.split(' [')[0];
  return temp.split(' (')[0];
}

function cleanTrackName(track) {
  track = track.replace(' (Remastered)', '');
  track = track.split(' - Remaster')[0];
  return track;
}

function deduplicateAlbums(releaseGroups) {
  const albumHash = {};
  for (const rg of releaseGroups) {
    const nameLower = rg.title.toLowerCase();
    if (!nameLower.includes('commentary') && !nameLower.includes('karaoke')) {
      let name = rg.title.replace('The ', '');
      name = name.replace('?', '');
      const cleanName = cleanAlbumName(name).toLowerCase();

      const trackCount = rg['release-count'] || 0;
      if (albumHash[cleanName] === undefined) {
        albumHash[cleanName] = rg;
      } else if (trackCount < (albumHash[cleanName]['release-count'] || 0)) {
        albumHash[cleanName] = rg;
      }
    }
  }
  return Object.values(albumHash);
}

function getReleaseYear(rg) {
  const date = rg['first-release-date'] || '';
  return date.split('-')[0] || null;
}

// GET /api/music/search/:query
router.get('/search/:query', async (req, res) => {
  try {
    const query = encodeURIComponent(req.params.query);
    const url = `${MB_BASE}/artist?query=${query}&limit=5&fmt=json`;
    const data = await mbFetch(url);

    const artists = (data.artists || []).map(a => ({
      mbid: a.id,
      name: a.name,
      disambiguation: a.disambiguation || '',
      genres: (a.genres || a.tags || []).slice(0, 5).map(g => g.name),
      score: a.score
    }));

    res.status(200).json(artists);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/music/artist/:mbid
router.get('/artist/:mbid', async (req, res) => {
  try {
    const { mbid } = req.params;
    const url = `${MB_BASE}/artist/${mbid}?inc=release-groups+url-rels+genres&fmt=json`;
    const data = await mbFetch(url);

    // Filter to albums only, deduplicate, sort desc by year
    const releaseGroups = (data['release-groups'] || []).filter(
      rg => rg['primary-type'] === 'Album' && !(rg['secondary-types'] || []).includes('Live')
    );
    const deduped = deduplicateAlbums(releaseGroups);
    const sorted = deduped.sort(
      (a, b) => parseInt(getReleaseYear(b) || 0) - parseInt(getReleaseYear(a) || 0)
    );

    const albums = sorted.map(rg => ({
      mbid: rg.id,
      title: cleanAlbumName(rg.title),
      year: getReleaseYear(rg),
      coverArtUrl: `https://coverartarchive.org/release-group/${rg.id}/front`,
    }));

    res.status(200).json({
      mbid: data.id,
      name: data.name,
      genres: (data.genres || data.tags || []).sort((a, b) => (b.count || 0) - (a.count || 0)).slice(0, 5).map(g => g.name),
      urlRels: (data.relations || []).filter(r => r['target-type'] === 'url').map(r => ({
        type: r.type,
        url: r.url && r.url.resource
      })),
      albums
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/music/album/:mbid
router.get('/album/:mbid', async (req, res) => {
  try {
    const { mbid } = req.params;
    const rgUrl = `${MB_BASE}/release-group/${mbid}?inc=releases+artists&fmt=json`;
    const rgData = await mbFetch(rgUrl);

    // Pick the best release (fewest tracks / most complete)
    const releases = rgData.releases || [];
    let bestReleaseId = releases.length > 0 ? releases[0].id : null;

    let tracks = [];
    let releaseInfo = {};

    if (bestReleaseId) {
      const releaseUrl = `${MB_BASE}/release/${bestReleaseId}?inc=recordings+labels&fmt=json`;
      const releaseData = await mbFetch(releaseUrl);

      const media = releaseData.media || [];
      let trackNumber = 1;
      for (const medium of media) {
        for (const t of (medium.tracks || [])) {
          const lengthMs = t.length || (t.recording && t.recording.length) || null;
          tracks.push({
            trackNumber: trackNumber++,
            name: cleanTrackName(t.title || (t.recording && t.recording.title) || ''),
            length: lengthMs ? msToMinSec(lengthMs) : null
          });
        }
      }

      const labelInfo = releaseData['label-info'] && releaseData['label-info'][0];
      releaseInfo = {
        label: labelInfo && labelInfo.label ? labelInfo.label.name : null,
        date: releaseData.date || null,
        country: releaseData.country || null
      };
    }

    const artists = (rgData['artist-credit'] || [])
      .filter(ac => ac.artist)
      .map(ac => ({ mbid: ac.artist.id, name: ac.artist.name }));

    res.status(200).json({
      mbid: rgData.id,
      title: cleanAlbumName(rgData.title),
      year: (rgData['first-release-date'] || '').split('-')[0] || null,
      releaseDate: rgData['first-release-date'] || null,
      coverArtUrl: `https://coverartarchive.org/release-group/${mbid}/front`,
      artists,
      tracks,
      label: releaseInfo.label || null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/music/new-releases
router.get('/new-releases', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

    // Search releases (not release-groups) so we get release MBIDs that Last.fm recognizes
    const searchUrl = `${MB_BASE}/release?query=date:[${dateStr}+TO+*]+AND+primarytype:album+AND+status:official&limit=100&fmt=json`;
    const data = await mbFetch(searchUrl);

    // Deduplicate by release-group ID — one entry per album concept, no extra API calls
    const seenReleaseGroups = new Set();
    const candidates = [];
    for (const r of (data.releases || [])) {
      const rg = r['release-group'];
      if (rg && !seenReleaseGroups.has(rg.id)) {
        seenReleaseGroups.add(rg.id);
        candidates.push({
          mbid: rg.id,          // release-group MBID for cover art + routing
          releaseMbid: r.id,    // release MBID for Last.fm — direct 1-to-1, no name matching
          title: cleanAlbumName(r.title),
          year: (r.date || '').split('-')[0] || null,
          releaseDate: r.date || null,
          coverArtUrl: `https://coverartarchive.org/release-group/${rg.id}/front-250`,
          artists: (r['artist-credit'] || [])
            .filter(ac => ac.artist)
            .map(ac => ({ mbid: ac.artist.id, name: ac.artist.name }))
        });
      }
    }

    res.status(200).json(candidates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/music/album-listeners/:releaseMbid
router.get('/album-listeners/:releaseMbid', async (req, res) => {
  try {
    const { releaseMbid } = req.params;
    const LASTFM_KEY = process.env.LASTFM_API_KEY;
    const lfUrl = `https://ws.audioscrobbler.com/2.0/?method=album.getInfo&mbid=${releaseMbid}&api_key=${LASTFM_KEY}&format=json`;
    const lfRes = await fetch(lfUrl, { headers: { 'User-Agent': 'melloFiles/1.0' } });
    const lfData = await lfRes.json();
    if (lfData.error || !lfData.album) {
      return res.status(404).json({ error: 'Not found on Last.fm' });
    }
    res.status(200).json({ listeners: parseInt(lfData.album.listeners || '0', 10) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/music/artist-image/:mbid
// Tries Spotify → Wikipedia → Wikimedia Commons
router.get('/artist-image/:mbid', async (req, res) => {
  try {
    const { mbid } = req.params;
    const artistUrl = `${MB_BASE}/artist/${mbid}?inc=url-rels&fmt=json`;
    const artistData = await mbFetch(artistUrl);
    const relations = artistData.relations || [];

    // 1. Try Spotify — use Spotify URL from MusicBrainz url-rels (no name matching)
    const spotifyRel = relations.find(r => r.url && r.url.resource && r.url.resource.includes('open.spotify.com/artist/'));
    if (spotifyRel) {
      const spotifyId = spotifyRel.url.resource.split('open.spotify.com/artist/')[1];
      const token = await getSpotifyToken();
      const spotifyRes = await fetch(`https://api.spotify.com/v1/artists/${spotifyId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const spotifyData = await spotifyRes.json();
      if (spotifyData.images && spotifyData.images.length > 0) {
        return res.status(200).json({ imageUrl: spotifyData.images[0].url });
      }
    }

    // 2. Try Wikipedia page thumbnail
    const wikiRel = relations.find(r => r.type === 'wikipedia' && r.url && r.url.resource);
    if (wikiRel) {
      const titleMatch = wikiRel.url.resource.match(/\/wiki\/(.+)$/);
      if (titleMatch) {
        const pageTitle = decodeURIComponent(titleMatch[1]);
        const wikiResponse = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`, { headers: { 'User-Agent': 'melloFiles/1.0' } });
        if (wikiResponse.ok) {
          const wikiData = await wikiResponse.json();
          if (wikiData.thumbnail && wikiData.thumbnail.source) {
            const imageUrl = wikiData.thumbnail.source.replace(/\/\d+px-/, '/400px-');
            return res.status(200).json({ imageUrl });
          }
        }
      }
    }

    // 3. Try Wikimedia Commons direct image link
    const imageRel = relations.find(r => r.type === 'image' && r.url && r.url.resource);
    if (imageRel) {
      const fileName = imageRel.url.resource.split('/wiki/')[1];
      const commonsResponse = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&titles=${fileName}&prop=imageinfo&iiprop=url&format=json&origin=*`, { headers: { 'User-Agent': 'melloFiles/1.0' } });
      const commonsData = await commonsResponse.json();
      const pages = commonsData.query && commonsData.query.pages;
      const page = pages && Object.values(pages)[0];
      const imageUrl = page && page.imageinfo && page.imageinfo[0] && page.imageinfo[0].url;
      if (imageUrl) return res.status(200).json({ imageUrl });
    }

    res.status(200).json({ imageUrl: null });
  } catch (err) {
    console.error(err);
    res.status(200).json({ imageUrl: null });
  }
});

function msToMinSec(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

module.exports = router;
