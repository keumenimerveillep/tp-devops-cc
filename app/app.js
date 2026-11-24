(() => {
  const FREE_SHIPPING_THRESHOLD = 98400;
  const STANDARD_SHIPPING_FEE = 5248;

  let products = DB.loadProducts();
  let cart = DB.loadCart();

  const state = {
    category: "all",
    search: "",
    size: "all",
    maxPrice: 230000,
    sort: "featured",
    adminMode: false,
    modalSelectedSize: null
  };

  // Éléments du DOM
  const storefrontView = document.getElementById("storefront-view");
  const adminView = document.getElementById("admin-view");
  const toggleAdminBtn = document.getElementById("toggle-admin-btn");
  const heroAdminBtn = document.getElementById("hero-admin-btn");
  const backToStoreBtn = document.getElementById("back-to-store-btn");
  const resetDbBtn = document.getElementById("reset-db-btn");

  const navLinks = document.querySelectorAll(".nav-link");
  const searchInput = document.getElementById("search-input");
  const sizeFilter = document.getElementById("size-filter");
  const priceFilter = document.getElementById("price-filter");
  const priceValue = document.getElementById("price-value");
  const sortSelect = document.getElementById("sort-select");
  const resetFiltersBtn = document.getElementById("reset-filters-btn");
  const resultsCount = document.getElementById("results-count");
  const productsGrid = document.getElementById("products-grid");

  const productModal = document.getElementById("product-modal");
  const closeModalBtn = document.getElementById("close-modal-btn");
  const productModalContent = document.getElementById("product-modal-content");

  const cartDrawer = document.getElementById("cart-drawer");
  const openCartBtn = document.getElementById("open-cart-btn");
  const closeCartBtn = document.getElementById("close-cart-btn");
  const cartCount = document.getElementById("cart-count");
  const cartItemsEl = document.getElementById("cart-items");
  const shippingBar = document.getElementById("shipping-bar");
  const cartSubtotal = document.getElementById("cart-subtotal");
  const cartShipping = document.getElementById("cart-shipping");
  const cartTotal = document.getElementById("cart-total");
  const checkoutBtn = document.getElementById("checkout-btn");

  const productForm = document.getElementById("product-form");
  const formTitle = document.getElementById("form-title");
  const productIdInput = document.getElementById("product-id");
  const prodNameInput = document.getElementById("prod-name");
  const prodCategoryInput = document.getElementById("prod-category");
  const prodPriceInput = document.getElementById("prod-price");
  const prodStockInput = document.getElementById("prod-stock");
  const prodBadgeInput = document.getElementById("prod-badge");
  const prodImageInput = document.getElementById("prod-image");
  const prodDescriptionInput = document.getElementById("prod-description");
  const cancelEditBtn = document.getElementById("cancel-edit-btn");
  const adminProductsTbody = document.getElementById("admin-products-tbody");
  const adminStats = document.getElementById("admin-stats");
  const toastContainer = document.getElementById("toast-container");

  function formatFCFA(amount) {
    const formatted = new Intl.NumberFormat("fr-FR", {
      maximumFractionDigits: 0
    }).format(Math.round(Number(amount) || 0));
    return `${formatted} FCFA`;
  }

  function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  function getFilteredProducts() {
    return products
      .filter((item) => {
        const matchesCat = state.category === "all" || item.category === state.category;
        const matchesSize = state.size === "all" || (item.sizes && item.sizes.includes(state.size));
        const matchesPrice = Number(item.price) <= Number(state.maxPrice);
        const query = state.search.trim().toLowerCase();
        const matchesQuery =
          !query ||
          item.name.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query) ||
          (item.description && item.description.toLowerCase().includes(query));
        return matchesCat && matchesSize && matchesPrice && matchesQuery;
      })
      .sort((a, b) => {
        if (state.sort === "price-asc") return a.price - b.price;
        if (state.sort === "price-desc") return b.price - a.price;
        if (state.sort === "name-asc") return a.name.localeCompare(b.name, "fr");
        return 0;
      });
  }

  function renderCatalog() {
    const filtered = getFilteredProducts();
    resultsCount.textContent =
      filtered.length === 0
        ? "Aucun vêtement ne correspond à vos critères."
        : `${filtered.length} article${filtered.length > 1 ? "s" : ""} disponible${filtered.length > 1 ? "s" : ""}`;

    if (filtered.length === 0) {
      productsGrid.innerHTML = "";
      return;
    }

    productsGrid.innerHTML = filtered
      .map((item) => {
        const isOutOfStock = Number(item.stock) <= 0;
        const defaultSize = (item.sizes && item.sizes[0]) || "Unique";
        return `
          <article class="product-card">
            <div class="product-media" data-open-modal="${item.id}">
              <img src="${item.image}" alt="${item.name}" loading="lazy" />
              ${item.badge ? `<span class="product-badge">${item.badge}</span>` : ""}
            </div>
            <div class="product-body">
              <div class="product-meta">
                <span>${item.category}</span>
                <span>${isOutOfStock ? "Rupture de stock" : `Stock : ${item.stock}`}</span>
              </div>
              <h3 class="product-title" data-open-modal="${item.id}">${item.name}</h3>
              <div class="product-sizes">
                ${(item.sizes || []).map((s) => `<span class="size-chip">${s}</span>`).join("")}
              </div>
              <div class="product-footer">
                <span class="product-price">${formatFCFA(item.price)}</span>
                <button
                  type="button"
                  class="btn btn-primary btn-sm"
                  data-quick-add="${item.id}"
                  data-default-size="${defaultSize}"
                  ${isOutOfStock ? "disabled" : ""}
                >
                  ${isOutOfStock ? "Épuisé" : "Ajouter"}
                </button>
              </div>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function openProductModal(productId) {
    const item = products.find((p) => p.id === productId);
    if (!item) return;

    const sizes = item.sizes && item.sizes.length ? item.sizes : ["Unique"];
    state.modalSelectedSize = sizes[0];

    productModalContent.innerHTML = `
      <div class="modal-grid">
        <img src="${item.image}" alt="${item.name}" class="modal-img" />
        <div>
          <span class="eyebrow">${item.category}</span>
          <h2 style="margin:0 0 0.5rem;">${item.name}</h2>
          <p style="font-size:1.3rem;font-weight:700;margin:0 0 0.8rem;">${formatFCFA(item.price)}</p>
          <p class="muted" style="margin:0 0 1rem;">${item.description || "Pièce sélectionnée par Maison Élégance."}</p>
          <p style="font-size:0.86rem;margin:0 0 0.6rem;"><strong>Disponibilité :</strong> ${item.stock > 0 ? `${item.stock} en stock` : "Rupture de stock"}</p>
          <div>
            <strong style="font-size:0.86rem;">Choisir une taille :</strong>
            <div class="size-options" id="modal-size-options">
              ${sizes
                .map(
                  (sz, idx) =>
                    `<button type="button" class="size-option-btn ${idx === 0 ? "active" : ""}" data-size="${sz}">${sz}</button>`
                )
                .join("")}
            </div>
          </div>
          <button
            type="button"
            class="btn btn-primary btn-block"
            id="modal-add-to-cart"
            ${item.stock <= 0 ? "disabled" : ""}
          >
            ${item.stock <= 0 ? "Indisponible" : "Ajouter au panier"}
          </button>
        </div>
      </div>
    `;

    productModal.classList.remove("hidden");

    document.querySelectorAll("#modal-size-options .size-option-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("#modal-size-options .size-option-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        state.modalSelectedSize = btn.dataset.size;
      });
    });

    const addBtn = document.getElementById("modal-add-to-cart");
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        addToCart(item.id, state.modalSelectedSize);
        productModal.classList.add("hidden");
      });
    }
  }

  function addToCart(productId, size) {
    const product = products.find((p) => p.id === productId);
    if (!product || product.stock <= 0) {
      showToast("Cet article n'est plus en stock.");
      return;
    }

    const existing = cart.find((c) => c.productId === productId && c.size === size);
    const currentQtyInCart = cart
      .filter((c) => c.productId === productId)
      .reduce((acc, c) => acc + c.qty, 0);

    if (currentQtyInCart >= product.stock) {
      showToast(`Stock maximum atteint (${product.stock}) pour ${product.name}.`);
      return;
    }

    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        productId,
        size: size || "Unique",
        qty: 1
      });
    }

    DB.saveCart(cart);
    renderCart();
    showToast(`« ${product.name} » (${size}) ajouté au panier.`);
  }

  function updateCartQty(index, delta) {
    const entry = cart[index];
    if (!entry) return;
    const product = products.find((p) => p.id === entry.productId);
    const nextQty = entry.qty + delta;

    if (nextQty <= 0) {
      cart.splice(index, 1);
    } else if (product && nextQty > product.stock) {
      showToast(`Stock disponible : ${product.stock} exemplaires.`);
      return;
    } else {
      entry.qty = nextQty;
    }

    DB.saveCart(cart);
    renderCart();
  }

  function renderCart() {
    const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
    cartCount.textContent = totalCount;

    if (cart.length === 0) {
      cartItemsEl.innerHTML = `<p class="muted" style="text-align:center;margin-top:2rem;">Votre panier est vide.</p>`;
      shippingBar.textContent = `Livraison offerte à partir de ${formatFCFA(FREE_SHIPPING_THRESHOLD)}.`;
      cartSubtotal.textContent = formatFCFA(0);
      cartShipping.textContent = formatFCFA(0);
      cartTotal.textContent = formatFCFA(0);
      return;
    }

    let subtotal = 0;

    cartItemsEl.innerHTML = cart
      .map((entry, idx) => {
        const product = products.find((p) => p.id === entry.productId);
        if (!product) return "";
        const lineTotal = product.price * entry.qty;
        subtotal += lineTotal;

        return `
          <div class="cart-item">
            <img src="${product.image}" alt="${product.name}" />
            <div>
              <div style="font-weight:700;font-size:0.92rem;">${product.name}</div>
              <div class="muted" style="font-size:0.8rem;">Taille : ${entry.size} · ${formatFCFA(product.price)}</div>
              <div class="qty-controls">
                <button type="button" data-cart-dec="${idx}" aria-label="Diminuer la quantité">−</button>
                <span>${entry.qty}</span>
                <button type="button" data-cart-inc="${idx}" aria-label="Augmenter la quantité">+</button>
              </div>
            </div>
            <div style="font-weight:700;font-size:0.92rem;">${formatFCFA(lineTotal)}</div>
          </div>
        `;
      })
      .join("");

    const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
    shippingBar.textContent =
      remaining === 0
        ? "✓ Vous bénéficiez de la livraison standard offerte !"
        : `Plus que ${formatFCFA(remaining)} pour la livraison offerte.`;

    const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
    cartSubtotal.textContent = formatFCFA(subtotal);
    cartShipping.textContent = shippingCost === 0 ? "Offerte" : formatFCFA(shippingCost);
    cartTotal.textContent = formatFCFA(subtotal + shippingCost);
  }

  function checkoutCart() {
    if (cart.length === 0) {
      showToast("Votre panier est vide.");
      return;
    }

    cart.forEach((entry) => {
      const product = products.find((p) => p.id === entry.productId);
      if (product) {
        product.stock = Math.max(0, Number(product.stock) - entry.qty);
      }
    });

    DB.saveProducts(products);
    cart = [];
    DB.saveCart(cart);

    renderCatalog();
    renderCart();
    renderAdmin();
    cartDrawer.classList.add("hidden");
    showToast("Commande confirmée ! Le stock a été mis à jour.");
  }

  // ADMINISTRATION
  function setAdminMode(active) {
    state.adminMode = active;
    storefrontView.classList.toggle("hidden", active);
    adminView.classList.toggle("hidden", !active);
    toggleAdminBtn.setAttribute("aria-pressed", String(active));
    toggleAdminBtn.textContent = active ? "Voir la boutique" : "Mode Gestion";
    if (active) {
      renderAdmin();
    }
  }

  function renderAdmin() {
    const totalArticles = products.length;
    const totalStock = products.reduce((sum, p) => sum + Number(p.stock || 0), 0);
    const lowStockCount = products.filter((p) => Number(p.stock || 0) > 0 && Number(p.stock) <= 5).length;
    const stockValue = products.reduce((sum, p) => sum + Number(p.price || 0) * Number(p.stock || 0), 0);

    adminStats.innerHTML = `
      <div class="stat-card"><span>Références actives</span><strong>${totalArticles}</strong></div>
      <div class="stat-card"><span>Unités en stock</span><strong>${totalStock}</strong></div>
      <div class="stat-card"><span>Stock faible (≤ 5)</span><strong>${lowStockCount}</strong></div>
      <div class="stat-card"><span>Valeur du stock</span><strong>${formatFCFA(stockValue)}</strong></div>
    `;

    adminProductsTbody.innerHTML = products
      .map(
        (item) => `
          <tr>
            <td>
              <div class="table-item-cell">
                <img src="${item.image}" alt="${item.name}" class="table-thumb" />
                <div>
                  <strong>${item.name}</strong>
                  <div class="muted" style="font-size:0.78rem;">${(item.sizes || []).join(", ")}</div>
                </div>
              </div>
            </td>
            <td>${item.category}</td>
            <td>${formatFCFA(item.price)}</td>
            <td>${item.stock}</td>
            <td>
              <div class="row-actions">
                <button type="button" class="btn btn-ghost btn-sm" data-edit-id="${item.id}">Modifier</button>
                <button type="button" class="btn btn-danger btn-sm" data-delete-id="${item.id}">Supprimer</button>
              </div>
            </td>
          </tr>
        `
      )
      .join("");
  }

  function resetProductForm() {
    productIdInput.value = "";
    formTitle.textContent = "Ajouter un vêtement";
    productForm.reset();
    prodPriceInput.value = "";
    prodStockInput.value = "";
    document.querySelectorAll("#prod-sizes input[type='checkbox']").forEach((cb) => {
      cb.checked = ["S", "M", "L"].includes(cb.value);
    });
  }

  function fillProductForm(product) {
    productIdInput.value = product.id;
    formTitle.textContent = "Modifier le vêtement";
    prodNameInput.value = product.name;
    prodCategoryInput.value = product.category;
    prodPriceInput.value = product.price;
    prodStockInput.value = product.stock;
    prodBadgeInput.value = product.badge || "";
    prodImageInput.value = product.image || "";
    prodDescriptionInput.value = product.description || "";

    document.querySelectorAll("#prod-sizes input[type='checkbox']").forEach((cb) => {
      cb.checked = Array.isArray(product.sizes) && product.sizes.includes(cb.value);
    });
  }

  productForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const selectedSizes = Array.from(document.querySelectorAll("#prod-sizes input[type='checkbox']:checked")).map(
      (cb) => cb.value
    );

    const payload = {
      id: productIdInput.value || `vet-${Date.now()}`,
      name: prodNameInput.value.trim(),
      category: prodCategoryInput.value,
      price: Number(prodPriceInput.value),
      stock: Math.max(0, parseInt(prodStockInput.value, 10) || 0),
      badge: prodBadgeInput.value.trim(),
      sizes: selectedSizes.length ? selectedSizes : ["Unique"],
      image:
        prodImageInput.value.trim() ||
        "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80",
      description: prodDescriptionInput.value.trim()
    };

    const existingIndex = products.findIndex((p) => p.id === payload.id);
    if (existingIndex >= 0) {
      products[existingIndex] = payload;
      showToast(`« ${payload.name} » mis à jour.`);
    } else {
      products.unshift(payload);
      showToast(`« ${payload.name} » ajouté au catalogue.`);
    }

    DB.saveProducts(products);
    resetProductForm();
    renderCatalog();
    renderAdmin();
  });

  cancelEditBtn.addEventListener("click", resetProductForm);

  adminProductsTbody.addEventListener("click", (e) => {
    const editId = e.target.dataset.editId;
    const deleteId = e.target.dataset.deleteId;

    if (editId) {
      const target = products.find((p) => p.id === editId);
      if (target) {
        fillProductForm(target);
        productForm.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else if (deleteId) {
      const target = products.find((p) => p.id === deleteId);
      products = products.filter((p) => p.id !== deleteId);
      DB.saveProducts(products);
      renderCatalog();
      renderAdmin();
      if (target) showToast(`« ${target.name} » supprimé.`);
    }
  });

  resetDbBtn.addEventListener("click", () => {
    products = DB.resetProducts();
    cart = [];
    DB.saveCart(cart);
    resetProductForm();
    renderCatalog();
    renderCart();
    renderAdmin();
    showToast("Catalogue et données réinitialisés.");
  });

  // Événements navigation, filtres, modale et panier
  navLinks.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (state.adminMode) setAdminMode(false);
      navLinks.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.category = btn.dataset.category;
      renderCatalog();
    });
  });

  searchInput.addEventListener("input", (e) => {
    state.search = e.target.value;
    renderCatalog();
  });

  sizeFilter.addEventListener("change", (e) => {
    state.size = e.target.value;
    renderCatalog();
  });

  priceFilter.addEventListener("input", (e) => {
    state.maxPrice = Number(e.target.value);
    priceValue.textContent = formatFCFA(state.maxPrice);
    renderCatalog();
  });

  sortSelect.addEventListener("change", (e) => {
    state.sort = e.target.value;
    renderCatalog();
  });

  resetFiltersBtn.addEventListener("click", () => {
    state.category = "all";
    state.search = "";
    state.size = "all";
    state.maxPrice = 230000;
    state.sort = "featured";

    searchInput.value = "";
    sizeFilter.value = "all";
    priceFilter.value = "230000";
    priceValue.textContent = formatFCFA(230000);
    sortSelect.value = "featured";
    navLinks.forEach((b) => b.classList.toggle("active", b.dataset.category === "all"));
    renderCatalog();
  });

  productsGrid.addEventListener("click", (e) => {
    const modalTrigger = e.target.closest("[data-open-modal]");
    if (modalTrigger) {
      openProductModal(modalTrigger.dataset.openModal);
      return;
    }

    const addTrigger = e.target.closest("[data-quick-add]");
    if (addTrigger) {
      addToCart(addTrigger.dataset.quickAdd, addTrigger.dataset.defaultSize);
    }
  });

  closeModalBtn.addEventListener("click", () => productModal.classList.add("hidden"));
  productModal.addEventListener("click", (e) => {
    if (e.target === productModal) productModal.classList.add("hidden");
  });

  openCartBtn.addEventListener("click", () => cartDrawer.classList.remove("hidden"));
  closeCartBtn.addEventListener("click", () => cartDrawer.classList.add("hidden"));
  cartDrawer.addEventListener("click", (e) => {
    if (e.target === cartDrawer) cartDrawer.classList.add("hidden");
  });

  cartItemsEl.addEventListener("click", (e) => {
    if (e.target.dataset.cartInc !== undefined) {
      updateCartQty(Number(e.target.dataset.cartInc), 1);
    } else if (e.target.dataset.cartDec !== undefined) {
      updateCartQty(Number(e.target.dataset.cartDec), -1);
    }
  });

  checkoutBtn.addEventListener("click", checkoutCart);

  toggleAdminBtn.addEventListener("click", () => setAdminMode(!state.adminMode));
  heroAdminBtn.addEventListener("click", () => setAdminMode(true));
  backToStoreBtn.addEventListener("click", () => setAdminMode(false));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      productModal.classList.add("hidden");
      cartDrawer.classList.add("hidden");
    }
  });

  document.getElementById("current-year").textContent = new Date().getFullYear();

  // Initialisation
  renderCatalog();
  renderCart();
})();