class CartDrawer extends HTMLElement {
  constructor() {
    super();
    
    // this.minimumOrderValue = 200;
    // this.debouncedUpdateCartDrawer = debounce(this.updateCartDrawer.bind(this),300)
    // this.cartTotalElement = document.querySelector('.totals'); // Initialize at construction
    this.checkOutButton = document.querySelector('.cart__checkout-button');

    this.addEventListener('keyup', (evt) => evt.code === 'Escape' && this.close());
    this.querySelector('#CartDrawer-Overlay').addEventListener('click', this.close.bind(this));
    this.setHeaderCartIconAccessibility();
    // this.initializeMinimumOrderWarning();

    // Listen for the cart update event
    // document.querySelector('.cart-drawer__footer').addEventListener('cart:updated', this.handleCartUpdate.bind(this));
  }

  // initializeMinimumOrderWarning() {
  //   if (!this.cartTotalElement) {
  //     console.error('Cart total element not found');
  //     return;
  //   }

  //   this.observeCartTotal(this.cartTotalElement);
  //   this.updateCartDrawer();
  // }

  // observeCartTotal(cartTotalElement) {
  //   const observer = new MutationObserver((mutations) => {
  //     mutations.forEach(mutation => {
  //       console.log('mutation detected:', mutation);
  //       if (mutation.type === 'childList' || mutation.type === 'subtree' || mutation.type === 'characterData') {
  //         this.debouncedUpdateCartDrawer();
  //       }
  //     });

  //     const event = new CustomEvent('cart:updated');
  //     document.querySelector('.cart-drawer__footer').dispatchEvent(event);
  //   });

  //   observer.observe(this.cartTotalElement, { childList: true, subtree: true, characterData: true });
  //   console.log('mutation observer initialized:', cartTotalElement);
  // }

  // handleCartUpdate() {
  //   console.log('Cart update event triggered');
  //   this.debouncedUpdateCartDrawer();
  // }

  // updateCartDrawer() {
  //   if (!this.checkOutButton) {
  //     console.error('Checkout button not found');
  //     return;
  //   }

  //   fetch('/cart.js')
  //     .then(response => response.json())
  //     .then(cart => {
  //       const cartTotal = cart.total_price / 100; // Convert to correct currency format
  //       console.log('Fetched cart total:', cartTotal);

  //       if (cartTotal < this.minimumOrderValue) {
  //         this.checkOutButton.disabled = true;
  //         this.showMinimumOrderWarning();
  //       } else {
  //         this.checkOutButton.disabled = false;
  //         this.hideMinimumOrderWarning();
  //       }
  //     })
  //     .catch(error => console.error('Error fetching cart data:', error));
  // }   

  // showMinimumOrderWarning() {
  //   let warningMessage = document.querySelector('.minimum-order-warning');

  //   if (!warningMessage) {
  //     warningMessage = document.createElement('div');
  //     warningMessage.className = 'minimum-order-warning';
  //     warningMessage.innerText = 'Your order must be at least ₹' + this.minimumOrderValue + ' to proceed to checkout';

  //     const cartFooter = document.querySelector('.cart-drawer__footer');
  //     if (cartFooter) {
  //       cartFooter.appendChild(warningMessage);
  //     } else {
  //       console.error('Cart footer element not found');
  //     }
  //   } 
  // }

  // hideMinimumOrderWarning() {
  //   const warningMessage = document.querySelector('.minimum-order-warning');
  //   if (warningMessage) {
  //     warningMessage.remove();
  //   }
  //   console.log("Minimum order value warning hidden");
  // }

  setHeaderCartIconAccessibility() {
    const cartLink = document.querySelector('#cart-icon-bubble');
    cartLink.setAttribute('role', 'button');
    cartLink.setAttribute('aria-haspopup', 'dialog');
    cartLink.addEventListener('click', (event) => {
      event.preventDefault();
      this.open(cartLink);
    });
    cartLink.addEventListener('keydown', (event) => {
      if (event.code.toUpperCase() === 'SPACE') {
        event.preventDefault();
        this.open(cartLink);
      }
    });
  }

  open(triggeredBy) {
    if (triggeredBy) this.setActiveElement(triggeredBy);
    const cartDrawerNote = this.querySelector('[id^="Details-"] summary');
    if (cartDrawerNote && !cartDrawerNote.hasAttribute('role')) this.setSummaryAccessibility(cartDrawerNote);
    // here the animation doesn't seem to always get triggered. A timeout seem to help
    setTimeout(() => {
      this.classList.add('animate', 'active');
    });

    this.addEventListener(
      'transitionend',
      () => {
        const containerToTrapFocusOn = this.classList.contains('is-empty')
          ? this.querySelector('.drawer__inner-empty')
          : document.getElementById('CartDrawer');
        const focusElement = this.querySelector('.drawer__inner') || this.querySelector('.drawer__close');
        trapFocus(containerToTrapFocusOn, focusElement);
      },
      { once: true }
    );

    document.body.classList.add('overflow-hidden');
  }

  close() {
    this.classList.remove('active');
    removeTrapFocus(this.activeElement);
    document.body.classList.remove('overflow-hidden');
  }

  setSummaryAccessibility(cartDrawerNote) {
    cartDrawerNote.setAttribute('role', 'button');
    cartDrawerNote.setAttribute('aria-expanded', 'false');

    if (cartDrawerNote.nextElementSibling.getAttribute('id')) {
      cartDrawerNote.setAttribute('aria-controls', cartDrawerNote.nextElementSibling.id);
    }

    cartDrawerNote.addEventListener('click', (event) => {
      event.currentTarget.setAttribute('aria-expanded', !event.currentTarget.closest('details').hasAttribute('open'));
    });

    cartDrawerNote.parentElement.addEventListener('keyup', onKeyUpEscape);
  }

  renderContents(parsedState) {
    this.querySelector('.drawer__inner').classList.contains('is-empty') &&
      this.querySelector('.drawer__inner').classList.remove('is-empty');
    this.productId = parsedState.id;
    this.getSectionsToRender().forEach((section) => {
      const sectionElement = section.selector
        ? document.querySelector(section.selector)
        : document.getElementById(section.id);
      sectionElement.innerHTML = this.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
    });

    setTimeout(() => {
      this.querySelector('#CartDrawer-Overlay').addEventListener('click', this.close.bind(this));
      this.open();
    });
  }

  getSectionInnerHTML(html, selector = '.shopify-section') {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector).innerHTML;
  }

  getSectionsToRender() {
    return [
      {
        id: 'cart-drawer',
        selector: '#CartDrawer',
      },
      {
        id: 'cart-icon-bubble',
      },
    ];
  }

  getSectionDOM(html, selector = '.shopify-section') {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector);
  }

  setActiveElement(element) {
    this.activeElement = element;
  }
}

customElements.define('cart-drawer', CartDrawer);

class CartDrawerItems extends CartItems {
  getSectionsToRender() {
    return [
      {
        id: 'CartDrawer',
        section: 'cart-drawer',
        selector: '.drawer__inner',
      },
      {
        id: 'cart-icon-bubble',
        section: 'cart-icon-bubble',
        selector: '.shopify-section',
      },
    ];

    console.log('Cart Object:', this.cart)
  }
}

customElements.define('cart-drawer-items', CartDrawerItems);
