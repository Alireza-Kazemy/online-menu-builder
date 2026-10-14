/* ==========================================================================
   Café Arghavan - Dedicated Admin Panel Logic
   Password Protected: mohamadcr72026
   Full CRUD for Items and Categories
   ========================================================================== */

(function () {
  'use strict';

  const ADMIN_PASS = 'mohamadcr72026';
  const AUTH_KEY = 'arghavan_admin_authenticated';

  let state = {
    data: null,
    editingItemId: null,
    editingCatId: null,
    selectedCatFilter: 'all',
    draggedCatId: null,
    draggedItemId: null,
    isSaving: false
  };

  function updateServerBadge(status, text) {
    const badge = document.getElementById('serverStatusBadge');
    if (!badge) return;
    if (status === 'saving') {
      badge.style.background = 'rgba(243, 156, 18, 0.2)';
      badge.style.borderColor = 'rgba(243, 156, 18, 0.6)';
      badge.style.color = '#f39c12';
      badge.textContent = '⏳ در حال ثبت در سرور...';
    } else if (status === 'error') {
      badge.style.background = 'rgba(231, 76, 60, 0.2)';
      badge.style.borderColor = 'rgba(231, 76, 60, 0.6)';
      badge.style.color = '#e74c3c';
      badge.textContent = text || '✕ خطا در ارتباط با سرور';
    } else {
      badge.style.background = 'rgba(39, 174, 96, 0.2)';
      badge.style.borderColor = 'rgba(39, 174, 96, 0.5)';
      badge.style.color = '#2ecc71';
      badge.textContent = text || '● متصل به سرور (همگام)';
    }
  }

  async function loadData() {
    try {
      updateServerBadge('saving');
      const res = await fetch('api.php?t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json && json.categories && json.items) {
          state.data = json;
          updateServerBadge('success');
          return;
        }
      }
    } catch (e) {
      console.warn("api.php failed, checking menu_data.json...", e);
      try {
        const fallbackRes = await fetch('menu_data.json?t=' + Date.now());
        if (fallbackRes.ok) {
          state.data = await fallbackRes.json();
          updateServerBadge('success');
          return;
        }
      } catch (err) {
        console.error("Local file fallback error:", err);
      }
    }
    
    // Fallback if network totally down
    state.data = {
      cafeInfo: { nameFa: "کافه ارغوان", nameEn: "Café Arghavan" },
      categories: [],
      items: []
    };
    updateServerBadge('error', 'عدم دسترسی به پایگاه‌داده');
  }

  async function saveData() {
    if (state.isSaving) return false;
    state.isSaving = true;
    updateServerBadge('saving');

    try {
      const response = await fetch('api.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Password': ADMIN_PASS
        },
        body: JSON.stringify({
          adminPassword: ADMIN_PASS,
          menuData: state.data
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        updateServerBadge('success', '● ذخیره شد در سرور (' + new Date().toLocaleTimeString('fa-IR') + ')');
        showToast(result.message || "تغییرات با موفقیت در سرور ذخیره شد ✨");
        return true;
      } else {
        throw new Error(result.message || 'خطا در ذخیره‌سازی سرور');
      }
    } catch (err) {
      console.error("Server Save Error:", err);
      updateServerBadge('error', '✕ خطا در ذخیره سرور');
      showToast("خطا در ذخیره در سرور: " + (err.message || "لطفاً مجدد تلاش کنید"));
      return false;
    } finally {
      state.isSaving = false;
    }
  }

  function showToast(message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>✨</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  // Authentication Gate Check
  async function checkAuth() {
    const isAuth = sessionStorage.getItem(AUTH_KEY) === 'true';
    const authGate = document.getElementById('authGate');
    const adminDashboard = document.getElementById('adminDashboard');

    if (isAuth) {
      if (authGate) authGate.style.display = 'none';
      if (adminDashboard) adminDashboard.style.display = 'block';
      await loadData();
      populateCategorySelect();
      renderAdminItemsList();
      renderAdminCategoriesList();
    } else {
      if (authGate) authGate.style.display = 'flex';
      if (adminDashboard) adminDashboard.style.display = 'none';
    }
  }

  function handleLogin(e) {
    e.preventDefault();
    const passInput = document.getElementById('authPassword');
    const errorEl = document.getElementById('authError');

    if (passInput.value.trim() === ADMIN_PASS) {
      sessionStorage.setItem(AUTH_KEY, 'true');
      if (errorEl) errorEl.style.display = 'none';
      passInput.value = '';
      checkAuth();
      showToast("ورود موفقیت‌آمیز بود");
    } else {
      if (errorEl) errorEl.style.display = 'block';
      passInput.select();
    }
  }

  function handleLogout() {
    sessionStorage.removeItem(AUTH_KEY);
    checkAuth();
  }

  function switchTab(tab) {
    const viewManage = document.getElementById('viewManage');
    const viewCategories = document.getElementById('viewCategories');
    const viewForm = document.getElementById('viewForm');

    const tabManageBtn = document.getElementById('tabManageBtn');
    const tabCategoriesBtn = document.getElementById('tabCategoriesBtn');
    const tabAddBtn = document.getElementById('tabAddBtn');

    // Reset visibility
    viewManage.style.display = 'none';
    viewCategories.style.display = 'none';
    viewForm.style.display = 'none';

    tabManageBtn.classList.remove('active');
    tabCategoriesBtn.classList.remove('active');
    tabAddBtn.classList.remove('active');

    if (tab === 'manage') {
      viewManage.style.display = 'block';
      tabManageBtn.classList.add('active');
      state.editingItemId = null;
      renderAdminItemsList();
    } else if (tab === 'categories') {
      viewCategories.style.display = 'block';
      tabCategoriesBtn.classList.add('active');
      renderAdminCategoriesList();
    } else if (tab === 'form') {
      viewForm.style.display = 'block';
      tabAddBtn.classList.add('active');
      populateCategorySelect();
    }
  }

  function populateCategorySelect() {
    const select = document.getElementById('inputCategory');
    const filterSelect = document.getElementById('adminCatFilterSelect');

    if (select) {
      select.innerHTML = '';
      state.data.categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = `${cat.icon} ${cat.nameFa}`;
        select.appendChild(opt);
      });
    }

    if (filterSelect) {
      const currentFilter = state.selectedCatFilter || 'all';
      filterSelect.innerHTML = '<option value="all">نمایش همه دسته‌ها (کل منو)</option>';
      state.data.categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = `${cat.icon} ${cat.nameFa}`;
        if (cat.id === currentFilter) opt.selected = true;
        filterSelect.appendChild(opt);
      });
    }
  }

  function formatPrice(num) {
    return Number(num).toLocaleString('fa-IR');
  }

  // ==========================================
  // Category Reorder Helper
  // ==========================================
  function moveCategory(index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= state.data.categories.length) return;
    const cat = state.data.categories.splice(index, 1)[0];
    state.data.categories.splice(newIndex, 0, cat);
    saveData();
    renderAdminCategoriesList();
    populateCategorySelect();
    showToast(`ترتیب دسته‌بندی «${cat.nameFa}» با موفقیت تغییر یافت`);
  }

  function reorderCategoryById(draggedId, targetId) {
    if (!draggedId || !targetId || draggedId === targetId) return;
    const fromIdx = state.data.categories.findIndex(c => c.id === draggedId);
    const toIdx = state.data.categories.findIndex(c => c.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;

    const cat = state.data.categories.splice(fromIdx, 1)[0];
    state.data.categories.splice(toIdx, 0, cat);
    saveData();
    renderAdminCategoriesList();
    populateCategorySelect();
    showToast(`دسته‌بندی «${cat.nameFa}» به جایگاه جدید منتقل شد`);
  }

  // ==========================================
  // Category CRUD
  // ==========================================
  function renderAdminCategoriesList() {
    const container = document.getElementById('adminCategoriesList');
    const countEl = document.getElementById('categoriesCountText');
    if (!container) return;

    if (countEl) {
      countEl.textContent = `${formatPrice(state.data.categories.length)} دسته‌بندی`;
    }

    container.innerHTML = '';

    state.data.categories.forEach((cat, index) => {
      const card = document.createElement('div');
      card.className = 'admin-item-card';
      card.setAttribute('draggable', 'true');
      card.dataset.id = cat.id;

      const itemsInCat = state.data.items.filter(i => i.categoryId === cat.id).length;

      let catIconHtml = cat.icon || '✨';
      if (typeof catIconHtml === 'string' && (catIconHtml.trim().startsWith('<svg') || catIconHtml.trim().startsWith('http') || catIconHtml.trim().endsWith('.svg') || catIconHtml.trim().endsWith('.png'))) {
        if (catIconHtml.trim().startsWith('<svg')) {
          catIconHtml = catIconHtml;
        } else {
          catIconHtml = `<img src="${catIconHtml}" style="width:28px; height:28px; object-fit:contain;" alt="" />`;
        }
      }

      const isFirst = index === 0;
      const isLast = index === state.data.categories.length - 1;

      card.innerHTML = `
        <div class="admin-item-left">
          <div class="drag-handle" title="بکشید و رها کنید (Drag)">⠿</div>
          <div style="font-size: 1.8rem; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: rgba(148,19,32,0.3); border: 1px solid var(--gold-border); border-radius: var(--radius-sm);">
            ${catIconHtml}
          </div>
          <div class="admin-item-meta">
            <div class="admin-item-title">${cat.nameFa} <span style="font-size: 0.75rem; color: var(--gold-antique);">(${cat.nameEn || ''})</span></div>
            <div class="admin-item-sub" style="font-size: 0.78rem; color: var(--text-muted);">${formatPrice(itemsInCat)} آیتم در این دسته</div>
          </div>
        </div>
        <div class="admin-item-btns">
          <button class="btn-action-sm btn-order-move btn-move-up" title="انتقال به بالاتر" ${isFirst ? 'disabled' : ''}>▲</button>
          <button class="btn-action-sm btn-order-move btn-move-down" title="انتقال به پایین‌تر" ${isLast ? 'disabled' : ''}>▼</button>
          <button class="btn-action-sm btn-edit" title="ویرایش دسته" data-id="${cat.id}">✏️</button>
          <button class="btn-action-sm btn-delete" title="حذف دسته" data-id="${cat.id}">🗑️</button>
        </div>
      `;

      // Up / Down click handlers
      const upBtn = card.querySelector('.btn-move-up');
      const downBtn = card.querySelector('.btn-move-down');
      if (upBtn) upBtn.addEventListener('click', () => moveCategory(index, -1));
      if (downBtn) downBtn.addEventListener('click', () => moveCategory(index, 1));

      // Edit & Delete
      card.querySelector('.btn-edit').addEventListener('click', () => editCategory(cat.id));
      card.querySelector('.btn-delete').addEventListener('click', () => deleteCategory(cat.id));

      // Drag and drop events
      card.addEventListener('dragstart', (e) => {
        state.draggedCatId = cat.id;
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', cat.id);
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        document.querySelectorAll('#adminCategoriesList .admin-item-card').forEach(c => c.classList.remove('drag-over'));
      });

      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (state.draggedCatId && state.draggedCatId !== cat.id) {
          card.classList.add('drag-over');
        }
      });

      card.addEventListener('dragleave', () => {
        card.classList.remove('drag-over');
      });

      card.addEventListener('drop', (e) => {
        e.preventDefault();
        card.classList.remove('drag-over');
        if (state.draggedCatId && state.draggedCatId !== cat.id) {
          reorderCategoryById(state.draggedCatId, cat.id);
        }
        state.draggedCatId = null;
      });

      container.appendChild(card);
    });
  }

  function editCategory(catId) {
    const cat = state.data.categories.find(c => c.id === catId);
    if (!cat) return;

    state.editingCatId = catId;
    document.getElementById('catFormTitle').textContent = `ویرایش دسته‌بندی: ${cat.nameFa}`;
    document.getElementById('submitCatBtn').textContent = "ذخیره تغییرات دسته";

    document.getElementById('inputCatNameFa').value = cat.nameFa || '';
    document.getElementById('inputCatNameEn').value = cat.nameEn || '';
    document.getElementById('inputCatIcon').value = cat.icon || '✨';

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function deleteCategory(catId) {
    if (state.data.categories.length <= 1) {
      alert("حداقل یک دسته‌بندی باید در منو وجود داشته باشد.");
      return;
    }

    const itemsCount = state.data.items.filter(i => i.categoryId === catId).length;
    const msg = itemsCount > 0
      ? `این دسته‌بندی شامل ${itemsCount} محصول است! در صورت حذف دسته، محصولات آن به دسته اول منتقل خواهند شد. آیا مطمئنید؟`
      : "آیا از حذف این دسته‌بندی اطمینان دارید؟";

    if (confirm(msg)) {
      // Find fallback category
      const remainingCats = state.data.categories.filter(c => c.id !== catId);
      const fallbackId = remainingCats[0].id;

      // Reassign items
      state.data.items.forEach(i => {
        if (i.categoryId === catId) {
          i.categoryId = fallbackId;
        }
      });

      state.data.categories = remainingCats;
      saveData();
      renderAdminCategoriesList();
      populateCategorySelect();
      showToast("دسته‌بندی با موفقیت حذف شد");
    }
  }

  function handleSaveCategory(e) {
    e.preventDefault();

    const nameFa = document.getElementById('inputCatNameFa').value.trim();
    const nameEn = document.getElementById('inputCatNameEn').value.trim();
    const icon = document.getElementById('inputCatIcon').value.trim() || '✨';

    if (!nameFa) {
      alert("لطفاً نام فارسی دسته را وارد کنید.");
      return;
    }

    if (state.editingCatId) {
      const idx = state.data.categories.findIndex(c => c.id === state.editingCatId);
      if (idx !== -1) {
        state.data.categories[idx] = {
          ...state.data.categories[idx],
          nameFa,
          nameEn: nameEn || nameFa,
          icon
        };
      }
      state.editingCatId = null;
      showToast("دسته‌بندی با موفقیت ویرایش شد");
    } else {
      const newCat = {
        id: 'cat_' + Date.now(),
        nameFa,
        nameEn: nameEn || nameFa,
        icon
      };
      state.data.categories.push(newCat);
      showToast("دسته‌بندی جدید با موفقیت اضافه شد");
    }

    saveData();
    document.getElementById('categoryForm').reset();
    document.getElementById('inputCatIcon').value = '✨';
    document.getElementById('catFormTitle').textContent = "افزودن دسته‌بندی جدید";
    document.getElementById('submitCatBtn').textContent = "ثبت دسته‌بندی";
    renderAdminCategoriesList();
    populateCategorySelect();
  }

  // ==========================================
  // Item Reorder Helpers
  // ==========================================
  function moveItem(itemId, direction) {
    const filterCat = state.selectedCatFilter || 'all';
    // If filtered by category, we reorder within that category
    if (filterCat !== 'all') {
      const catItems = state.data.items.filter(i => i.categoryId === filterCat);
      const curIndex = catItems.findIndex(i => i.id === itemId);
      const targetIndex = curIndex + direction;
      if (targetIndex < 0 || targetIndex >= catItems.length) return;

      const targetItem = catItems[targetIndex];
      // Swap positions in main items array
      const mainCurIdx = state.data.items.findIndex(i => i.id === itemId);
      const mainTargetIdx = state.data.items.findIndex(i => i.id === targetItem.id);

      const [item] = state.data.items.splice(mainCurIdx, 1);
      state.data.items.splice(mainTargetIdx, 0, item);
    } else {
      const curIndex = state.data.items.findIndex(i => i.id === itemId);
      const targetIndex = curIndex + direction;
      if (targetIndex < 0 || targetIndex >= state.data.items.length) return;

      const [item] = state.data.items.splice(curIndex, 1);
      state.data.items.splice(targetIndex, 0, item);
    }

    saveData();
    renderAdminItemsList();
    showToast("ترتیب محصول با موفقیت تغییر کرد");
  }

  function reorderItemById(draggedId, targetId) {
    if (!draggedId || !targetId || draggedId === targetId) return;
    const fromIdx = state.data.items.findIndex(i => i.id === draggedId);
    const toIdx = state.data.items.findIndex(i => i.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;

    const [item] = state.data.items.splice(fromIdx, 1);
    state.data.items.splice(toIdx, 0, item);

    saveData();
    renderAdminItemsList();
    showToast(`محصول «${item.nameFa}» به جایگاه جدید منتقل شد`);
  }

  // ==========================================
  // Item CRUD
  // ==========================================
  function renderAdminItemsList() {
    const container = document.getElementById('adminItemsList');
    const countEl = document.getElementById('adminItemsCountText');
    if (!container) return;

    const filterCat = state.selectedCatFilter || 'all';
    let visibleItems = state.data.items;
    if (filterCat !== 'all') {
      visibleItems = visibleItems.filter(i => i.categoryId === filterCat);
    }

    if (countEl) {
      if (filterCat === 'all') {
        countEl.textContent = `تعداد کل آیتم‌ها: ${formatPrice(state.data.items.length)} عدد`;
      } else {
        const catObj = state.data.categories.find(c => c.id === filterCat);
        const catName = catObj ? catObj.nameFa : '';
        countEl.textContent = `دسته «${catName}»: ${formatPrice(visibleItems.length)} آیتم از کل ${formatPrice(state.data.items.length)}`;
      }
    }

    container.innerHTML = '';

    if (visibleItems.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 30px; color: var(--text-muted); font-size: 0.9rem;">
          هیچ آیتمی در این دسته‌بندی یافت نشد.
        </div>
      `;
      return;
    }

    visibleItems.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'admin-item-card';
      card.setAttribute('draggable', 'true');
      card.dataset.id = item.id;

      const catObj = state.data.categories.find(c => c.id === item.categoryId);
      const catName = catObj ? `${catObj.icon} ${catObj.nameFa}` : 'نامشخص';

      const isFirst = index === 0;
      const isLast = index === visibleItems.length - 1;

      card.innerHTML = `
        <div class="admin-item-left">
          <div class="drag-handle" title="بکشید و رها کنید (Drag)">⠿</div>
          <img src="${item.image || 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=150&q=80'}" alt="${item.nameFa}" class="admin-thumb-preview" />
          <div class="admin-item-meta">
            <div class="admin-item-title">${item.nameFa} <span style="font-size: 0.72rem; color: var(--gold-antique); font-weight: normal;">(${catName})</span></div>
            <div class="admin-item-sub" style="font-size: 0.78rem; color: var(--text-muted);">${item.ingredientsFa || ''}</div>
            <div class="admin-item-price" style="color: var(--gold-light); font-weight: 700;">${formatPrice(item.price)} تومان</div>
          </div>
        </div>
        <div class="admin-item-btns">
          <button class="btn-action-sm btn-order-move btn-move-up" title="انتقال به بالاتر" ${isFirst ? 'disabled' : ''}>▲</button>
          <button class="btn-action-sm btn-order-move btn-move-down" title="انتقال به پایین‌تر" ${isLast ? 'disabled' : ''}>▼</button>
          <button class="btn-action-sm btn-edit" title="ویرایش" data-id="${item.id}">✏️</button>
          <button class="btn-action-sm btn-delete" title="حذف" data-id="${item.id}">🗑️</button>
        </div>
      `;

      // Up / Down click handlers
      const upBtn = card.querySelector('.btn-move-up');
      const downBtn = card.querySelector('.btn-move-down');
      if (upBtn) upBtn.addEventListener('click', () => moveItem(item.id, -1));
      if (downBtn) downBtn.addEventListener('click', () => moveItem(item.id, 1));

      // Edit & Delete
      card.querySelector('.btn-edit').addEventListener('click', () => editItem(item.id));
      card.querySelector('.btn-delete').addEventListener('click', () => deleteItem(item.id));

      // Drag and drop events
      card.addEventListener('dragstart', (e) => {
        state.draggedItemId = item.id;
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item.id);
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        document.querySelectorAll('#adminItemsList .admin-item-card').forEach(c => c.classList.remove('drag-over'));
      });

      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (state.draggedItemId && state.draggedItemId !== item.id) {
          card.classList.add('drag-over');
        }
      });

      card.addEventListener('dragleave', () => {
        card.classList.remove('drag-over');
      });

      card.addEventListener('drop', (e) => {
        e.preventDefault();
        card.classList.remove('drag-over');
        if (state.draggedItemId && state.draggedItemId !== item.id) {
          reorderItemById(state.draggedItemId, item.id);
        }
        state.draggedItemId = null;
      });

      container.appendChild(card);
    });
  }

  function editItem(itemId) {
    const item = state.data.items.find(i => i.id === itemId);
    if (!item) return;

    state.editingItemId = itemId;
    populateCategorySelect();

    document.getElementById('formHeading').textContent = `ویرایش آیتم: ${item.nameFa}`;
    document.getElementById('submitFormBtn').textContent = "ذخیره تغییرات آیتم";

    document.getElementById('inputNameFa').value = item.nameFa || '';
    document.getElementById('inputNameEn').value = item.nameEn || '';
    document.getElementById('inputPrice').value = item.price || '';
    document.getElementById('inputCategory').value = item.categoryId || '';
    document.getElementById('inputIngFa').value = item.ingredientsFa || '';
    document.getElementById('inputIngEn').value = item.ingredientsEn || '';
    document.getElementById('inputBadgeFa').value = item.badgeFa || '';
    document.getElementById('inputBadgeEn').value = item.badgeEn || '';
    document.getElementById('inputImageUrl').value = item.image || '';

    const preview = document.getElementById('imagePickerPreview');
    const zone = document.getElementById('imagePickerZone');
    const removeBtn = document.getElementById('removeImageBtn');
    const hint = document.getElementById('imagePickerHint');

    if (item.image) {
      preview.src = item.image;
      zone.classList.add('has-image');
      if (removeBtn) removeBtn.style.display = 'inline-block';
      if (hint) hint.textContent = "📸 کلیک کنید برای تغییر عکس محصول (یا از دکمه حذف استفاده نمایید)";
    } else {
      preview.src = '';
      zone.classList.remove('has-image');
      if (removeBtn) removeBtn.style.display = 'none';
      if (hint) hint.textContent = "📸 کلیک کنید برای انتخاب و آپلود عکس (JPG, PNG, WEBP, AVIF تا ۵ مگابایت)";
    }

    switchTab('form');
  }

  function deleteItem(itemId) {
    if (confirm("آیا از حذف این آیتم اطمینان دارید؟ این تغییر روی منوی اصلی نیز بلافاصله اعمال می‌شود.")) {
      state.data.items = state.data.items.filter(i => i.id !== itemId);
      saveData();
      renderAdminItemsList();
      showToast("آیتم با موفقیت حذف شد");
    }
  }

  async function handleSaveItem(e) {
    e.preventDefault();

    const nameFa = document.getElementById('inputNameFa').value.trim();
    const nameEn = document.getElementById('inputNameEn').value.trim();
    const price = Number(document.getElementById('inputPrice').value) || 0;
    const categoryId = document.getElementById('inputCategory').value;
    const ingredientsFa = document.getElementById('inputIngFa').value.trim();
    const ingredientsEn = document.getElementById('inputIngEn').value.trim();
    const badgeFa = document.getElementById('inputBadgeFa').value.trim();
    const badgeEn = document.getElementById('inputBadgeEn').value.trim();
    const image = document.getElementById('inputImageUrl').value.trim() || 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=400&q=80';

    if (!nameFa || !price) {
      alert("لطفاً نام فارسی و قیمت را وارد کنید.");
      return;
    }

    if (state.editingItemId) {
      const idx = state.data.items.findIndex(i => i.id === state.editingItemId);
      if (idx !== -1) {
        state.data.items[idx] = {
          ...state.data.items[idx],
          nameFa,
          nameEn: nameEn || nameFa,
          price,
          categoryId,
          ingredientsFa,
          ingredientsEn,
          badgeFa,
          badgeEn,
          image
        };
      }
    } else {
      const newItem = {
        id: 'item-' + Date.now(),
        nameFa,
        nameEn: nameEn || nameFa,
        price,
        categoryId,
        ingredientsFa,
        ingredientsEn,
        badgeFa,
        badgeEn,
        image
      };
      state.data.items.unshift(newItem);
    }

    renderAdminItemsList();
    const saved = await saveData();
    if (saved) {
      switchTab('manage');
      resetItemForm();
    }
  }

  function resetItemForm() {
    state.editingItemId = null;
    document.getElementById('adminItemForm').reset();
    const zone = document.getElementById('imagePickerZone');
    const preview = document.getElementById('imagePickerPreview');
    const removeBtn = document.getElementById('removeImageBtn');
    const hint = document.getElementById('imagePickerHint');
    const fileInput = document.getElementById('fileImageUpload');
    const spinner = document.getElementById('imageUploadSpinner');

    if (zone) zone.classList.remove('has-image');
    if (preview) preview.src = '';
    if (removeBtn) removeBtn.style.display = 'none';
    if (fileInput) fileInput.value = '';
    if (spinner) spinner.style.display = 'none';
    if (hint) {
      hint.style.display = 'block';
      hint.textContent = "📸 کلیک کنید برای انتخاب و آپلود عکس (JPG, PNG, WEBP, AVIF تا ۵ مگابایت)";
    }

    document.getElementById('formHeading').textContent = "افزودن آیتم جدید";
    document.getElementById('submitFormBtn').textContent = "ثبت و ذخیره در منو";
  }

  function setupImageUpload() {
    const fileInput = document.getElementById('fileImageUpload');
    const dropZone = document.getElementById('imagePickerZone');
    const urlInput = document.getElementById('inputImageUrl');
    const preview = document.getElementById('imagePickerPreview');
    const spinner = document.getElementById('imageUploadSpinner');
    const statusText = document.getElementById('imageUploadStatusText');
    const hint = document.getElementById('imagePickerHint');
    const removeBtn = document.getElementById('removeImageBtn');

    if (!fileInput || !dropZone) return;

    // Click to open file dialog
    dropZone.addEventListener('click', (e) => {
      // Don't re-trigger if clicking remove button
      if (e.target.closest('#removeImageBtn')) return;
      fileInput.click();
    });

    // Remove image button
    if (removeBtn) {
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        urlInput.value = '';
        fileInput.value = '';
        preview.src = '';
        dropZone.classList.remove('has-image');
        removeBtn.style.display = 'none';
        if (hint) {
          hint.style.display = 'block';
          hint.textContent = "📸 کلیک کنید برای انتخاب و آپلود عکس (JPG, PNG, WEBP, AVIF تا ۵ مگابایت)";
        }
        showToast("تصویر آیتم حذف شد");
      });
    }

    // Process selected image file
    async function processAndUploadFile(file) {
      if (!file) return;

      // 1. Check file size (5MB Max)
      const MAX_BYTES = 5 * 1024 * 1024;
      if (file.size > MAX_BYTES) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
        showToast(`حجم فایل بیشتر از ۵ مگابایت است (${sizeMb} MB). لطفاً فایل کوچک‌تری انتخاب فرمایید.`, 'error');
        fileInput.value = '';
        return;
      }

      // 2. Check extension & MIME type
      const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'svg'];
      const fileExt = file.name.split('.').pop().toLowerCase();
      if (!file.type.startsWith('image/') && !allowedExts.includes(fileExt)) {
        showToast("فرمت فایل معتبر نیست. لطفاً تصویر با فرمت JPG, PNG, WEBP یا AVIF انتخاب نمایید.", 'error');
        fileInput.value = '';
        return;
      }

      // 3. UI uploading feedback
      if (spinner) spinner.style.display = 'flex';
      if (statusText) statusText.textContent = `در حال بارگذاری و بهینه‌سازی فایل (${(file.size / 1024).toFixed(0)} KB)...`;
      if (hint) hint.style.display = 'none';

      // Immediate local preview
      try {
        const objectUrl = URL.createObjectURL(file);
        preview.src = objectUrl;
        dropZone.classList.add('has-image');
      } catch (e) {}

      // 4. Send directly to server upload endpoint
      try {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('adminPassword', ADMIN_PASS);

        const response = await fetch('api.php?action=upload', {
          method: 'POST',
          headers: {
            'X-Admin-Password': ADMIN_PASS
          },
          body: formData
        });

        const result = await response.json();

        if (response.ok && result.success && result.url) {
          urlInput.value = result.url;
          preview.src = result.url;
          if (removeBtn) removeBtn.style.display = 'inline-block';
          if (hint) {
            hint.style.display = 'block';
            hint.textContent = "✓ تصویر در سرور ذخیره شد (کلیک برای تغییر)";
          }
          showToast("تصویر با موفقیت در سرور آپلود شد ✨");
        } else {
          throw new Error(result.message || 'خطا در بارگذاری روی سرور');
        }
      } catch (err) {
        console.error("Upload error:", err);
        showToast(err.message || "خطا در آپلود تصویر روی سرور", "error");
        if (hint) {
          hint.style.display = 'block';
          hint.textContent = "❌ خطا در آپلود! کلیک کنید تا مجدداً تلاش نمایید.";
        }
      } finally {
        if (spinner) spinner.style.display = 'none';
        fileInput.value = '';
      }
    }

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        processAndUploadFile(file);
      }
    });

    // Drag & Drop
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        processAndUploadFile(e.dataTransfer.files[0]);
      }
    });

    // Manual URL typing
    urlInput.addEventListener('input', () => {
      const val = urlInput.value.trim();
      if (val) {
        preview.src = val;
        dropZone.classList.add('has-image');
        if (removeBtn) removeBtn.style.display = 'inline-block';
      } else {
        dropZone.classList.remove('has-image');
        if (removeBtn) removeBtn.style.display = 'none';
      }
    });
  }

  function initEvents() {
    document.getElementById('authForm').addEventListener('submit', handleLogin);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Tab buttons
    document.getElementById('tabManageBtn').addEventListener('click', () => switchTab('manage'));
    document.getElementById('tabCategoriesBtn').addEventListener('click', () => switchTab('categories'));
    document.getElementById('tabAddBtn').addEventListener('click', () => {
      resetItemForm();
      switchTab('form');
    });

    // Forms
    document.getElementById('categoryForm').addEventListener('submit', handleSaveCategory);
    document.getElementById('adminItemForm').addEventListener('submit', handleSaveItem);
    document.getElementById('cancelFormBtn').addEventListener('click', () => switchTab('manage'));

    // Category Filter in Items View
    const filterSelect = document.getElementById('adminCatFilterSelect');
    if (filterSelect) {
      filterSelect.addEventListener('change', (e) => {
        state.selectedCatFilter = e.target.value;
        renderAdminItemsList();
      });
    }

    // Refresh Data directly from Database
    document.getElementById('resetDataBtn').addEventListener('click', async () => {
      updateServerBadge('saving', 'در حال همگام‌سازی با پایگاه‌داده...');
      await loadData();
      renderAdminItemsList();
      renderAdminCategoriesList();
      populateCategorySelect();
      showToast("اطلاعات منو مستقیماً از پایگاه‌داده همگام و به‌روزرسانی شد ✨");
    });

    setupImageUpload();
  }

  function init() {
    initEvents();
    checkAuth();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
