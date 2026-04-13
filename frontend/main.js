// ============================================================
//  State
// ============================================================
let allProjects = [];
let activeFilter = 'all';

// ============================================================
//  Boot
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  populatePage();
  initScrollSpy();
  initTypingEffect();
  initFilters();
  loadProjects();
});

// ============================================================
//  Populate page from config.js CONFIG object
// ============================================================
function populatePage() {
  document.getElementById('pageTitle').textContent = `${CONFIG.NAME} — ${CONFIG.TITLE}`;
  document.getElementById('terminalUser').textContent = CONFIG.TERMINAL_USER;
  document.getElementById('navLogo').innerHTML = `&lt;${escHtml(CONFIG.NAME)} /&gt;`;
  document.getElementById('heroTitle').textContent = CONFIG.TITLE;
  document.getElementById('heroSubtitle').innerHTML = highlightTagline(CONFIG.TAGLINE);
  document.getElementById('heroBadges').innerHTML =
    CONFIG.BADGES.map(b => `<span class="badge">${escHtml(b)}</span>`).join('');

  // Email
  document.getElementById('contactEmail').href = `mailto:${escHtml(CONFIG.EMAIL)}`;
  document.getElementById('contactEmailText').textContent = CONFIG.EMAIL;

  // Social links
  document.getElementById('contactSocials').innerHTML = `
    <a href="${escHtml(CONFIG.GITHUB_URL)}" target="_blank" rel="noopener" class="social-link">
      ${githubIcon()} GitHub
    </a>
    <a href="${escHtml(CONFIG.LINKEDIN_URL)}" target="_blank" rel="noopener" class="social-link">
      ${linkedinIcon()} LinkedIn
    </a>`;

  document.getElementById('footerText').innerHTML =
    `Powered by GitHub API · <a href="${escHtml(CONFIG.GITHUB_URL)}/portfolio" target="_blank">Source</a>`;
}

// ============================================================
//  Scroll spy — highlights the active nav link
// ============================================================
function initScrollSpy() {
  const sectionIds = ['about', 'projects', 'contact'];
  const navLinks = document.querySelectorAll('#mainNav a[data-section]');
  const navHeight = document.querySelector('.nav').offsetHeight;
  let ticking = false;

  const setActive = id => {
    navLinks.forEach(a => a.classList.toggle('active', a.dataset.section === id));
  };

  const getActiveSection = () => {
    const scrollY = window.scrollY;

    // Bottom of page → always the last section
    const atBottom = scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
    if (atBottom) return sectionIds[sectionIds.length - 1];

    // A section becomes active when its top enters the top third of the viewport.
    // Using 33% of viewport height means you have to actually be looking at the
    // section before it activates — not just because the previous one is still tall.
    const trigger = navHeight + window.innerHeight * 0.33;

    let active = sectionIds[0];
    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el && el.offsetTop - trigger <= scrollY) {
        active = id;
      }
    }
    return active;
  };

  // Set on load
  setActive(getActiveSection());

  // Update on scroll using rAF so we don't thrash on every pixel
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        setActive(getActiveSection());
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // On click: set immediately for instant feedback
  navLinks.forEach(link => {
    link.addEventListener('click', () => setActive(link.dataset.section));
  });
}

// ============================================================
//  Typing effect in hero
// ============================================================
function initTypingEffect() {
  const commands = CONFIG.TERMINAL_COMMANDS;
  const el = document.getElementById('typedCmd');
  let cmdIndex = 0;
  let charIndex = 0;
  let deleting = false;

  function tick() {
    const cmd = commands[cmdIndex];
    if (!deleting) {
      el.textContent = cmd.slice(0, ++charIndex);
      if (charIndex === cmd.length) {
        deleting = true;
        setTimeout(tick, 2000);
        return;
      }
    } else {
      el.textContent = cmd.slice(0, --charIndex);
      if (charIndex === 0) {
        deleting = false;
        cmdIndex = (cmdIndex + 1) % commands.length;
      }
    }
    setTimeout(tick, deleting ? 40 : 80);
  }
  tick();
}

