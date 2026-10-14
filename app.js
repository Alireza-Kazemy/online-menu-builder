/* ==========================================================================
   Café Arghavan - Client Menu Engine (Categorized, No Popup, Search & i18n)
   ========================================================================== */

(function () {
  'use strict';

  const STORAGE_KEY = 'arghavan_cafe_menu_v1';
  const LANG_KEY = 'arghavan_cafe_lang';

  // Global State
  let state = {
    currentLang: localStorage.getItem(LANG_KEY) || 'fa',
    searchQuery: '',
    data: null
  };

  const I18N = {
    fa: {
      searchPlaceholder: "جستجوی نوشیدنی، غذا، دسر...",
      emptyStateTitle: "موردی یافت نشد",
      emptyStateDesc: "هیچ آیتمی با عبارت جستجو شده در منو وجود ندارد.",
      switchLangHint: "تغییر زبان به انگلیسی",
      wifiLabel: "رمز وای‌فای کافه:",
      phoneLabel: "تلفن رزرو:",
      locationLabel: "لوکیشن و مسیریابی",
      footerNote: "کافه ارغوان؛ پیوند هنر فرش ایرانی و فرهنگ مدرن کافه‌نشینی",
      toman: "تومان",
      itemsSuffix: "آیتم"
    },
    en: {
      searchPlaceholder: "Search drinks, food, desserts...",
      emptyStateTitle: "No items found",
      emptyStateDesc: "No items match your search term in the menu.",
      switchLangHint: "Switch language to Persian",
      wifiLabel: "Guest Wi-Fi:",
      phoneLabel: "Reservation:",
      locationLabel: "Find Us / Location",
      footerNote: "Café Arghavan; Where Persian Rug artistry meets modern café culture",
      toman: "Tomans",
      itemsSuffix: "items"
    }
  };

  function formatPrice(num) {
    if (!num) return '۰';
    return Number(num).toLocaleString('fa-IR');
  }

  function formatPriceEn(num) {
    if (!num) return '0';
    return Number(num).toLocaleString('en-US');
  }

  async function fetchServerData() {
    try {
      // Direct fast request to api.php with cache-busting timestamp
      const response = await fetch('api.php?t=' + Date.now(), {
        cache: 'no-store'
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.categories && data.items) {
          state.data = data;
          return true;
        }
      }
    } catch (e) {
      console.warn("api.php not available, checking menu_data.json fallback...", e);
      try {
        const fallbackRes = await fetch('menu_data.json?t=' + Date.now());
        if (fallbackRes.ok) {
          state.data = await fallbackRes.json();
          return true;
        }
      } catch (err) {
        console.warn("menu_data.json not available:", err);
      }
    }
    return false;
  }

  function setLanguage(lang) {
    state.currentLang = lang;
    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.lang = lang;
    document.body.dir = lang === 'fa' ? 'rtl' : 'ltr';
    document.body.setAttribute('dir', lang === 'fa' ? 'rtl' : 'ltr');

    const langBtn = document.getElementById('langToggleBtn');
    if (langBtn) {
      langBtn.innerHTML = lang === 'fa' ? '<span>🌐</span> English' : '<span>🌐</span> فارسی';
      langBtn.title = I18N[lang].switchLangHint;
    }

    renderStaticTexts();
    renderCategoryNavigation();
    renderCategorizedMenu();
  }

  function renderStaticTexts() {
    const t = I18N[state.currentLang];
    const isFa = state.currentLang === 'fa';
    const cafe = state.data.cafeInfo;

    document.getElementById('brandTitle').textContent = isFa ? cafe.nameFa : cafe.nameEn;
    document.getElementById('brandSubtitle').textContent = isFa ? cafe.taglineFa : cafe.taglineEn;
    document.getElementById('heroTitle').textContent = isFa ? cafe.nameFa : cafe.nameEn;
    document.getElementById('heroDesc').textContent = isFa ? cafe.taglineFa : cafe.taglineEn;
    document.getElementById('searchInput').placeholder = t.searchPlaceholder;

    const heroInsta = document.getElementById('heroInstagramText');
    if (heroInsta) {
      heroInsta.textContent = `${isFa ? 'اینستاگرام:' : 'Instagram:'} ${cafe.instagram}`;
    }

    const footerLocation = document.getElementById('footerLocationText');
    if (footerLocation) {
      footerLocation.textContent = t.locationLabel;
    }

    const footerInsta = document.getElementById('footerInstagramText');
    if (footerInsta) {
      footerInsta.textContent = `Instagram: ${cafe.instagram}`;
    }

    const footerNote = document.getElementById('footerNote');
    if (footerNote) {
      footerNote.textContent = isFa ? cafe.taglineFa : cafe.taglineEn;
    }
  }

  // Render Horizontal Category Navigation Pills
  function renderCategoryNavigation() {
    const scrollEl = document.getElementById('categoriesScroll');
    if (!scrollEl) return;
    const isFa = state.currentLang === 'fa';

    scrollEl.innerHTML = '';
    state.data.categories.forEach((cat, index) => {
      const btn = document.createElement('button');
      btn.className = `cat-pill ${index === 0 ? 'active' : ''}`;
      btn.setAttribute('data-target', `category-sec-${cat.id}`);

      let iconHtml = cat.icon || '✨';
      if (typeof iconHtml === 'string' && (iconHtml.trim().startsWith('<svg') || iconHtml.trim().startsWith('http') || iconHtml.trim().endsWith('.svg') || iconHtml.trim().endsWith('.png'))) {
        if (iconHtml.trim().startsWith('<svg')) {
          iconHtml = iconHtml;
        } else {
          iconHtml = `<img src="${iconHtml}" alt="" />`;
        }
      }

      btn.innerHTML = `<span class="cat-icon">${iconHtml}</span><span>${isFa ? cat.nameFa : cat.nameEn}</span>`;
      
      btn.addEventListener('click', () => {
        document.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const targetSec = document.getElementById(`category-sec-${cat.id}`);
        if (targetSec) {
          state.isClickingScroll = true;
          const navOffset = 110;
          const elementPosition = targetSec.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - navOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });

          // Reset manual scroll lock after animation finishes
          clearTimeout(state.scrollTimeout);
          state.scrollTimeout = setTimeout(() => {
            state.isClickingScroll = false;
          }, 600);
        }
      });

      scrollEl.appendChild(btn);
    });

    setupScrollSpy();
  }

  // ScrollSpy for Category Navigation
  function setupScrollSpy() {
    if (state.observer) {
      state.observer.disconnect();
    }

    const sections = document.querySelectorAll('.category-group');
    if (!sections || sections.length === 0) return;

    state.observer = new IntersectionObserver((entries) => {
      if (state.isClickingScroll) return;

      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const secId = entry.target.id;
          const matchingPill = document.querySelector(`.cat-pill[data-target="${secId}"]`);
          if (matchingPill && !matchingPill.classList.contains('active')) {
            document.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
            matchingPill.classList.add('active');

            // Gently scroll horizontal nav to keep active pill visible in center
            matchingPill.scrollIntoView({
              behavior: 'smooth',
              inline: 'center',
              block: 'nearest'
            });
          }
        }
      });
    }, {
      rootMargin: '-20% 0px -65% 0px',
      threshold: 0
    });

    sections.forEach(sec => state.observer.observe(sec));
  }

  // Render Grouped Menu Items by Category (بدون پاپ‌آپ، اطلاعات کامل در همان کارت)
  function renderCategorizedMenu() {
    const container = document.getElementById('menuSectionsContainer');
    if (!container) return;

    const isFa = state.currentLang === 'fa';
    const t = I18N[state.currentLang];
    const q = state.searchQuery.toLowerCase().trim();

    container.innerHTML = '';

    let totalVisibleCount = 0;

    state.data.categories.forEach(cat => {
      // Filter items for this category
      let items = state.data.items.filter(item => item.categoryId === cat.id);

      // Search filter if typed
      if (q) {
        items = items.filter(item => {
          const nameFa = (item.nameFa || '').toLowerCase();
          const nameEn = (item.nameEn || '').toLowerCase();
          const ingFa = (item.ingredientsFa || '').toLowerCase();
          const ingEn = (item.ingredientsEn || '').toLowerCase();
          return nameFa.includes(q) || nameEn.includes(q) || ingFa.includes(q) || ingEn.includes(q);
        });
      }

      if (items.length === 0 && q) {
        return; // Skip category if search doesn't match
      }

      totalVisibleCount += items.length;

      // Create Category Section
      const sec = document.createElement('section');
      sec.className = 'category-group';
      sec.id = `category-sec-${cat.id}`;

      const catTitle = isFa ? cat.nameFa : cat.nameEn;
      const countFormatted = isFa ? formatPrice(items.length) : items.length;

      let catHeaderIconHtml = cat.icon || '✨';
      if (typeof catHeaderIconHtml === 'string' && (catHeaderIconHtml.trim().startsWith('<svg') || catHeaderIconHtml.trim().startsWith('http') || catHeaderIconHtml.trim().endsWith('.svg') || catHeaderIconHtml.trim().endsWith('.png'))) {
        if (catHeaderIconHtml.trim().startsWith('<svg')) {
          catHeaderIconHtml = catHeaderIconHtml;
        } else {
          catHeaderIconHtml = `<img src="${catHeaderIconHtml}" alt="" />`;
        }
      }

      sec.innerHTML = `
        <div class="category-header-banner">
          <div class="category-header-title">
            <span class="cat-header-icon">${catHeaderIconHtml}</span>
            <h2>${catTitle}</h2>
          </div>
          <span class="category-count-badge">${countFormatted} ${t.itemsSuffix}</span>
        </div>
        <div class="items-grid" id="grid-${cat.id}"></div>
      `;

      const grid = sec.querySelector(`#grid-${cat.id}`);

      items.forEach(item => {
        const card = document.createElement('article');
        card.className = 'menu-card static-view'; // No popup pointer cursor

        const title = isFa ? item.nameFa : item.nameEn;
        const subTitle = isFa ? item.nameEn : item.nameFa;
        const ingredients = isFa ? item.ingredientsFa : item.ingredientsEn;
        const badge = isFa ? item.badgeFa : item.badgeEn;
        const priceFormatted = isFa ? formatPrice(item.price) : formatPriceEn(item.price);

        card.innerHTML = `
          <div class="card-img-wrapper">
            <img src="${item.image || 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=400&q=80'}" 
                 alt="${title}" 
                 class="card-img" 
                 loading="lazy" 
                 onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=400&q=80';" />
            ${badge ? `<div class="card-badge">${badge}</div>` : ''}
          </div>
          <div class="card-content">
            <div class="card-title-row">
              <h3 class="card-title">${title}</h3>
              <div class="card-subtitle">${subTitle || ''}</div>
            </div>

            <!-- اطلاعات مهم و محتویات مستقیم داخل کارت بدون نیاز به پاپ‌آپ -->
            <p class="card-ingredients">
              <span class="ing-label">${isFa ? 'ترکیبات:' : 'Ingredients:'}</span>
              ${ingredients || ''}
            </p>

            <div class="card-footer">
              <div class="price-tag">
                <span class="price-number">${priceFormatted}</span>
                <span class="price-currency">${t.toman}</span>
              </div>
            </div>
          </div>
        `;

        grid.appendChild(card);
      });

      sec.classList.add('fade-in');
      container.appendChild(sec);
    });

    if (totalVisibleCount === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">☕</div>
          <div style="font-size: 1.15rem; font-weight: 700; color: var(--gold-light); margin-bottom: 6px;">${t.emptyStateTitle}</div>
          <p style="font-size: 0.85rem;">${t.emptyStateDesc}</p>
        </div>
      `;
    }

    // Connect scrollspy once DOM nodes exist
    setupScrollSpy();
  }

  function renderDatabaseErrorState() {
    const container = document.getElementById('menuSectionsContainer');
    if (!container) return;
    const isFa = state.currentLang === 'fa';
    container.innerHTML = `
      <div class="empty-state" style="padding: 40px 20px;">
        <div class="empty-state-icon" style="font-size: 2.2rem; margin-bottom: 12px;">⚠️</div>
        <div style="font-size: 1.15rem; font-weight: 700; color: var(--gold-light); margin-bottom: 8px;">
          ${isFa ? 'خطا در بارگذاری منوی کافه' : 'Error Loading Café Menu'}
        </div>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 18px; line-height: 1.6;">
          ${isFa ? 'امکان دریافت اطلاعات از پایگاه‌داده سرور وجود ندارد. لطفاً اتصال اینترنت را بررسی کنید.' : 'Unable to retrieve menu data from the database. Please check your connection.'}
        </p>
        <button class="btn-primary-action" id="retryFetchBtn" style="max-width: 220px; margin: 0 auto; padding: 10px 18px;">
          ${isFa ? '🔄 تلاش مجدد برای دریافت منو' : '🔄 Retry Loading Menu'}
        </button>
      </div>
    `;
    const btn = document.getElementById('retryFetchBtn');
    if (btn) {
      btn.addEventListener('click', () => {
        container.innerHTML = `
          <div class="skeleton-loading-wrapper">
            <div class="skeleton-banner">
              <span class="skeleton-banner-icon">☕</span>
              <span class="skeleton-banner-text">در حال برقراری ارتباط مجدد با پایگاه‌داده...</span>
            </div>
          </div>
        `;
        init();
      });
    }
  }

  function initEvents() {
    // Language Switch
    const langBtn = document.getElementById('langToggleBtn');
    if (langBtn) {
      langBtn.addEventListener('click', () => {
        setLanguage(state.currentLang === 'fa' ? 'en' : 'fa');
      });
    }

    // Search
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClearBtn');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        if (searchClear) searchClear.style.display = state.searchQuery ? 'block' : 'none';
        renderCategorizedMenu();
      });
    }

    if (searchClear) {
      searchClear.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        state.searchQuery = '';
        searchClear.style.display = 'none';
        renderCategorizedMenu();
      });
    }

    // Top Nav Scrolled Effect
    window.addEventListener('scroll', () => {
      const nav = document.getElementById('topNav');
      if (window.scrollY > 20) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    });
  }

  async function init() {
    initEvents();

    // Fetch ground-truth real data directly from database (NO mock flash)
    const loaded = await fetchServerData();
    if (loaded && state.data && state.data.categories) {
      setLanguage(state.currentLang);
    } else {
      renderDatabaseErrorState();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
