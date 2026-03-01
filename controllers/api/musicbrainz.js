const router = require('express').Router();
const { mbFetch } = require('../../utils/mbFetch');

const MB_BASE = 'https://musicbrainz.org/ws/2';
const PLACEHOLDER_IMAGE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="%23333"/><text x="150" y="160" font-family="sans-serif" font-size="80" fill="%23999" text-anchor="middle">♪</text></svg>';

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
      rg => rg['primary-type'] === 'Album'
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
      genres: (data.genres || data.tags || []).slice(0, 8).map(g => g.name),
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
// Fetches artist image URL via Wikipedia page image API
router.get('/artist-image/:mbid', async (req, res) => {
  try {
    const { mbid } = req.params;
    const artistUrl = `${MB_BASE}/artist/${mbid}?inc=url-rels&fmt=json`;
    const artistData = await mbFetch(artistUrl);

    const relations = artistData.relations || [];
    const wikiRel = relations.find(
      r => r.type === 'wikipedia' && r.url && r.url.resource
    );

    if (!wikiRel) {
      return res.status(200).json({ imageUrl: null });
    }

    // Extract Wikipedia page title from URL
    const wikiUrl = wikiRel.url.resource;
    const titleMatch = wikiUrl.match(/\/wiki\/(.+)$/);
    if (!titleMatch) {
      return res.status(200).json({ imageUrl: null });
    }

    const pageTitle = decodeURIComponent(titleMatch[1]);
    const wikiApiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`;

    const wikiResponse = await fetch(wikiApiUrl, {
      headers: { 'User-Agent': 'melloFiles/1.0' }
    });

    if (!wikiResponse.ok) {
      return res.status(200).json({ imageUrl: null });
    }

    const wikiData = await wikiResponse.json();
    const imageUrl = wikiData.thumbnail && wikiData.thumbnail.source
      ? wikiData.thumbnail.source.replace(/\/\d+px-/, '/400px-')
      : null;

    res.status(200).json({ imageUrl });
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