// ============================================================
//  Filter buttons
// ============================================================
function initFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      renderProjects();
    });
  });
}

// ============================================================
//  Load projects — GitHub API + projects-meta.json merged
// ============================================================
async function loadProjects() {
  const loading = document.getElementById('projectsLoading');
  const empty = document.getElementById('projectsEmpty');

  loading.classList.remove('hidden');
  empty.classList.add('hidden');

  try {
    const [ghRepos, meta] = await Promise.all([
      fetchGitHubRepos(),
      fetchMeta(),
    ]);
    allProjects = mergeProjects(ghRepos, meta);
  } catch (err) {
    console.error('Failed to load projects:', err);
    allProjects = [];
    empty.querySelector('p').textContent = 'Could not load projects. Please try again later.';
  } finally {
    loading.classList.add('hidden');
    renderProjects();
  }
}

async function fetchGitHubRepos() {
  const url = `https://api.github.com/search/repositories?q=user:${CONFIG.GITHUB_USERNAME}+topic:portfolio&sort=updated&per_page=50`;
  const res = await fetch(url, {
    headers: { 'Accept': 'application/vnd.github+json' }
  });
  if (!res.ok) throw new Error(`GitHub API returned ${res.status}`);
  const data = await res.json();
  return data.items ?? [];
}

async function fetchMeta() {
  try {
    const res = await fetch('projects-meta.json');
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

function mergeProjects(ghRepos, meta) {
  const metaByRepo = Object.fromEntries(
    meta.filter(m => m.repoName).map(m => [m.repoName.toLowerCase(), m])
  );

  const ghByName = Object.fromEntries(
    ghRepos.map(r => [r.name.toLowerCase(), r])
  );

  const result = [];
  const handled = new Set();

  // GitHub repos — enriched with meta if available
  for (const repo of ghRepos) {
    const key = repo.name.toLowerCase();
    const m = metaByRepo[key];

    if (m?.isVisible === false) continue;

    result.push({
      title: m?.customTitle || repo.name,
      description: m?.customDescription || repo.description || '',
      imageUrl: m?.imageUrl || null,
      liveUrl: m?.liveUrl || null,
      gitHubUrl: repo.html_url,
      language: repo.language,
      stars: repo.stargazers_count,
      topics: (repo.topics || []).filter(t => t !== 'portfolio'),
      stack: m?.stack || [],
      isFeatured: m?.isFeatured ?? false,
      sortOrder: m?.sortOrder ?? 0,
      lastUpdated: repo.updated_at,
      source: m ? 'hybrid' : 'github',
    });

    handled.add(key);
  }

  // Manual entries in meta with no matching GitHub repo
  for (const m of meta) {
    if (!m.repoName) continue;
    const key = m.repoName.toLowerCase();
    if (handled.has(key) || m.isVisible === false) continue;
    if (ghByName[key]) continue; // already handled above

    result.push({
      title: m.customTitle || m.repoName,
      description: m.customDescription || '',
      imageUrl: m.imageUrl || null,
      liveUrl: m.liveUrl || null,
      gitHubUrl: null,
      language: null,
      stars: 0,
      topics: [],
      stack: m.stack || [],
      isFeatured: m.isFeatured ?? false,
      sortOrder: m.sortOrder ?? 0,
      lastUpdated: null,
      source: 'manual',
    });
  }

  return result
    .sort((a, b) => {
      if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
      if (a.sortOrder !== b.sortOrder) return (a.sortOrder || 999) - (b.sortOrder || 999);
      return new Date(b.lastUpdated ?? 0) - new Date(a.lastUpdated ?? 0);
    });
}

// ============================================================
//  Render filtered cards
// ============================================================
function renderProjects() {
  const grid = document.getElementById('projectsGrid');
  const empty = document.getElementById('projectsEmpty');

  const filtered = allProjects.filter(p => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'featured') return p.isFeatured;
    if (activeFilter === 'github') return p.source === 'github';
    return true;
  });

  if (filtered.length === 0) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');
  grid.innerHTML = filtered.map(buildCard).join('');
}

