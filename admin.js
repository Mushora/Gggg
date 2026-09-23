/**
 * Mushora - Admin Dashboard Controller (Vanilla JS)
 */

import {
  isUserAdminLoggedIn,
  getAdminSession,
  adminLogout,
  initFirebase,
  isFirebaseConfigured,
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  updateAdminCredentials,
  seedLiveFirestore,
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS
} from './firebase.js';

// State
let allCategories = [];
let allProducts = [];
let productPendingDeleteId = null;
let categoryPendingDeleteId = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Check Admin Authentication
  if (!isUserAdminLoggedIn()) {
    window.location.replace('admin-login.html');
    return;
  }

  // Display admin username in header
  const session = getAdminSession();
  const greeting = document.getElementById('adminUserGreeting');
  if (greeting && session) {
    greeting.textContent = `Logged in as ${session.username || 'Administrator'}`;
  }

  // Initialize Firebase and load data
  await initFirebase();
  initTabNavigation();
  initLogout();
  initProductModal();
  initCategoryActions();
  initSettingsForm();
  initSeedHelper();

  // Load datasets
  await refreshAdminData();
});

/* ============================================================
   DATA REFRESH & STATS CALCULATION
   ============================================================ */
async function refreshAdminData() {
  try {
    allCategories = await getCategories();
    allProducts = await getProducts();

    updateDashboardMetrics();
    renderRecentProductsTable();
    renderAdminProductsTable();
    renderAdminCategoriesTable();
    populateCategoryDropdowns();
    updateFirebaseStatusCard();
  } catch (err) {
    console.error('Failed refreshing admin datasets:', err);
    showToast('Notice: Could not sync some catalog items.', 'error');
  }
}

function updateDashboardMetrics() {
  const statProducts = document.getElementById('statTotalProducts');
  const statCategories = document.getElementById('statTotalCategories');
  const statFeatured = document.getElementById('statFeaturedProducts');
  const statDb = document.getElementById('statDbStatus');
  const statDbDetail = document.getElementById('statDbDetail');

  if (statProducts) statProducts.textContent = allProducts.length;
  if (statCategories) statCategories.textContent = allCategories.length;
  if (statFeatured) {
    statFeatured.textContent = allProducts.filter(p => p.featured).length;
  }

  const liveConfig = isFirebaseConfigured();
  if (statDb) {
    statDb.textContent = liveConfig ? 'Firestore' : 'Local Preview';
    statDb.style.color = liveConfig ? '#2e694a' : '#a37a36';
  }
  if (statDbDetail) {
    statDbDetail.textContent = liveConfig ? 'Connected to live cloud' : 'Demo storage active';
  }
}

function updateFirebaseStatusCard() {
  const note = document.getElementById('settingsFirebaseStatusNote');
  if (!note) return;

  if (isFirebaseConfigured()) {
    note.innerHTML = `<span style="color: #2e694a;">● Live Firebase Firestore & Auth are active.</span>`;
  } else {
    note.innerHTML = `
      <span style="color: #a37a36;">○ Running in Local Demo Storage.</span><br />
      <small style="color: var(--color-stone); font-size: 0.78rem;">
        Insert your project API keys in <code>firebase.js</code> to link live Firestore.
      </small>
    `;
  }
}

/* ============================================================
   TABS NAVIGATION
   ============================================================ */
