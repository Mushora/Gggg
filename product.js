/**
 * Mushora - Product Detail Controller (Vanilla JS)
 */

import { getProductById, getProducts, initFirebase } from './firebase.js';

document.addEventListener('DOMContentLoaded', async () => {
  initMobileNav();
  await initFirebase();
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  if (!productId) {
    renderNotFound('No product ID was specified.');
    return;
  }

  try {
    const product = await getProductById(productId);
    if (!product) {
      renderNotFound('The requested garment could not be found or has been discontinued.');
      return;
    }

    renderProductDetail(product);
    loadRelatedProducts(product);
  } catch (err) {
    console.error('Error fetching product details:', err);
    renderNotFound('Error loading garment details. Please try again.');
  }
});

function renderNotFound(message) {
  const container = document.getElementById('productDetailContainer');
  if (!container) return;

  container.innerHTML = `
    <div class="catalog-empty" style="max-width: 600px; margin: 40px auto;">
      <div class="empty-icon">⚲</div>
      <h2 class="empty-title">Garment Not Found</h2>
      <p class="empty-desc">${escapeHtml(message)}</p>
      <a href="/#catalogSection" class="btn-primary" style="display: inline-flex;">
        Return to Full Collection
      </a>
    </div>
  `;
}

function renderProductDetail(product) {
  // Update document title and breadcrumbs
  document.title = `${product.title} - Mushora Fashion`;
  const breadcrumbCat = document.getElementById('breadcrumbCategory');
  const breadcrumbTitle = document.getElementById('breadcrumbTitle');
  if (breadcrumbCat) {
    breadcrumbCat.textContent = product.category || 'Collection';
    breadcrumbCat.href = `/#catalogSection`;
  }
  if (breadcrumbTitle) {
    breadcrumbTitle.textContent = product.title;
  }

  // Collect valid gallery images
  const images = [product.image1, product.image2, product.image3, product.image4].filter(
    url => url && typeof url === 'string' && url.trim().length > 0
  );

  const container = document.getElementById('productDetailContainer');
  if (!container) return;

  const ratingStars = '★'.repeat(Math.round(product.rating || 4.5));
  const ratingScore = Number(product.rating || 4.5).toFixed(1);

  container.innerHTML = `
    <div class="product-detail-layout">
      
      <!-- Gallery Column -->
      <div class="product-gallery">
        <div class="main-image-frame" id="mainImageFrame">
          <img 
            id="currentMainImage" 
            src="${escapeHtml(images[0])}" 
            alt="${escapeHtml(product.title)}"
            onerror="this.src='https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1000&q=80'"
          />
        </div>

        ${images.length > 1 ? `
          <div class="thumbnail-strip" role="group" aria-label="Product image gallery thumbnails">
            ${images.map((imgUrl, idx) => `
              <button class="thumbnail-btn ${idx === 0 ? 'active' : ''}" data-img-url="${escapeHtml(imgUrl)}" aria-label="View photo ${idx + 1}">
                <img src="${escapeHtml(imgUrl)}" alt="" onerror="this.src='https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=300&q=80'" />
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>

      <!-- Information & Affiliate CTA Column -->
      <div class="product-detail-info">
        <div class="detail-kicker">${escapeHtml(product.category || 'Curated Edit')}</div>
        <h1 class="detail-title">${escapeHtml(product.title)}</h1>

        <div class="detail-meta-row">
          <div class="detail-rating">
            <span>${ratingStars}</span>
            <span>${ratingScore}</span>
            <span class="detail-rating-reviews">/ 5.0 Curation Score</span>
          </div>

          ${product.offer ? `
            <span class="detail-offer-badge">${escapeHtml(product.offer)}</span>
          ` : ''}
        </div>

        <div class="detail-price-box">
          <div class="detail-price">${escapeHtml(product.price || 'Check Current Price')}</div>
          <div class="detail-merchant-tag">Verified at ${escapeHtml(product.merchant || 'Partner Boutique')}</div>
        </div>

        <p class="detail-description">${escapeHtml(product.description)}</p>

        <!-- Primary Affiliate CTA Box -->
        <div class="affiliate-cta-box">
          <a 
            href="${escapeHtml(product.affiliateUrl)}" 
            target="_blank" 
            rel="noopener noreferrer sponsored" 
            class="btn-affiliate-main"
          >
            <span>Shop on Merchant Website</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
          <div class="affiliate-trust-notice">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <span>Secure checkout handled directly by ${escapeHtml(product.merchant || 'merchant partner')}.</span>
          </div>
        </div>

        <!-- Accordion Details -->
        <div class="detail-accordion">
          <div class="accordion-item open">
            <button class="accordion-trigger" aria-expanded="true">
              <span>Fabrication & Fit Notes</span>
              <span class="accordion-chevron">▾</span>
            </button>
            <div class="accordion-content">
              This garment has been selected by Mushora for premium textile drape and timeless proportion. Designed to integrate seamlessly into a capsule wardrobe. Refer to the merchant size guide for measurements.
            </div>
          </div>

          <div class="accordion-item">
            <button class="accordion-trigger" aria-expanded="false">
              <span>Merchant Order & Delivery</span>
              <span class="accordion-chevron">▾</span>
            </button>
            <div class="accordion-content">
              Orders, fulfillment, international express shipping, and returns are serviced directly by the retailer. Follow the "Shop on Merchant" link to view regional shipping windows and customer support options.
            </div>
          </div>

          <div class="accordion-item">
            <button class="accordion-trigger" aria-expanded="false">
              <span>Affiliate Disclosure Notice</span>
              <span class="accordion-chevron">▾</span>
            </button>
            <div class="accordion-content">
              Mushora participates in selective fashion affiliate networks. If you click through and make a qualifying purchase, we may receive a commission. This never increases the price you pay.
            </div>
          </div>
        </div>

      </div>

    </div>
  `;

  // Attach gallery thumbnail click events
  const thumbBtns = container.querySelectorAll('.thumbnail-btn');
  const mainImg = document.getElementById('currentMainImage');
  thumbBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      thumbBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const newUrl = btn.getAttribute('data-img-url');
      if (mainImg && newUrl) {
        mainImg.style.opacity = '0.5';
        setTimeout(() => {
          mainImg.src = newUrl;
          mainImg.style.opacity = '1';
        }, 150);
      }
    });
  });

  // Attach accordion triggers
  const accordionTriggers = container.querySelectorAll('.accordion-trigger');
  accordionTriggers.forEach(trig => {
    trig.addEventListener('click', () => {
      const item = trig.closest('.accordion-item');
      if (!item) return;
      const isOpen = item.classList.contains('open');
      item.classList.toggle('open', !isOpen);
      trig.setAttribute('aria-expanded', !isOpen ? 'true' : 'false');
    });
  });
}

