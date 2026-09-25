const DEFAULT_REPO = 'nkuchenov-hash/reviews-widget';
const DEFAULT_BRANCH = 'main';
const DEFAULT_ORIGIN = 'https://nkuchenov-hash.github.io';

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function cors(req, res) {
  const allowed = (process.env.ALLOWED_ORIGIN || DEFAULT_ORIGIN).split(',').map(s => s.trim()).filter(Boolean);
  const origin = req.headers.origin;
  if (origin && allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Project-Token');
}

function validId(id) {
  return /^[a-z0-9][a-z0-9-]{0,63}$/.test(String(id || ''));
}

function projectTokens() {
  try { return JSON.parse(process.env.PROJECT_TOKENS_JSON || '{}'); }
  catch { return {}; }
}

function authorized(req, id) {
  const auth = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  const header = String(req.headers['x-project-token'] || '').trim();
  const supplied = auth || header;
  const tokens = projectTokens();
  const expected = String(tokens[id] || process.env.EDITOR_TOKEN || '').trim();
  return Boolean(expected && supplied && supplied === expected);
}

function sanitizeProject(current, incoming, id) {
  const src = incoming && typeof incoming === 'object' ? incoming : {};
  const source = src.source && typeof src.source === 'object' ? src.source : current.source || {};
  const display = src.display && typeof src.display === 'object' ? src.display : current.display || { mode: 'custom' };
  const design = src.design && typeof src.design === 'object' ? src.design : current.design || {};
  const content = src.content && typeof src.content === 'object' ? src.content : current.content || {};
  const moderation = src.moderation && typeof src.moderation === 'object' ? src.moderation : current.moderation || {};
  return {
    ...current,
    id,
    name: typeof src.name === 'string' && src.name.trim() ? src.name.trim().slice(0, 160) : current.name,
    status: current.status || 'active',
    source: {
      provider: 'yandex',
      businessId: String(source.businessId || '').trim(),
      slug: String(source.slug || '').trim(),
      businessUrl: String(source.businessUrl || '').trim()
    },
    reviewsUrl: current.reviewsUrl || `data/projects/${id}.json`,
    display: { mode: display.mode === 'native' ? 'native' : 'custom' },
    design,
    content,
    moderation,
    updatedAt: new Date().toISOString()
  };
}

async function githubRequest(path, options = {}) {
  const repo = process.env.GITHUB_REPO || DEFAULT_REPO;
  const branch = process.env.GITHUB_BRANCH || DEFAULT_BRANCH;
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN is not configured');
  const url = `https://api.github.com/repos/${repo}/contents/${path}${options.method === 'PUT' ? '' : `?ref=${encodeURIComponent(branch)}`}`;
  const headers = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Authorization': `Bearer ${token}`,
    'User-Agent': 'reviews-widget-api',
    ...(options.headers || {})
  };
  const r = await fetch(url, { ...options, headers });
  const text = await r.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch {}
  if (!r.ok) {
    const err = new Error((json && json.message) || `GitHub HTTP ${r.status}`);
    err.status = r.status;
    throw err;
  }
  return json;
}

async function readProject(id) {
  const file = await githubRequest(`projects/${id}.json`);
  const raw = Buffer.from(file.content || '', 'base64').toString('utf8');
  return { project: JSON.parse(raw), sha: file.sha };
}

async function writeProject(id, project, sha) {
  const branch = process.env.GITHUB_BRANCH || DEFAULT_BRANCH;
  return githubRequest(`projects/${id}.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: `Update project ${id}`,
      content: Buffer.from(JSON.stringify(project, null, 2) + '\n', 'utf8').toString('base64'),
      sha,
      branch
    })
  });
}

module.exports = async function handler(req, res) {
  cors(req, res);
  if (req.method === 'OPTIONS') return send(res, 204, {});

  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  if (!validId(id)) return send(res, 400, { error: 'Invalid project id' });

  try {
    const { project, sha } = await readProject(id);
    if (req.method === 'GET') return send(res, 200, project);
    if (req.method !== 'PUT') return send(res, 405, { error: 'Method not allowed' });
    if (!authorized(req, id)) return send(res, 401, { error: 'Invalid project access key' });

    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { return send(res, 400, { error: 'Invalid JSON body' }); }
    }
    const next = sanitizeProject(project, body || {}, id);
    if (!next.source.businessId || !next.source.slug || !next.source.businessUrl) {
      return send(res, 400, { error: 'Yandex organization URL is incomplete' });
    }
    await writeProject(id, next, sha);
    return send(res, 200, { ok: true, project: next });
  } catch (e) {
    const status = e.status === 404 ? 404 : 500;
    return send(res, status, { error: e.message || 'Server error' });
  }
};