function initTabNavigation() {
  const navItems = document.querySelectorAll('.admin-nav-item');
  const panes = document.querySelectorAll('.admin-tab-pane');
  const heading = document.getElementById('adminSectionHeading');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetTab = item.getAttribute('data-tab');

      navItems.forEach(n => n.classList.remove('active'));
      panes.forEach(p => p.style.display = 'none');

      item.classList.add('active');
      const targetPane = document.getElementById(targetTab);
      if (targetPane) targetPane.style.display = 'block';

      if (heading) {
        if (targetTab === 'tabDashboard') heading.textContent = 'Dashboard Overview';
        if (targetTab === 'tabProducts') heading.textContent = 'Product Management';
        if (targetTab === 'tabCategories') heading.textContent = 'Category Management';
        if (targetTab === 'tabSettings') heading.textContent = 'Admin Settings';
      }
    });
  });

  const goToProductsBtn = document.getElementById('goToProductsTabBtn');
  if (goToProductsBtn) {
    goToProductsBtn.addEventListener('click', () => {
      const prodNavBtn = document.querySelector('[data-tab="tabProducts"]');
      if (prodNavBtn) prodNavBtn.click();
    });
  }
}

/* ============================================================
   LOGOUT
   ============================================================ */
function initLogout() {
  const logoutBtn = document.getElementById('adminLogoutBtn');
  if (!logoutBtn) return;

  logoutBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to log out of the Mushora Admin Portal?')) {
      await adminLogout();
      window.location.replace('admin-login.html');
    }
  });
}

/* ============================================================
   PRODUCT MANAGEMENT (TABLES & MODALS)
   ============================================================ */
function renderRecentProductsTable() {
  const tbody = document.getElementById('recentProductsTableBody');
  if (!tbody) return;

  const recent = allProducts.slice(0, 5);
  if (recent.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">No products added yet.</td></tr>';
    return;
  }

  tbody.innerHTML = recent.map(prod => `
    <tr>
      <td>
        <img 
          src="${escapeHtml(prod.image1)}" 
          alt="${escapeHtml(prod.title)}" 
          class="table-thumb"
          onerror="this.src='https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=100&q=80'"
        />
      </td>
      <td><strong>${escapeHtml(prod.title)}</strong></td>
      <td>${escapeHtml(prod.category)}</td>
      <td>★ ${Number(prod.rating || 4.5).toFixed(1)}</td>
      <td>${prod.offer ? escapeHtml(prod.offer) : (prod.price || '—')}</td>
      <td>
        <a href="${escapeHtml(prod.affiliateUrl)}" target="_blank" rel="noopener noreferrer sponsored" style="color: var(--color-accent); text-decoration: underline; font-size: 0.82rem;">
          Test Link ↗
        </a>
      </td>
    </tr>
  `).join('');
}

