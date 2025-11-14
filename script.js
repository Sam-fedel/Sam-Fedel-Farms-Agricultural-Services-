// Smooth fade-in animation for sections + staggered children
const sections = document.querySelectorAll('section');

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');

            // Stagger reveal for children (cards, paragraphs, images)
            const staggerContainer = entry.target.querySelector('.service-cards, .stagger');
            if (staggerContainer) {
                const children = Array.from(staggerContainer.children);
                children.forEach((child, i) => {
                    setTimeout(() => child.classList.add('in'), i * 120);
                });
                // Mark container as in to allow CSS transitions for direct children
                setTimeout(() => staggerContainer.classList.add('in'), 50);
            }
        }
    });
}, { threshold: 0.18 });

sections.forEach(section => {
    section.classList.add('fade-section');
    observer.observe(section);
});

// Create floating orbs in hero animation to enliven the hero section
function createHeroOrbs(requestedCount) {
    const container = document.querySelector('.hero-animation');
    if (!container) return;

    // Respect user's reduced-motion preference
    const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduce) {
        container.innerHTML = '';
        container.style.opacity = '0.0';
        return;
    }

    // Clear existing orbs
    container.innerHTML = '';
    const colors = ['rgba(0,255,0,0.18)', 'rgba(255,255,0,0.12)', 'rgba(0,200,120,0.12)'];

    const width = window.innerWidth || document.documentElement.clientWidth;
    const defaultCount = width < 600 ? 4 : 7;
    const count = typeof requestedCount === 'number' ? requestedCount : defaultCount;

    for (let i = 0; i < count; i++) {
        const orb = document.createElement('span');
        orb.className = 'orb';
        // Smaller sizes on small screens
        const size = (width < 600) ? (40 + Math.round(Math.random() * 100)) : (80 + Math.round(Math.random() * 220));
        orb.style.width = `${size}px`;
        orb.style.height = `${size}px`;
        orb.style.left = `${Math.random() * 100}%`;
        orb.style.top = `${Math.random() * 100}%`;
        orb.style.background = colors[i % colors.length];
        const dur = 8 + Math.random() * 12;
        const delay = Math.random() * 5;
        orb.style.animation = `floaty ${dur}s ease-in-out ${delay}s infinite alternate`;
        orb.style.opacity = (0.06 + Math.random() * 0.20).toString();
        orb.style.maxWidth = '180px';
        orb.style.maxHeight = '180px';
        container.appendChild(orb);
    }
}

createHeroOrbs();

