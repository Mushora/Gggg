/**
 * Mushora - Main Public Application Controller (Vanilla JS)
 */

import { getCategories, getProducts, initFirebase } from './firebase.js';

// State
let allCategories = [];
let activeCategory = 'all';
let searchDebounceTimer = null;

document.addEventListener('DOMContentLoaded', async () => {
  initMobileNav();
  initFaqAccordion();
  initHeaderScroll();
  initSearchAndFilterEvents();

  // Initialize Firebase and load initial dynamic data
  try {
    await initFirebase();
    await loadCategories();
    await loadProducts();
  } catch (err) {
    console.error('Initialization error:', err);
    showToast('Catalog initialized. Enjoy browsing Mushora!', 'info');
  }
});

/* ============================================================
   CATEGORIES NAVIGATION & FILTER TABS
   ============================================================ */
async function loadCategories() {
  try {
    allCategories = await getCategories();
    renderHeaderCategories(allCategories);
    renderMobileCategories(allCategories);
    renderFooterCategories(allCategories);
    renderCategoryFilterTabs(allCategories);
  } catch (err) {
    console.error('Failed loading categories:', err);
  }
}

function renderHeaderCategories(categories) {
  const container = document.getElementById('headerCategoriesDropdown');
  if (!container) return;

  if (categories.length === 0) {
    container.innerHTML = '<div style="padding: 10px 20px; font-size: 0.8rem; color: #888;">No categories yet</div>';
    return;
  }

  container.innerHTML = categories.map(cat => `
    <a href="#catalogSection" class="dropdown-item" data-cat-name="${escapeHtml(cat.name)}">
      ${escapeHtml(cat.name)}
    </a>
  `).join('');

  // Add click listeners to dropdown links to filter
  container.querySelectorAll('.dropdown-item').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const catName = link.getAttribute('data-cat-name');
      selectCategory(catName);
      scrollToCatalog();
    });
  });
}

function renderMobileCategories(categories) {
  const container = document.getElementById('mobileCategoriesList');
  if (!container) return;

  container.innerHTML = categories.map(cat => `
    <a href="#catalogSection" class="mobile-cat-link mobile-link-close" data-cat-name="${escapeHtml(cat.name)}">
      ${escapeHtml(cat.name)}
    </a>
  `).join('');

  container.querySelectorAll('.mobile-cat-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      closeMobileDrawer();
      const catName = link.getAttribute('data-cat-name');
      selectCategory(catName);
      scrollToCatalog();
    });
  });
}

function renderFooterCategories(categories) {
  const container = document.getElementById('footerCategoriesList');
  if (!container) return;

  container.innerHTML = categories.map(cat => `
    <li>
      <a href="#catalogSection" class="footer-link footer-cat-link" data-cat-name="${escapeHtml(cat.name)}">
        ${escapeHtml(cat.name)}
      </a>
    </li>
  `).join('');

  container.querySelectorAll('.footer-cat-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const catName = link.getAttribute('data-cat-name');
      selectCategory(catName);
      scrollToCatalog();
    });
  });
}

function renderCategoryFilterTabs(categories) {
  const container = document.getElementById('categoryFilterTabs');
  if (!container) return;

  let html = `
    <button class="filter-tab ${activeCategory === 'all' ? 'active' : ''}" data-category="all" role="tab" aria-selected="${activeCategory === 'all'}">
      All Garments
    </button>
  `;

  html += categories.map(cat => `
    <button class="filter-tab ${activeCategory.toLowerCase() === cat.name.toLowerCase() ? 'active' : ''}" data-category="${escapeHtml(cat.name)}" role="tab" aria-selected="${activeCategory.toLowerCase() === cat.name.toLowerCase()}">
      ${escapeHtml(cat.name)}
    </button>
  `).join('');

  container.innerHTML = html;

  // Add click handlers
  container.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const cat = tab.getAttribute('data-category');
      selectCategory(cat);
    });
  });
}

function selectCategory(categoryName) {
  activeCategory = categoryName;

  // Update tabs active state
  const tabs = document.querySelectorAll('#categoryFilterTabs .filter-tab');
  tabs.forEach(tab => {
    const tabCat = tab.getAttribute('data-category');
    const isMatch = (categoryName === 'all' && tabCat === 'all') ||
                    (categoryName.toLowerCase() === tabCat.toLowerCase());
    tab.classList.toggle('active', isMatch);
    tab.setAttribute('aria-selected', isMatch ? 'true' : 'false');
  });

  loadProducts();
}

function scrollToCatalog() {
  const el = document.getElementById('catalogSection');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' });
  }
}

/* ============================================================
   PRODUCT CATALOG LOADER & RENDERING
   ============================================================ */
async function loadProducts() {
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  const searchInput = document.getElementById('catalogSearchInput');
  const sortSelect = document.getElementById('catalogSortSelect');

  const options = {
    category: activeCategory,
    search: searchInput ? searchInput.value : '',
    sortBy: sortSelect ? sortSelect.value : 'featured'
  };

  try {
    const products = await getProducts(options);
    renderProducts(products, grid);
  } catch (err) {
    console.error('Error fetching products:', err);
    grid.innerHTML = `
      <div class="catalog-empty">
        <div class="empty-icon">⚠</div>
        <h3 class="empty-title">Unable to Load Products</h3>
        <p class="empty-desc">There was a brief issue connecting to the database. Please try refreshing.</p>
        <button class="btn-secondary" onclick="window.location.reload()">Refresh Page</button>
      </div>
    `;
  }
}

