// min-order.js — simple, robust min-order enforcement (copy-paste entire file)
(function () {
  var MIN_PAISA = 30000; // ₹300 in paise
  var MSG_ID = 'minOrderBox';
  var POLL_MS = 1500; // how often to re-check (light)

  // ---------- UI ----------
  function createMessageBox() {
    var box = document.getElementById(MSG_ID);
    if (box) return box;

    box = document.createElement('div');
    box.id = MSG_ID;

    // full-width friendly style for flex/grid footers
    box.style.cssText = [
      'display:none',
      'width:100%',
      'box-sizing:border-box',
      'margin:0 0 12px 0',
      'padding:10px 14px',
      'background:#fff4f4',
      'border-left:4px solid #cc0000',
      'color:#990000',
      'border-radius:6px',
      'font-size:14px',
      'line-height:1.3',
      'clear:both',
      'align-self:stretch',
      'position:relative',
      'z-index:4000'
    ].join(';');

    // optional close button (keeps UI friendly)
    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.innerHTML = '&#10005;';
    closeBtn.setAttribute('aria-label','Close min order message');
    closeBtn.style.cssText = 'position:absolute;right:8px;top:8px;border:0;background:transparent;cursor:pointer;color:#7a0710;font-size:14px';
    closeBtn.addEventListener('click', function () { box.style.display = 'none'; });
    box.appendChild(closeBtn);

    return box;
  }

  function placeMessageInFooter() {
    var box = createMessageBox();

    // try drawer footer first (user often opens drawer on mobile)
    var drawer = document.querySelector('cart-drawer, .cart-drawer, #CartDrawer');
    if (drawer) {
      // common footer selector inside drawer
      var footer = drawer.querySelector('.cart__ctas, .cart__footer, .cart__totals, footer, .drawer__footer');
      if (footer && !footer.querySelector('#' + MSG_ID)) {
        footer.prepend(box);
        return box;
      }
    }

    // fallback: cart page footer
    var cartFooter = document.querySelector('.cart__footer, .cart__totals, .cart-footer, .cart-footer__wrapper');
    if (cartFooter && !cartFooter.querySelector('#' + MSG_ID)) {
      cartFooter.prepend(box);
      return box;
    }

    // last resort: if neither found, ensure it's in body (but styled full width)
    if (!document.body.querySelector('#' + MSG_ID)) {
      document.body.prepend(box);
    }
    return box;
  }

  // ---------- Helpers ----------
  function getCheckoutControls() {
    // includes drawer and cart page buttons/links
    var sel = [
      'cart-drawer button[name="checkout"]',
      'cart-drawer a[href*="/checkout"]',
      'button[name="checkout"]',
      'a[href*="/checkout"]',
      'button#CartDrawer-Checkout',
      'button.cart__checkout-button'
    ];
    var nodes = document.querySelectorAll(sel.join(','));
    return Array.prototype.slice.call(nodes);
  }

  function disableControl(el) {
    try {
      el.setAttribute('disabled', 'disabled');
      el.setAttribute('aria-disabled', 'true');
      el.classList.add('is-disabled');
      el.style.pointerEvents = 'none';
      el.style.opacity = '0.5';
    } catch (e) { /* ignore */ }
  }

  function enableControl(el) {
    try {
      el.removeAttribute('disabled');
      el.setAttribute('aria-disabled', 'false');
      el.classList.remove('is-disabled');
      el.style.pointerEvents = '';
      el.style.opacity = '';
    } catch (e) { /* ignore */ }
  }

  // ---------- Core: fetch and update ----------
  function fetchCartTotalPaise() {
    return fetch('/cart.js', { credentials: 'same-origin' })
      .then(function (res) {
        if (!res.ok) throw new Error('cart fetch failed');
        return res.json();
      })
      .then(function (data) {
        return (data && data.total_price) ? data.total_price : 0;
      })
      .catch(function (err) {
        // console safe log
        try { console.warn('MinOrder: cart fetch failed', err); } catch (e) {}
        return null; // signal failure
      });
  }

  function applyStateFromTotal(totalPaise) {
    var box = placeMessageInFooter();
    var controls = getCheckoutControls();

    if (totalPaise === null) {
      // fetch failed — enable checkout to avoid lockout
      controls.forEach(enableControl);
      if (box) box.style.display = 'none';
      return;
    }

    var below = totalPaise < MIN_PAISA;
    if (box) {
      if (below) {
        box.style.display = 'block';
        box.textContent = 'Minimum order value is ₹300 to checkout.';
        // re-add close button if removed by textContent overwrite:
        var existingClose = box.querySelector('button[aria-label="Close min order message"]');
        if (!existingClose) {
          var closeBtn = document.createElement('button');
          closeBtn.type = 'button';
          closeBtn.innerHTML = '&#10005;';
          closeBtn.setAttribute('aria-label','Close min order message');
          closeBtn.style.cssText = 'position:absolute;right:8px;top:8px;border:0;background:transparent;cursor:pointer;color:#7a0710;font-size:14px';
          closeBtn.addEventListener('click', function () { box.style.display = 'none'; });
          box.appendChild(closeBtn);
        }
      } else {
        box.style.display = 'none';
      }
    }

    if (below) {
      controls.forEach(disableControl);
    } else {
      controls.forEach(enableControl);
    }
  }

  // Combined update: fetch + apply
  function updateState() {
    return fetchCartTotalPaise().then(function (total) {
      applyStateFromTotal(total);
      return total;
    });
  }

  // ---------- Event attachments ----------
  function attachQuickListeners() {
    // listen for Shopify cart:updated event and run update
    try {
      document.addEventListener('cart:updated', function () {
        setTimeout(updateState, 120); // short delay so theme updates finish
      });
    } catch (e) { /* ignore */ }

    // attach click/change listeners to quantity/remove controls (common selectors)
    var selectors = '.cart__remove, .cart__remove-item, .js-remove, .quantity__button, input[name="quantity"], input.qty, input.cart__quantity-input';
    try {
      document.querySelectorAll(selectors).forEach(function (el) {
        if (el._minOrderAttached) return;
        el.addEventListener('click', function () { setTimeout(updateState, 300); });
        el.addEventListener('change', function () { setTimeout(updateState, 300); });
        el._minOrderAttached = true;
      });
    } catch (e) { /* ignore */ }

    // attach to checkout controls to do a quick fetch-check before navigation (fallback)
    try {
      getCheckoutControls().forEach(function (ctrl) {
        if (ctrl._minOrderClickAttached) return;
        ctrl.addEventListener('click', function (ev) {
          // quick blocking unless already enabled
          // allow navigation if total >= MIN or if fetch fails
          ev.preventDefault();
          fetchCartTotalPaise().then(function (total) {
            if (total === null) {
              // allow to avoid lockout
              try { if (ctrl.tagName === 'A' && ctrl.href) window.location = ctrl.href; else if (ctrl.closest && ctrl.closest('form')) ctrl.closest('form').submit(); else ctrl.click(); } catch (e) {}
            } else if (total < MIN_PAISA) {
              var box = placeMessageInFooter();
              if (box) {
                box.style.display = 'block';
                box.textContent = 'Minimum order value is ₹300 to checkout.';
              }
            } else {
              try { if (ctrl.tagName === 'A' && ctrl.href) window.location = ctrl.href; else if (ctrl.closest && ctrl.closest('form')) ctrl.closest('form').submit(); else ctrl.click(); } catch (e) {}
            }
          });
        }, { passive: false });
        ctrl._minOrderClickAttached = true;
      });
    } catch (e) { /* ignore */ }
  }

  // ---------- Init ----------
  function init() {
    // initial run
    updateState();
    // periodic safe poll (light)
    setInterval(updateState, POLL_MS);
    // attach event listeners
    attachQuickListeners();
    // small delayed reattach for dynamic themes
    setTimeout(function () { attachQuickListeners(); updateState(); }, 900);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