// Button ripple effect and keyboard activation
function addButtonRipples() {
    document.addEventListener('pointerdown', e => {
        const btn = e.target.closest('.btn');
        if (!btn) return;
        const rect = btn.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        const size = Math.max(rect.width, rect.height) * 1.2;
        ripple.style.width = ripple.style.height = `${size}px`;
        // Coordinates relative to button
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        btn.appendChild(ripple);
        // Remove after animation
        ripple.addEventListener('animationend', () => ripple.remove());
    }, { passive: true });

    // Keyboard activation (Enter / Space) for anchors with .btn
    document.addEventListener('keydown', e => {
        const active = document.activeElement;
        if (!active) return;
        if (!active.classList || !active.classList.contains('btn')) return;
        if (e.code === 'Space' || e.code === 'Enter') {
            e.preventDefault();
            // Create a centered ripple
            const rect = active.getBoundingClientRect();
            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            const size = Math.max(rect.width, rect.height) * 1.2;
            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${(rect.width - size) / 2}px`;
            ripple.style.top = `${(rect.height - size) / 2}px`;
            active.appendChild(ripple);
            ripple.addEventListener('animationend', () => ripple.remove());
            // Trigger the click behavior if any
            active.click();
        }
    });
}

addButtonRipples();

// Re-create orbs on resize for better placement
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        createHeroOrbs();
        updateGrass();
    }, 350);
});

// Adjust grass intensity & visibility based on viewport and reduced-motion preference
function updateGrass() {
    const wrap = document.querySelector('.grass-wrap');
    if (!wrap) return;

    const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduce) {
        wrap.style.display = 'none';
        return;
    }

    const width = window.innerWidth || document.documentElement.clientWidth;
    if (width < 520) {
        // Minimal foreground only on very small screens
        wrap.style.display = 'block';
        wrap.style.height = '120px';
        wrap.classList.add('minimal');
    } else {
        wrap.style.display = 'block';
        wrap.style.height = '';
        wrap.classList.remove('minimal');
    }
}

// kick things off
updateGrass();
// listen for reduced-motion changes (some browsers support addEventListener on MediaQueryList)
if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.addEventListener) mq.addEventListener('change', updateGrass);
    else if (mq.addListener) mq.addListener(updateGrass);
}

/* Inventory / local stock management */
const INVENTORY_KEY = 'sf_inventory_v1';

// Generate a stable-ish id for inventory items (timestamp + random)
function generateId(prefix = 'it') {
    return `${prefix}_${Date.now().toString(36)}_${Math.floor(Math.random() * 9000 + 1000).toString(36)}`;
}

const defaultInventory = [
    { id: generateId(), name: 'Yams', quantity: 24, min: 4, inStock: true },
    { id: generateId(), name: 'Peppers', quantity: 56, min: 8, inStock: true },
    { id: generateId(), name: 'Fish Fingerlings', quantity: 0, min: 30, inStock: false },
    { id: generateId(), name: 'Broiler Chicks', quantity: 0, min: 10, inStock: false },
    { id: generateId(), name: 'Snail Rearing (stock)', quantity: 0, min: 6, inStock: false }
];

function loadInventory() {
    try {
        const raw = localStorage.getItem(INVENTORY_KEY);
        if (!raw) return defaultInventory.slice();
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return defaultInventory.slice();

        // Migrate older items that may lack id/quantity fields
        const migrated = parsed.map(item => {
            const copy = Object.assign({}, item);
            if (!copy.id) copy.id = generateId();
            if (typeof copy.quantity !== 'number') copy.quantity = copy.inStock ? 1 : 0;
            if (typeof copy.inStock !== 'boolean') copy.inStock = Boolean(copy.quantity && copy.quantity > 0);
            if (typeof copy.min !== 'number') copy.min = 0;
            return copy;
        });
        return migrated;
    } catch (e) {
        console.warn('Failed to load inventory, using defaults', e);
        return defaultInventory.slice();
    }
}

function saveInventory(items) {
    try {
        localStorage.setItem(INVENTORY_KEY, JSON.stringify(items));
    } catch (e) {
        console.warn('Failed to save inventory', e);
    }
}

function findIndexById(items, id) {
    return items.findIndex(i => i.id === id);
}

function renderInventory() {
    const list = document.getElementById('stockList');
    if (!list) return;
    const allItems = loadInventory();

    // Sort: in-stock first, then by name
    allItems.sort((a, b) => {
        if (a.inStock === b.inStock) return a.name.localeCompare(b.name);
        return a.inStock ? -1 : 1;
    });

    list.innerHTML = '';
    if (allItems.length === 0) {
        const msg = document.createElement('li');
        msg.className = 'stock-item';
        msg.innerHTML = '<div class="meta"><h4>No inventory items</h4></div>';
        list.appendChild(msg);
        return;
    }

    allItems.forEach((it) => {
        const li = document.createElement('li');
        li.className = 'stock-item';

        const meta = document.createElement('div');
        meta.className = 'meta';
        const h = document.createElement('h4');
        h.textContent = it.name;
        meta.appendChild(h);

        // quantity display
        const qty = document.createElement('div');
        qty.className = 'muted';
        qty.textContent = `Qty: ${it.quantity}`;
        meta.appendChild(qty);

        const badge = document.createElement('span');
        badge.className = `badge ${it.inStock ? 'in' : 'out'}`;
        badge.textContent = it.inStock ? 'In Stock' : 'Out';
        meta.appendChild(badge);

        const controls = document.createElement('div');
        controls.className = 'controls';

        // toggle in/out
        const toggle = document.createElement('button');
        toggle.className = 'toggle-btn';
        toggle.setAttribute('aria-pressed', it.inStock ? 'true' : 'false');
        toggle.textContent = it.inStock ? 'Mark Out' : 'Mark In';
        toggle.addEventListener('click', () => {
            const itemsNow = loadInventory();
            const idx = findIndexById(itemsNow, it.id);
            if (idx === -1) return;
            itemsNow[idx].inStock = !itemsNow[idx].inStock;
            // Ensure quantity matches inStock state
            if (!itemsNow[idx].inStock) itemsNow[idx].quantity = 0;
            else if (itemsNow[idx].quantity <= 0) itemsNow[idx].quantity = 1;
            saveInventory(itemsNow);
            renderInventory();
        });
        toggle.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle.click(); } });

        // quantity controls
        const dec = document.createElement('button');
        dec.className = 'toggle-btn';
        dec.setAttribute('aria-label', `Decrease ${it.name} quantity`);
        dec.textContent = '-';
        dec.addEventListener('click', () => {
            const itemsNow = loadInventory();
            const idx = findIndexById(itemsNow, it.id);
            if (idx === -1) return;
            itemsNow[idx].quantity = Math.max(0, (itemsNow[idx].quantity || 0) - 1);
            if (itemsNow[idx].quantity === 0) itemsNow[idx].inStock = false;
            saveInventory(itemsNow);
            renderInventory();
        });

        const inc = document.createElement('button');
        inc.className = 'toggle-btn';
        inc.setAttribute('aria-label', `Increase ${it.name} quantity`);
        inc.textContent = '+';
        inc.addEventListener('click', () => {
            const itemsNow = loadInventory();
            const idx = findIndexById(itemsNow, it.id);
            if (idx === -1) return;
            itemsNow[idx].quantity = (itemsNow[idx].quantity || 0) + 1;
            if (itemsNow[idx].quantity > 0) itemsNow[idx].inStock = true;
            saveInventory(itemsNow);
            renderInventory();
        });

        controls.appendChild(dec);
        controls.appendChild(toggle);
        controls.appendChild(inc);

        li.appendChild(meta);
        li.appendChild(controls);
        list.appendChild(li);
    });
}

// Add item form handling (supports optional quantity field)
const stockForm = document.getElementById('stockForm');
if (stockForm) {
    stockForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('stockName');
        const qtyInput = document.getElementById('stockQty');
        if (!input) return;
        const name = input.value && input.value.trim();
        if (!name) return;
        const qty = qtyInput ? Math.max(0, parseInt(qtyInput.value || '0', 10)) : 0;
        const items = loadInventory();
        items.push({ id: generateId(), name, quantity: qty, min: 0, inStock: qty > 0 });
        saveInventory(items);
        if (input) input.value = '';
        if (qtyInput) qtyInput.value = '';
        renderInventory();
        input.focus();
    });
}

// Initialize inventory display on load
document.addEventListener('DOMContentLoaded', () => {
    renderInventory();
    // Apply gallery featured metadata when page loads
    applyGalleryMeta();

    // Initialize lozad lazy loader if available
    if (typeof lozad !== 'undefined') {
        try {
            window.lozadObserver = lozad('.lozad', {
                loaded: function(el) { el.classList.add('loaded'); }
            });
            window.lozadObserver.observe();
            // pre-load first slide and its neighbor for smoother carousel experience
            setTimeout(() => {
                const first = document.querySelector('#carousel .carousel-slide img.lozad');
                if (first && window.lozadObserver && window.lozadObserver.trigger) {
                    window.lozadObserver.trigger(first);
                    const next = first.closest('.carousel-track').children[1];
                    if (next) {
                        const nimg = next.querySelector('img.lozad');
                        if (nimg) window.lozadObserver.trigger(nimg);
                    }
                }
            }, 80);
        } catch (e) { console.warn('lozad init failed', e); }
    }
});

// BroadcastChannel listener for admin updates (real-time sync)
const adminChannel = (typeof BroadcastChannel !== 'undefined') ? new BroadcastChannel('sf_admin_channel') : null;
if (adminChannel) {
    adminChannel.addEventListener('message', (ev) => {
        try {
            const data = ev.data || {};
            if (data.type === 'inventoryUpdate') {
                // inventory changed in admin page — re-render from localStorage
                renderInventory();
            } else if (data.type === 'galleryUpdate') {
                // gallery metadata changed
                applyGalleryMeta();
            }
        } catch (err) {
            console.warn('adminChannel message handling error', err);
        }
    });
}

// Gallery metadata helpers (mirror of admin)
const GALLERY_META_KEY = 'sf_gallery_meta';
function loadGalleryMeta(){ try { const raw = localStorage.getItem(GALLERY_META_KEY); return raw?JSON.parse(raw):{}; } catch(e) { return {}; } }
function applyGalleryMeta(){
    const meta = loadGalleryMeta();
    const imgs = document.querySelectorAll('#gallery img');
    if (!imgs) return;
    imgs.forEach(img => {
        // normalize stored keys and image srcs (admin stores unencoded path)
        const imgSrc = decodeURI(img.getAttribute('src'));
        if (meta[imgSrc] || meta[decodeURI(imgSrc)]) img.classList.add('featured');
        else img.classList.remove('featured');
    });
}

/* Carousel implementation */
function initCarousel() {
    const carousel = document.getElementById('carousel');
    if (!carousel) return;

    const track = carousel.querySelector('.carousel-track');
    const slides = Array.from(track.children);
    const prevBtn = carousel.querySelector('.carousel-btn.prev');
    const nextBtn = carousel.querySelector('.carousel-btn.next');
    const dotsContainer = carousel.querySelector('.carousel-dots');

    // create dots
    slides.forEach((_, i) => {
        const btn = document.createElement('button');
        btn.setAttribute('aria-label', 'Go to slide ' + (i+1));
        if (i === 0) btn.classList.add('active');
        btn.addEventListener('click', () => moveToSlide(i));
        dotsContainer.appendChild(btn);
    });

    let currentIndex = 0;
    let slideWidth = carousel.querySelector('.carousel-slide').getBoundingClientRect().width;
    let autoId = null;

    function setSlidePositions() {
        slideWidth = carousel.querySelector('.carousel-slide').getBoundingClientRect().width;
    }

    function updateTrack() {
        track.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
        const dots = Array.from(dotsContainer.children);
        dots.forEach((d, i) => d.classList.toggle('active', i === currentIndex));
    }

    function moveToSlide(index) {
        currentIndex = (index + slides.length) % slides.length;
        updateTrack();
        // trigger lozad to load the current and adjacent slides for snappy navigation
        try {
            if (window.lozadObserver && window.lozadObserver.trigger) {
                const idxs = [currentIndex, (currentIndex + 1) % slides.length, (currentIndex - 1 + slides.length) % slides.length];
                idxs.forEach(i => {
                    const img = slides[i] && slides[i].querySelector('img.lozad');
                    if (img) window.lozadObserver.trigger(img);
                });
            }
        } catch (err) { /* ignore */ }
    }

    function next() { moveToSlide(currentIndex + 1); }
    function prev() { moveToSlide(currentIndex - 1); }

    nextBtn && nextBtn.addEventListener('click', () => { next(); resetAuto(); });
    prevBtn && prevBtn.addEventListener('click', () => { prev(); resetAuto(); });

    // autoplay
    function startAuto() { if (autoId) clearInterval(autoId); autoId = setInterval(next, 4500); }
    function stopAuto() { if (autoId) { clearInterval(autoId); autoId = null; } }
    function resetAuto() { stopAuto(); startAuto(); }

    carousel.addEventListener('mouseenter', stopAuto);
    carousel.addEventListener('mouseleave', startAuto);
    carousel.addEventListener('focusin', stopAuto);
    carousel.addEventListener('focusout', startAuto);

    // keyboard navigation
    carousel.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') prev();
        if (e.key === 'ArrowRight') next();
    });

    // touch support (simple swipe)
    let startX = 0;
    let isTouch = false;
    carousel.addEventListener('touchstart', (e) => { isTouch = true; startX = e.touches[0].clientX; stopAuto(); }, { passive: true });
    carousel.addEventListener('touchmove', (e) => { if (!isTouch) return; const dx = e.touches[0].clientX - startX; }, { passive: true });
    carousel.addEventListener('touchend', (e) => { if (!isTouch) return; const dx = (e.changedTouches[0].clientX - startX); if (dx > 40) prev(); else if (dx < -40) next(); isTouch = false; startAuto(); });

    // resize handling
    window.addEventListener('resize', () => { setTimeout(() => { setSlidePositions(); updateTrack(); }, 120); });

    // set initial positions
    setSlidePositions();
    updateTrack();
    startAuto();
}

// initialize carousel on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    initCarousel();
});

/* Remote inventory polling (optional): fetch inventory.json from GitHub Pages and apply so everyone sees published changes.
   This will try the provided GitHub Pages URL and, if successful, overwrite the local inventory used for display.
*/
const REMOTE_INVENTORY_URL = 'https://sam-fedel.github.io/Sam-Fedel-Farms-Agricultural-Services-/inventory.json';
async function fetchAndApplyRemoteInventory() {
    try {
        const res = await fetch(REMOTE_INVENTORY_URL, { cache: 'no-store' });
        if (!res.ok) return false;
        const json = await res.json();
        if (!Array.isArray(json)) return false;
        // Save remote inventory locally and render
        try { localStorage.setItem(INVENTORY_KEY, JSON.stringify(json)); } catch (e) { console.warn('failed to save remote inventory', e); }
        renderInventory();
        showToast('Inventory updated from remote');
        return true;
    } catch (err) {
        // network failure, ignore
        return false;
    }
}

// Poll remote inventory on load and every 30s
document.addEventListener('DOMContentLoaded', () => {
    fetchAndApplyRemoteInventory();
    setInterval(fetchAndApplyRemoteInventory, 30000);
});

// Small toast helper for notifications
function showToast(msg, timeout = 3000) {
    try {
        let t = document.getElementById('sf-toast');
        if (!t) {
            t = document.createElement('div');
            t.id = 'sf-toast';
            t.style.position = 'fixed';
            t.style.right = '16px';
            t.style.bottom = '20px';
            t.style.background = 'rgba(0,0,0,0.7)';
            t.style.color = '#fff';
            t.style.padding = '10px 14px';
            t.style.borderRadius = '8px';
            t.style.zIndex = '9999';
            document.body.appendChild(t);
        }
        t.textContent = msg;
        t.style.opacity = '1';
        if (t._timeout) clearTimeout(t._timeout);
        t._timeout = setTimeout(() => { t.style.opacity = '0'; }, timeout);
    } catch (e) { /* ignore */ }
}

/* Typewriter animation for hero paragraph */
function runHeroTypewriter() {
    const el = document.getElementById('hero-type');
    if (!el) return;
    const text = el.getAttribute('data-text') || el.textContent || '';
    const prefersReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduce) {
        el.textContent = text;
        return;
    }
    el.textContent = '';
    let i = 0;
    const speed = 45; // ms per char
    const timer = setInterval(() => {
        el.textContent += text.charAt(i);
        i++;
        if (i >= text.length) {
            clearInterval(timer);
        }
    }, speed);
}

/* Mobile nav toggle */
function initMobileNav() {
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');
    if (!toggle || !links) return;
    toggle.addEventListener('click', () => {
        const opened = links.classList.toggle('open');
        toggle.setAttribute('aria-expanded', opened ? 'true' : 'false');
    });
    // Close when a nav link is chosen (good for single-page anchors)
    links.addEventListener('click', (e) => {
        if (e.target.tagName.toLowerCase() === 'a') {
            links.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    runHeroTypewriter();
    initMobileNav();
});