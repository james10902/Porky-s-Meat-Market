/**
 * Reviews Module
 * Displays customer reviews with star ratings, comments, and submission.
 * Attempts Google Places API if a key is configured, falls back to curated mock data.
 */

const Reviews = {
  STORAGE_KEY: 'porky_reviews',
  // Set your Google Places API key and Place ID here when available:
  GOOGLE_API_KEY: '',
  GOOGLE_PLACE_ID: 'ChIJN1t_tDeuEmsRUsoyG83frY4', // placeholder — replace with real Place ID

  _reviews: [],
  _page: 1,
  _perPage: 6,

  /* ── Init ── */
  init: async () => {
    const container = document.getElementById('reviews-container');
    if (!container) return;
    await Reviews._load();
    Reviews._renderSummary();
    Reviews._renderGrid();
    Reviews._bindSubmitForm();
  },

  /* ── Load reviews (Google → localStorage → mock) ── */
  _load: async () => {
    // 1. Try Google Places API
    if (Reviews.GOOGLE_API_KEY) {
      try {
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${Reviews.GOOGLE_PLACE_ID}&fields=reviews,rating,user_ratings_total&key=${Reviews.GOOGLE_API_KEY}`;
        const res  = await fetch(url);
        const data = await res.json();
        if (data.result && data.result.reviews) {
          const googleReviews = data.result.reviews.map((r, i) => ({
            id:       'g_' + i,
            author:   r.author_name,
            avatar:   r.profile_photo_url || '',
            rating:   r.rating,
            text:     r.text,
            date:     new Date(r.time * 1000).toISOString(),
            source:   'google',
            comments: []
          }));
          Reviews._reviews = [...googleReviews, ...Reviews._getLocal()];
          return;
        }
      } catch (e) {
        console.warn('Google Places unavailable, using local reviews');
      }
    }

    // 2. Merge local + mock
    const local = Reviews._getLocal();
    const mock  = Reviews._getMock();
    // Avoid duplicates by id
    const localIds = new Set(local.map(r => r.id));
    Reviews._reviews = [...local, ...mock.filter(r => !localIds.has(r.id))];
  },

  /* ── localStorage helpers ── */
  _getLocal: () => {
    try { return JSON.parse(localStorage.getItem(Reviews.STORAGE_KEY)) || []; }
    catch { return []; }
  },

  _saveLocal: (reviews) => {
    localStorage.setItem(Reviews.STORAGE_KEY, JSON.stringify(reviews));
  },

  /* ── Mock data ── */
  _getMock: () => [
    {
      id: 'm1', author: 'Tangi Nghifikepunye', avatar: '', rating: 5,
      text: "Best meat in Windhoek, no question. The boerewors is absolutely incredible and the staff always know exactly what you need. Been coming here since I was a kid with my dad.",
      date: '2025-11-14T09:00:00Z', source: 'google', comments: []
    },
    {
      id: 'm2', author: 'Marius van der Merwe', avatar: '', rating: 5,
      text: "Porky's has been our go-to for braai supplies for years. The quality is consistently excellent and the prices are fair. Cold chain delivery is a game changer for our restaurant.",
      date: '2025-10-28T14:30:00Z', source: 'google', comments: []
    },
    {
      id: 'm3', author: 'Selma Amupolo', avatar: '', rating: 4,
      text: "Great selection and very fresh products. The chicken feet and necks are always well-prepared. Would love to see more game meat options but overall very satisfied.",
      date: '2025-12-02T11:15:00Z', source: 'google', comments: []
    },
    {
      id: 'm4', author: 'Johannes Katjimune', avatar: '', rating: 5,
      text: "We supply our school canteen through Porky's wholesale. Reliable, HACCP compliant, and the team is always professional. Highly recommend for institutional buyers.",
      date: '2026-01-08T08:45:00Z', source: 'google', comments: []
    },
    {
      id: 'm5', author: 'Frieda Shikongo', avatar: '', rating: 5,
      text: "The droewors is out of this world! My whole family drives from Okahandja just to stock up. The online ordering makes it so convenient now.",
      date: '2026-02-17T16:00:00Z', source: 'google', comments: []
    },
    {
      id: 'm6', author: 'Petrus Hamutenya', avatar: '', rating: 4,
      text: "Solid quality across the board. The beef stew cuts are perfect for potjie. Delivery was on time and everything was properly chilled. Will definitely order again.",
      date: '2026-03-05T10:20:00Z', source: 'google', comments: []
    }
  ],

  /* ── Compute summary stats ── */
  _getSummary: () => {
    const reviews = Reviews._reviews;
    if (!reviews.length) return { avg: 0, total: 0, breakdown: {} };
    const total = reviews.length;
    const sum   = reviews.reduce((a, r) => a + r.rating, 0);
    const avg   = sum / total;
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => { breakdown[r.rating] = (breakdown[r.rating] || 0) + 1; });
    return { avg, total, breakdown };
  },

  /* ── Render summary bar ── */
  _renderSummary: () => {
    const el = document.getElementById('reviews-summary');
    if (!el) return;
    const { avg, total, breakdown } = Reviews._getSummary();

    const starsHtml = Reviews._starsHtml(Math.round(avg));
    const breakdownHtml = [5, 4, 3, 2, 1].map(n => {
      const count = breakdown[n] || 0;
      const pct   = total ? Math.round((count / total) * 100) : 0;
      return `<div class="breakdown-row">
        <span class="breakdown-label">${n} ★</span>
        <div class="breakdown-bar-wrap"><div class="breakdown-bar" style="width:${pct}%"></div></div>
        <span class="breakdown-count">${count}</span>
      </div>`;
    }).join('');

    el.innerHTML = `
      <div class="reviews-avg-score">
        <span class="reviews-avg-number">${avg.toFixed(1)}</span>
        <div class="reviews-avg-stars">${starsHtml}</div>
        <span class="reviews-avg-count">${total} review${total !== 1 ? 's' : ''}</span>
      </div>
      <div class="reviews-breakdown">${breakdownHtml}</div>
      <div class="google-badge">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Google Reviews
      </div>`;
  },

  /* ── Render reviews grid ── */
  _renderGrid: () => {
    const container = document.getElementById('reviews-container');
    if (!container) return;

    const visible = Reviews._reviews.slice(0, Reviews._page * Reviews._perPage);
    const hasMore = Reviews._reviews.length > visible.length;

    container.innerHTML = `
      <div class="reviews-grid reveal-stagger" id="reviews-grid">
        ${visible.map(r => Reviews._cardHtml(r)).join('')}
      </div>
      ${hasMore ? `<div class="reviews-load-more"><button class="btn btn-secondary" onclick="Reviews._loadMore()">Load More Reviews</button></div>` : ''}`;

    // Animate in
    requestAnimationFrame(() => {
      container.querySelectorAll('.review-card').forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = `opacity 0.4s ${i * 60}ms ease, transform 0.4s ${i * 60}ms ease`;
        requestAnimationFrame(() => {
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        });
      });
    });
  },

  _loadMore: () => {
    Reviews._page++;
    Reviews._renderGrid();
  },

  /* ── Single card HTML ── */
  _cardHtml: (review) => {
    const initials = review.author.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const avatarContent = review.avatar
      ? `<img src="${review.avatar}" alt="${review.author}" onerror="this.parentElement.textContent='${initials}'">`
      : initials;
    const dateStr = new Date(review.date).toLocaleDateString('en-NA', { day: 'numeric', month: 'short', year: 'numeric' });
    const commentsHtml = (review.comments || []).map(c =>
      `<div class="review-comment-item"><span class="review-comment-author">${Reviews._escape(c.author)}:</span>${Reviews._escape(c.text)}</div>`
    ).join('');

    const googleIcon = review.source === 'google' ? `
      <div class="review-source" title="Google Review">
        <svg viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
      </div>` : '';

    return `
      <div class="review-card" data-review-id="${review.id}">
        <div class="review-card-header">
          <div class="review-avatar">${avatarContent}</div>
          <div class="review-meta">
            <div class="review-author">${Reviews._escape(review.author)}</div>
            <div class="review-date">${dateStr}</div>
          </div>
          ${googleIcon}
        </div>
        <div class="review-stars">${Reviews._starsHtml(review.rating)}</div>
        <p class="review-text">${Reviews._escape(review.text)}</p>
        <div class="review-comments">
          <div class="review-comments-list" id="comments-${review.id}">${commentsHtml}</div>
          <div class="review-comment-form">
            <input type="text" placeholder="Add a comment…" id="comment-input-${review.id}" aria-label="Add comment">
            <button onclick="Reviews._addComment('${review.id}')" aria-label="Post comment">Post</button>
          </div>
        </div>
      </div>`;
  },

  /* ── Add comment ── */
  _addComment: (reviewId) => {
    const input = document.getElementById('comment-input-' + reviewId);
    if (!input || !input.value.trim()) return;

    const user    = (typeof Auth !== 'undefined' && Auth.getCurrentUser()) || null;
    const author  = user ? (user.firstname || 'You') : 'Guest';
    const comment = { author, text: input.value.trim(), date: new Date().toISOString() };

    const review = Reviews._reviews.find(r => r.id === reviewId);
    if (review) {
      review.comments = review.comments || [];
      review.comments.push(comment);
      // Persist local reviews
      const local = Reviews._getLocal();
      const idx   = local.findIndex(r => r.id === reviewId);
      if (idx >= 0) { local[idx] = review; } else { local.push(review); }
      Reviews._saveLocal(local);
    }

    const list = document.getElementById('comments-' + reviewId);
    if (list) {
      const el = document.createElement('div');
      el.className = 'review-comment-item';
      el.innerHTML = `<span class="review-comment-author">${Reviews._escape(author)}:</span>${Reviews._escape(comment.text)}`;
      list.appendChild(el);
      list.scrollTop = list.scrollHeight;
    }
    input.value = '';
  },

  /* ── Submit new review ── */
  _bindSubmitForm: () => {
    const form = document.getElementById('review-submit-form');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const rating = parseInt(form.querySelector('input[name="rating"]:checked')?.value || '0');
      if (!rating) { alert('Please select a star rating.'); return; }

      const user   = (typeof Auth !== 'undefined' && Auth.getCurrentUser()) || null;
      const author = form.querySelector('#review-name')?.value.trim() || (user ? (user.firstname + ' ' + (user.lastname || '')).trim() : 'Anonymous');
      const text   = form.querySelector('#review-text')?.value.trim();
      if (!text) return;

      const newReview = {
        id:       'u_' + Date.now(),
        author,
        avatar:   user?.avatar || '',
        rating,
        text,
        date:     new Date().toISOString(),
        source:   'local',
        comments: []
      };

      Reviews._reviews.unshift(newReview);
      const local = Reviews._getLocal();
      local.unshift(newReview);
      Reviews._saveLocal(local);

      Reviews._renderSummary();
      Reviews._renderGrid();

      form.reset();
      const msg = document.getElementById('review-success');
      if (msg) { msg.style.display = 'block'; setTimeout(() => { msg.style.display = 'none'; }, 4000); }
    });
  },

  /* ── Helpers ── */
  _starsHtml: (rating) => {
    return [1, 2, 3, 4, 5].map(n =>
      `<span class="star${n > rating ? ' empty' : ''}">★</span>`
    ).join('');
  },

  _escape: (str) => String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('reviews-container')) Reviews.init();
  });
} else {
  if (document.getElementById('reviews-container')) Reviews.init();
}

if (typeof module !== 'undefined' && module.exports) module.exports = Reviews;