// ============================================================
//  Card HTML builder
// ============================================================
function buildCard(p) {
  const image = p.imageUrl
    ? `<img src="${escHtml(p.imageUrl)}" alt="${escHtml(p.title)}" loading="lazy" />`
    : `<div class="card-image-placeholder">&lt;/&gt;</div>`;

  const githubOverlay = p.gitHubUrl
    ? `<div class="card-github-overlay">
        <a href="${escHtml(p.gitHubUrl)}" target="_blank" rel="noopener">
          ${githubIcon()} View on GitHub
        </a>
       </div>`
    : '';

  const ribbon = p.isFeatured
    ? `<span class="featured-ribbon">Featured</span>` : '';

  const stars = p.stars > 0
    ? `<span class="card-stars">
        <svg viewBox="0 0 16 16"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/></svg>
        ${p.stars}
       </span>`
    : '';

  const tags = (p.topics || []).slice(0, 4).map(t =>
    `<span class="card-tag">${escHtml(t)}</span>`
  ).join('');

  const lang = p.language
    ? `<span class="card-lang"><span class="lang-dot" style="background:${langColor(p.language)}"></span>${escHtml(p.language)}</span>`
    : '';

  const liveBtn = p.liveUrl
    ? `<a href="${escHtml(p.liveUrl)}" target="_blank" rel="noopener" class="card-btn">
        ${externalIcon()} Live Demo
       </a>`
    : '';

  const updated = p.lastUpdated
    ? `<span class="source-badge">${timeAgo(p.lastUpdated)}</span>`
    : `<span class="source-badge">${escHtml(p.source)}</span>`;

  const stackPanel = p.stack?.length
    ? `<div class="card-stack-panel">
        <span class="stack-panel-title">Stack</span>
        <div class="stack-groups">
          ${p.stack.map(group => `
            <div class="stack-group">
              <span class="stack-group-label">${escHtml(group.label)}</span>
              <div class="stack-items">
                ${group.items.map(i => `<span class="stack-item">${escHtml(i)}</span>`).join('')}
              </div>
            </div>`).join('')}
        </div>
      </div>`
    : '';

  return `
    <article class="project-card">
      <div class="card-image-wrap">
        ${image}
        ${githubOverlay}
        ${stackPanel}
        ${ribbon}
      </div>
      <div class="card-body">
        <div class="card-header">
          <h3 class="card-title">${escHtml(p.title)}</h3>
          ${stars}
        </div>
        <p class="card-description">${escHtml(p.description)}</p>
        ${tags ? `<div class="card-tags">${tags}</div>` : ''}
        ${lang}
      </div>
      <footer class="card-footer">
        <div class="card-actions">
          ${liveBtn}
          ${p.gitHubUrl ? `<a href="${escHtml(p.gitHubUrl)}" target="_blank" rel="noopener" class="card-btn">${githubIcon()} Code</a>` : ''}
        </div>
        ${updated}
      </footer>
    </article>`;
}

// ============================================================
//  Helpers
// ============================================================
// Normalizes line breaks from copy-pasted text and highlights tech keywords
function highlightTagline(text) {
  const normalized = escHtml(text.replace(/\s*\n\s*/g, ' ').trim());

  const keywords = [
    'C#', '\\.NET Framework', 'ASP\\.NET Web API', 'SQL Server',
    'JWT', 'banking', 'fintech', 'RESTful APIs', 'microservices',
  ];
  const regex = new RegExp(`(${keywords.join('|')})`, 'gi');
  return normalized.replace(regex, '<span class="kw">$1</span>');
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'today';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

// Approximate GitHub language colours
function langColor(lang) {
  const map = {
    'C#': '#178600', 'JavaScript': '#f1e05a', 'TypeScript': '#3178c6',
    'Python': '#3572A5', 'Go': '#00ADD8', 'Rust': '#dea584',
    'Java': '#b07219', 'HTML': '#e34c26', 'CSS': '#563d7c',
    'SQL': '#e38c00', 'Shell': '#89e051',
  };
  return map[lang] || '#8b949e';
}

function githubIcon() {
  return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>`;
}

function externalIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;
}

function linkedinIcon() {
  return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`;
}