function renderAdminProductsTable() {
  const tbody = document.getElementById('adminProductsTableBody');
  if (!tbody) return;

  const searchInput = document.getElementById('adminProductSearch');
  const catFilter = document.getElementById('adminProductCatFilter');

  const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const selectedCat = catFilter ? catFilter.value : 'all';

  let list = allProducts.filter(p => {
    const matchesCat = (selectedCat === 'all') || (p.category && p.category.toLowerCase() === selectedCat.toLowerCase());
    const matchesSearch = !searchTerm ||
      (p.title && p.title.toLowerCase().includes(searchTerm)) ||
      (p.category && p.category.toLowerCase().includes(searchTerm)) ||
      (p.description && p.description.toLowerCase().includes(searchTerm));
    return matchesCat && matchesSearch;
  });

  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 30px;">No garments match criteria.</td></tr>';
    return;
  }

  tbody.innerHTML = list.map(prod => `
    <tr>
      <td>
        <img 
          src="${escapeHtml(prod.image1)}" 
          alt="${escapeHtml(prod.title)}" 
          class="table-thumb"
          onerror="this.src='https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=100&q=80'"
        />
      </td>
      <td>
        <strong>${escapeHtml(prod.title)}</strong><br />
        <small style="color: var(--color-stone);">${escapeHtml(prod.merchant || 'Partner')}</small>
      </td>
      <td>${escapeHtml(prod.category)}</td>
      <td>★ ${Number(prod.rating || 4.5).toFixed(1)}</td>
      <td>
        ${prod.offer ? `<span class="detail-offer-badge" style="font-size: 0.7rem;">${escapeHtml(prod.offer)}</span> ` : ''}
        <span>${escapeHtml(prod.price || '—')}</span>
      </td>
      <td>${prod.featured ? '★ Yes' : 'No'}</td>
      <td>
        <div class="table-actions">
          <button class="btn-action-edit edit-product-btn" data-id="${escapeHtml(prod.id)}">Edit</button>
          <button class="btn-action-delete delete-product-btn" data-id="${escapeHtml(prod.id)}" data-title="${escapeHtml(prod.title)}">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');

  // Attach Edit and Delete listeners
  tbody.querySelectorAll('.edit-product-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      openEditProductModal(id);
    });
  });

  tbody.querySelectorAll('.delete-product-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const title = btn.getAttribute('data-title');
      openDeleteProductModal(id, title);
    });
  });
}

function populateCategoryDropdowns() {
  const formCatSelect = document.getElementById('formProductCategory');
  const filterCatSelect = document.getElementById('adminProductCatFilter');

  if (formCatSelect) {
    formCatSelect.innerHTML = allCategories.map(cat => `
      <option value="${escapeHtml(cat.name)}">${escapeHtml(cat.name)}</option>
    `).join('');
  }

  if (filterCatSelect) {
    const currentVal = filterCatSelect.value;
    filterCatSelect.innerHTML = '<option value="all">All Categories</option>' +
      allCategories.map(cat => `
        <option value="${escapeHtml(cat.name)}">${escapeHtml(cat.name)}</option>
      `).join('');
    filterCatSelect.value = currentVal || 'all';
  }
}

function initProductModal() {
  const modal = document.getElementById('productModal');
  const openBtn = document.getElementById('openAddProductModalBtn');
  const openBtn2 = document.getElementById('openAddProductModalBtn2');
  const closeBtn = document.getElementById('closeProductModalBtn');
  const cancelBtn = document.getElementById('cancelProductBtn');
  const form = document.getElementById('productForm');

  if (!modal || !form) return;

  function openAddModal() {
    form.reset();
    document.getElementById('formProductId').value = '';
    document.getElementById('productModalTitle').textContent = 'Add New Fashion Piece';
    populateCategoryDropdowns();
    modal.classList.add('open');
  }

  function closeModal() {
    modal.classList.remove('open');
  }

  if (openBtn) openBtn.addEventListener('click', openAddModal);
  if (openBtn2) openBtn2.addEventListener('click', openAddModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

  // Form submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('formProductId').value;
    const title = document.getElementById('formProductTitle').value.trim();
    const category = document.getElementById('formProductCategory').value;
    const merchant = document.getElementById('formProductMerchant').value.trim();
    const description = document.getElementById('formProductDesc').value.trim();
    const price = document.getElementById('formProductPrice').value.trim();
    const offer = document.getElementById('formProductOffer').value.trim();
    const rating = document.getElementById('formProductRating').value;
    const featured = document.getElementById('formProductFeatured').checked;
    const affiliateUrl = document.getElementById('formProductAffiliateUrl').value.trim();
    const image1 = document.getElementById('formProductImage1').value.trim();
    const image2 = document.getElementById('formProductImage2').value.trim();
    const image3 = document.getElementById('formProductImage3').value.trim();
    const image4 = document.getElementById('formProductImage4').value.trim();

    // Validation
    if (!title) {
      alert('Product title is required.');
      return;
    }
    if (!description) {
      alert('Editorial description is required.');
      return;
    }
    if (!category) {
      alert('Please select a category.');
      return;
    }
    if (!mainImageIsValid(image1)) {
      alert('Please enter a valid Main Image URL (e.g. starting with http:// or https://).');
      return;
    }
    if (!affiliateUrlIsValid(affiliateUrl)) {
      alert('Please enter a valid Affiliate Destination URL (starting with http:// or https://).');
      return;
    }

    const payload = {
      title,
      category,
      merchant,
      description,
      price,
      offer,
      rating: Number(rating) || 4.5,
      featured,
      affiliateUrl,
      image1,
      image2,
      image3,
      image4
    };

    try {
      if (id) {
        // Edit
        await updateProduct(id, payload);
        showToast('Product updated successfully!');
      } else {
        // Add
        await addProduct(payload);
        showToast('New product added to collection!');
      }
      closeModal();
      await refreshAdminData();
    } catch (err) {
      console.error('Error saving product:', err);
      showToast('Error saving product. Please check console.', 'error');
    }
  });

  // Filter events
  const searchInput = document.getElementById('adminProductSearch');
  const catFilter = document.getElementById('adminProductCatFilter');
  if (searchInput) searchInput.addEventListener('input', renderAdminProductsTable);
  if (catFilter) catFilter.addEventListener('change', renderAdminProductsTable);

  // Delete modal
  initDeleteProductModal();
}

function openEditProductModal(id) {
  const product = allProducts.find(p => p.id === id);
  if (!product) return;

  const modal = document.getElementById('productModal');
  const title = document.getElementById('productModalTitle');
  if (!modal) return;

  populateCategoryDropdowns();

  document.getElementById('formProductId').value = product.id;
  document.getElementById('formProductTitle').value = product.title || '';
  document.getElementById('formProductCategory').value = product.category || (allCategories[0] ? allCategories[0].name : '');
  document.getElementById('formProductMerchant').value = product.merchant || '';
  document.getElementById('formProductDesc').value = product.description || '';
  document.getElementById('formProductPrice').value = product.price || '';
  document.getElementById('formProductOffer').value = product.offer || '';
  document.getElementById('formProductRating').value = product.rating || 4.5;
  document.getElementById('formProductFeatured').checked = Boolean(product.featured);
  document.getElementById('formProductAffiliateUrl').value = product.affiliateUrl || '';
  document.getElementById('formProductImage1').value = product.image1 || '';
  document.getElementById('formProductImage2').value = product.image2 || '';
  document.getElementById('formProductImage3').value = product.image3 || '';
  document.getElementById('formProductImage4').value = product.image4 || '';

  if (title) title.textContent = 'Edit Fashion Piece';
  modal.classList.add('open');
}

function initDeleteProductModal() {
  const modal = document.getElementById('deleteProductModal');
  const targetLabel = document.getElementById('deleteProductTitleTarget');
  const cancelBtn = document.getElementById('cancelDeleteProductBtn');
  const closeBtn = document.getElementById('closeDeleteProductModalBtn');
  const confirmBtn = document.getElementById('confirmDeleteProductBtn');

  if (!modal || !confirmBtn) return;

  function closeModal() {
    modal.classList.remove('open');
    productPendingDeleteId = null;
  }

  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  confirmBtn.addEventListener('click', async () => {
    if (!productPendingDeleteId) return;
    try {
      await deleteProduct(productPendingDeleteId);
      showToast('Product deleted from catalog.');
      closeModal();
      await refreshAdminData();
    } catch (err) {
      console.error('Delete product error:', err);
      showToast('Could not delete product.', 'error');
    }
  });
}

function openDeleteProductModal(id, title) {
  const modal = document.getElementById('deleteProductModal');
  const targetLabel = document.getElementById('deleteProductTitleTarget');
  if (!modal) return;

  productPendingDeleteId = id;
  if (targetLabel) targetLabel.textContent = `"${title}"`;
  modal.classList.add('open');
}

/* ============================================================
   CATEGORY MANAGEMENT
   ============================================================ */
function renderAdminCategoriesTable() {
  const tbody = document.getElementById('adminCategoriesTableBody');
  if (!tbody) return;

  if (allCategories.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">No categories configured.</td></tr>';
    return;
  }

  tbody.innerHTML = allCategories.map(cat => {
    const count = allProducts.filter(p => p.category && p.category.toLowerCase() === cat.name.toLowerCase()).length;
    return `
      <tr>
        <td><strong>${escapeHtml(cat.name)}</strong></td>
        <td><code>${escapeHtml(cat.slug || cat.name.toLowerCase())}</code></td>
        <td>${count} product(s)</td>
        <td>
          <div class="table-actions">
            <button class="btn-action-edit edit-category-btn" data-id="${escapeHtml(cat.id)}">Rename</button>
            <button class="btn-action-delete delete-category-btn" data-id="${escapeHtml(cat.id)}" data-name="${escapeHtml(cat.name)}" data-count="${count}">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Attach event handlers
  tbody.querySelectorAll('.edit-category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      openEditCategoryModal(id);
    });
  });

  tbody.querySelectorAll('.delete-category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const name = btn.getAttribute('data-name');
      const count = Number(btn.getAttribute('data-count')) || 0;
      openDeleteCategoryModal(id, name, count);
    });
  });
}

