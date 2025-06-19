/* Display recently viewed products in a Swiper carousel. */

class RecentlyViewedCarousel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.maxProducts = parseInt(this.dataset.maxProducts) || 5;
    this.storeUrl = this.dataset.storeUrl || '';
    this.STORAGE_KEY = 'recently_viewed_products';

    this.loadProducts();
  }

  /* Loads recently viewed product handles from localStorage,
   * fetches their data, and renders the carousel.*/

  async loadProducts() {
    const handles = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]')
      .slice(-this.maxProducts)
      .reverse();
    if (!handles.length) {
      this.renderEmpty();
      return;
    }

    try {
      const products = await Promise.all(handles.map(handle => this.fetchProduct(handle)));
      this.render(products.filter(Boolean));
      this.initSwiper();
    } catch (err) {
      console.error('Error fetching recently viewed products:', err);
      this.renderError();
    }
  }

  /* Fetch product JSON data by handle.
   * handle - Product handle. */

  async fetchProduct(handle) {
    try {
      const url = `${this.storeUrl}/products/${handle}.json`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch product ${handle}`);
      const data = await res.json();
      return data.product;
    } catch {
      return null;
    }
  }

  /* Renders the carousel markup.
   * products - List of product objects. */

  render(products) {
    const styles = `
      <style>
        :host {
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
            Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }
        .swiper-container {
          width: 100%;
          padding: 1rem 0;
        }
        .swiper-slide {
          width: 180px;
          text-align: center;
          user-select: none;
        }
        .swiper-slide img {
          width: 100%;
          border-radius: 8px;
          object-fit: cover;
        }
        .product-title {
          margin-top: 0.5rem;
          font-size: 0.9rem;
          color: #333;
          text-decoration: none;
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .swiper-pagination{
          display:none;
        }
        .swiper-button-next:after, .swiper-button-prev:after{
          color:#121212
        }
      </style>
      <link href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css" rel="stylesheet" />
`;

    const slides = products
      .map(
        (p) => `
        <div class="swiper-slide">
          <a href="/products/${p.handle}" class="product-title" title="${p.title}">
            <img src="${p.images[0]?.src || ''}" alt="${p.title}" />
            <span>${p.title}</span>
          </a>
        </div>`
      )
      .join('');
      
    this.shadowRoot.innerHTML = `
      ${styles}
      <div class="swiper-container">
        <div class="swiper-wrapper">
          ${slides}
        </div>
        <div class="swiper-pagination"></div>
        <div class="swiper-button-prev"></div>
        <div class="swiper-button-next"></div>
      </div>
    `;
  }

  /* Renders when no products are found. */

  renderEmpty() {
    this.shadowRoot.innerHTML = `<p>No recently viewed products found.</p>`;
  }

  /* Renders when an error occurs. */
  
  renderError() {
    this.shadowRoot.innerHTML = `<p>Failed to load recently viewed products.</p>`;
  }

  /* Initializes the Swiper carousel */

  initSwiper() {
    if (typeof Swiper === 'undefined') {
      console.warn('Swiper library is not loaded.');
      return;
    }
    new Swiper(this.shadowRoot.querySelector('.swiper-container'), {
      slidesPerView: 1,
      spaceBetween: 10,
      pagination: {
        el: this.shadowRoot.querySelector('.swiper-pagination'),
        clickable: true,
      },
      navigation: {
        nextEl: this.shadowRoot.querySelector('.swiper-button-next'),
        prevEl: this.shadowRoot.querySelector('.swiper-button-prev'),
      },
      breakpoints: {
        640: { slidesPerView: 2 },
        1024: { slidesPerView: 3 },
      },
    });
  }
}
customElements.define('recently-viewed-carousel', RecentlyViewedCarousel);