async function loadRelatedProducts(currentProduct) {
  const section = document.getElementById('relatedSection');
  const grid = document.getElementById('relatedProductsGrid');
  if (!section || !grid) return;

  try {
    const products = await getProducts({ category: currentProduct.category });
    // Filter out current product
    const related = products.filter(p => p.id !== currentProduct.id).slice(0, 4);

    if (related.length === 0) {
      section.style.display = 'none';
      return;
    }

    section.style.display = 'block';
    grid.innerHTML = related.map(prod => `
      <article class="product-card">
        <div class="product-image-container">
          ${prod.offer ? `<span class="product-badge">${escapeHtml(prod.offer)}</span>` : ''}
          <a href="product.html?id=${encodeURIComponent(prod.id)}">
            <img src="${escapeHtml(prod.image1)}" alt="${escapeHtml(prod.title)}" class="product-image" loading="lazy" />
          </a>
        </div>
        <div class="product-info">
          <div class="product-meta">
            <span>${escapeHtml(prod.category)}</span>
            <span class="meta-separator">·</span>
            <span class="product-rating">★ ${Number(prod.rating || 4.5).toFixed(1)}</span>
          </div>
          <h3 class="product-title">
            <a href="product.html?id=${encodeURIComponent(prod.id)}">${escapeHtml(prod.title)}</a>
          </h3>
          <div class="product-footer">
            <div class="product-price-guide">${escapeHtml(prod.price || 'View Details')}</div>
            <a href="product.html?id=${encodeURIComponent(prod.id)}" class="btn-affiliate-cta">
              View
            </a>
          </div>
        </div>
      </article>
    `).join('');
  } catch (err) {
    console.warn('Could not load related products:', err);
    section.style.display = 'none';
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