function initCategoryActions() {
  // Add Category Form
  const addForm = document.getElementById('addCategoryForm');
  if (addForm) {
    addForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('newCatName').value.trim();
      const slug = document.getElementById('newCatSlug').value.trim();
      const description = document.getElementById('newCatDesc').value.trim();

      if (!name) {
        alert('Category name is required.');
        return;
      }

      try {
        await addCategory({ name, slug, description });
        addForm.reset();
        showToast(`Category "${name}" added!`);
        await refreshAdminData();
      } catch (err) {
        console.error('Error adding category:', err);
        showToast('Error adding category.', 'error');
      }
    });
  }

  // Edit Category Modal & Form
  const editModal = document.getElementById('editCategoryModal');
  const editForm = document.getElementById('editCategoryForm');
  const cancelEditBtn = document.getElementById('cancelEditCategoryBtn');
  const closeEditBtn = document.getElementById('closeEditCategoryModalBtn');

  if (editModal && editForm) {
    function closeEdit() {
      editModal.classList.remove('open');
    }
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', closeEdit);
    if (closeEditBtn) closeEditBtn.addEventListener('click', closeEdit);

    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('editCatId').value;
      const name = document.getElementById('editCatName').value.trim();
      const slug = document.getElementById('editCatSlug').value.trim();
      const description = document.getElementById('editCatDesc').value.trim();

      if (!name) {
        alert('Category name is required.');
        return;
      }

      try {
        await updateCategory(id, { name, slug, description });
        closeEdit();
        showToast('Category updated successfully!');
        await refreshAdminData();
      } catch (err) {
        console.error('Error updating category:', err);
        showToast('Error updating category.', 'error');
      }
    });
  }

  // Delete Category Modal
  initDeleteCategoryModal();
}