function renderProducts(products, container) {
  if (products.length === 0) {
    container.innerHTML = `
      <div class="catalog-empty">
        <div class="empty-icon">⚲</div>
        <h3 class="empty-title">No Garments Found</h3>
        <p class="empty-desc">No clothing matches your current filter or search criteria. Try clearing your search or browsing another category.</p>
        <button class="btn-primary" id="resetCatalogFiltersBtn">Reset Filters</button>
      </div>
    `;
    const resetBtn = document.getElementById('resetCatalogFiltersBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        const searchInput = document.getElementById('catalogSearchInput');
        if (searchInput) searchInput.value = '';
        selectCategory('all');
      });
    }
    return;
  }

  container.innerHTML = products.map(prod => {
    const ratingStars = '★'.repeat(Math.round(prod.rating || 4.5));
    const ratingScore = Number(prod.rating || 4.5).toFixed(1);

    return `
      <article class="product-card" data-product-id="${escapeHtml(prod.id)}">
        <div class="product-image-container">
          ${prod.offer ? `<span class="product-badge ${prod.offer.includes('Limited') || prod.offer.includes('Choice') ? 'gold' : ''}">${escapeHtml(prod.offer)}</span>` : ''}
          <a href="/product.html?id=${encodeURIComponent(prod.id)}" aria-label="View ${escapeHtml(prod.title)} details">
            <img 
              src="${escapeHtml(prod.image1)}" 
              alt="${escapeHtml(prod.title)}" 
              class="product-image" 
              loading="lazy"
              onerror="this.src='https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80'"
            />
          </a>
          <div class="product-quick-action">
            <a href="/product.html?id=${encodeURIComponent(prod.id)}" class="btn-card-preview">
              View Piece
            </a>
          </div>
        </div>

        <div class="product-info">
          <!-- Zero-Pill Unboxed Metadata -->
          <div class="product-meta">
            <span>${escapeHtml(prod.category || 'Fashion')}</span>
            <span class="meta-separator" aria-hidden="true">·</span>
            <span class="product-rating" title="Rated ${ratingScore} out of 5 stars">
              ${ratingStars} ${ratingScore}
            </span>
          </div>

          <h3 class="product-title">
            <a href="/product.html?id=${encodeURIComponent(prod.id)}">
              ${escapeHtml(prod.title)}
            </a>
          </h3>

          <div class="product-footer">
            <div class="product-price-guide">
              ${prod.price ? escapeHtml(prod.price) : 'Check Price'}
            </div>

            <!-- Shop Deal CTA: Redirects to internal product page -->
            <a 
              href="/product.html?id=${encodeURIComponent(prod.id)}" 
              class="btn-affiliate-cta"
              title="Shop Deal - View ${escapeHtml(prod.title)} details"
              onclick="event.stopPropagation();"
            >
              <span>Shop Deal</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </a>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

/* ============================================================
   SEARCH & SORT CONTROLS
   ============================================================ */
function initSearchAndFilterEvents() {
  const searchInput = document.getElementById('catalogSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        loadProducts();
      }, 300);
    });
  }

  const sortSelect = document.getElementById('catalogSortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      loadProducts();
    });
  }
}

/* ============================================================
   FAQ ACCORDION
   ============================================================ */
function initFaqAccordion() {
  const faqCards = document.querySelectorAll('.faq-card');
  faqCards.forEach(card => {
    const trigger = card.querySelector('.faq-question');
    if (!trigger) return;

    trigger.addEventListener('click', () => {
      const isOpen = card.classList.contains('open');

      // Close all other cards for clean accordion feel
      faqCards.forEach(c => {
        c.classList.remove('open');
        const q = c.querySelector('.faq-question');
        if (q) q.setAttribute('aria-expanded', 'false');
      });

      // Toggle clicked card
      if (!isOpen) {
        card.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

/* ============================================================
   MOBILE NAVIGATION DRAWER
   ============================================================ */
function initMobileNav() {
  const toggle = document.getElementById('mobileNavToggle');
  const drawer = document.getElementById('mobileDrawer');
  const overlay = document.getElementById('mobileDrawerOverlay');

  if (!toggle || !drawer || !overlay) return;

  function openDrawer() {
    toggle.classList.add('open');
    drawer.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    toggle.classList.remove('open');
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  toggle.addEventListener('click', () => {
    if (drawer.classList.contains('open')) {
      closeDrawer();
    } else {
      openDrawer();
    }
  });

  overlay.addEventListener('click', closeDrawer);

  document.querySelectorAll('.mobile-link-close').forEach(link => {
    link.addEventListener('click', closeDrawer);
  });
}

function closeMobileDrawer() {
  const toggle = document.getElementById('mobileNavToggle');
  const drawer = document.getElementById('mobileDrawer');
  const overlay = document.getElementById('mobileDrawerOverlay');
  if (toggle) toggle.classList.remove('open');
  if (drawer) drawer.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}

/* ============================================================
   HEADER SHADOW ON SCROLL
   ============================================================ */
function initHeaderScroll() {
  const header = document.getElementById('siteHeader');
  if (!header) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }, { passive: true });
}

/* ============================================================
   TOAST HELPER
   ============================================================ */
export function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'toast-error' : 'toast-success'}`;
  toast.innerHTML = `
    <span>${type === 'error' ? '✕' : '✓'}</span>
    <span>${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Security: basic HTML sanitization
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