function openEditCategoryModal(id) {
  const cat = allCategories.find(c => c.id === id);
  if (!cat) return;

  const modal = document.getElementById('editCategoryModal');
  if (!modal) return;

  document.getElementById('editCatId').value = cat.id;
  document.getElementById('editCatName').value = cat.name;
  document.getElementById('editCatSlug').value = cat.slug || cat.name.toLowerCase();
  document.getElementById('editCatDesc').value = cat.description || '';

  modal.classList.add('open');
}

function initDeleteCategoryModal() {
  const modal = document.getElementById('deleteCategoryModal');
  const closeBtn = document.getElementById('closeDeleteCategoryModalBtn');
  const cancelBtn = document.getElementById('cancelDeleteCategoryBtn');
  const confirmBtn = document.getElementById('confirmDeleteCategoryBtn');

  if (!modal || !confirmBtn) return;

  function closeModal() {
    modal.classList.remove('open');
    categoryPendingDeleteId = null;
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

  confirmBtn.addEventListener('click', async () => {
    if (!categoryPendingDeleteId) return;
    try {
      await deleteCategory(categoryPendingDeleteId);
      showToast('Category deleted successfully.');
      closeModal();
      await refreshAdminData();
    } catch (err) {
      console.error('Delete category error:', err);
      showToast('Could not delete category.', 'error');
    }
  });
}

function openDeleteCategoryModal(id, name, count) {
  const modal = document.getElementById('deleteCategoryModal');
  const notice = document.getElementById('deleteCategoryWarningNotice');
  if (!modal || !notice) return;

  categoryPendingDeleteId = id;

  if (count > 0) {
    // Specific warning requirement from brief:
    // "This category contains X products. Are you sure you want to delete it?"
    notice.innerHTML = `
      <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 12px; border-radius: 4px; margin-bottom: 12px; color: var(--color-danger);">
        <strong>Warning:</strong> This category contains <strong>${count}</strong> product(s).
      </div>
      <p>Deleting "<strong>${escapeHtml(name)}</strong>" will remove this category classification. Are you sure you want to proceed?</p>
    `;
  } else {
    notice.innerHTML = `<p>Are you sure you want to delete category "<strong>${escapeHtml(name)}</strong>"?</p>`;
  }

  modal.classList.add('open');
}

/* ============================================================
   ADMIN SETTINGS & CREDENTIALS MANAGEMENT
   ============================================================ */
function initSettingsForm() {
  const form = document.getElementById('adminCredentialsForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newUsername = document.getElementById('settingsNewUsername').value.trim();
    const newPassword = document.getElementById('settingsNewPassword').value;
    const confirmPassword = document.getElementById('settingsConfirmPassword').value;

    if (newUsername.length < 3) {
      alert('Username must be at least 3 characters.');
      return;
    }
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match. Please re-enter.');
      return;
    }

    try {
      await updateAdminCredentials(newUsername, newPassword);
      form.reset();
      showToast('Admin credentials changed successfully! Keep your new password safe.');
      const greeting = document.getElementById('adminUserGreeting');
      if (greeting) greeting.textContent = `Logged in as ${newUsername}`;
    } catch (err) {
      console.error('Failed updating credentials:', err);
      alert(err.message || 'Could not update credentials.');
    }
  });
}

/* ============================================================
   FIREBASE SEED & DEMO RESET HELPER
   ============================================================ */
function initSeedHelper() {
  const seedBtn = document.getElementById('seedFirestoreBtn');
  const resetBtn = document.getElementById('resetLocalStoreBtn');

  if (seedBtn) {
    seedBtn.addEventListener('click', async () => {
      if (!isFirebaseConfigured()) {
        alert('Please first configure your Firebase credentials in firebase.js to seed your live database.');
        return;
      }
      if (confirm('Seed the starter luxury fashion catalog (categories and products) into your live Firestore?')) {
        seedBtn.disabled = true;
        seedBtn.textContent = 'Seeding Firestore...';
        try {
          await seedLiveFirestore();
          showToast('Live Firestore populated with starter fashion collection!');
          await refreshAdminData();
        } catch (err) {
          console.error('Seeding error:', err);
          showToast('Error seeding Firestore: ' + err.message, 'error');
        } finally {
          seedBtn.disabled = false;
          seedBtn.textContent = '✦ Seed Starter Fashion Catalogue to Firestore';
        }
      }
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      if (confirm('Reset your sample local catalog back to the original default fashion items?')) {
        localStorage.setItem('mushora_categories_v1', JSON.stringify(INITIAL_CATEGORIES));
        localStorage.setItem('mushora_products_v1', JSON.stringify(INITIAL_PRODUCTS));
        showToast('Sample collection reset to factory defaults.');
        await refreshAdminData();
      }
    });
  }
}

/* ============================================================
   UTILITIES
   ============================================================ */
function mainImageIsValid(url) {
  return typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'));
}

function affiliateUrlIsValid(url) {
  return typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'));
}

function showToast(message, type = 'success') {
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

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
