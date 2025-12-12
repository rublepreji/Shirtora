// /js/user/productDetails.js
document.addEventListener("DOMContentLoaded", () => {
  console.log("[productDetails] script loaded");

  // tiny helper
  const $ = id => document.getElementById(id);

  // --- Elements (may be null if EJS changed) ---
  const descTab = $('desc-tab');
  const reviewsTab = $('reviews-tab');
  const descContent = $('description-content');
  const reviewsContent = $('reviews-content');

  const mainImage = $('mainImage');
  const zoomLens = $('zoomLens');
  const zoomResult = $('zoomResult');

  const sizeSelect = $('size-select');
  const priceElement = $('product-price');
  const stockMessage = $('stock-message');
  const selectedSizeLabel = $('selected-size-label');
  let qtyInput = $('qty-input'); // may be recreated if missing
  const qtyMinus = $('qty-minus');
  const qtyPlus = $('qty-plus');
  const addToCartBtn = $('add-to-cart-btn');
  const buyNowBtn = $('buy-now-btn'); // optional
  const headerStock = $('header-stock');

  console.log("[productDetails] elements present:", {
    descTab: !!descTab, reviewsTab: !!reviewsTab,
    mainImage: !!mainImage, zoomLens: !!zoomLens, zoomResult: !!zoomResult,
    sizeSelect: !!sizeSelect, priceElement: !!priceElement,
    stockMessage: !!stockMessage, selectedSizeLabel: !!selectedSizeLabel,
    qtyInput: !!qtyInput, qtyMinus: !!qtyMinus, qtyPlus: !!qtyPlus,
    addToCartBtn: !!addToCartBtn, buyNowBtn: !!buyNowBtn, headerStock: !!headerStock
  });

  // -------------------------
  // Tabs
  // -------------------------
  function showTab(tabName) {
    if (!descTab || !reviewsTab || !descContent || !reviewsContent) return;
    if (tabName === 'description') {
      descTab.classList.add('tab-active');
      reviewsTab.classList.remove('tab-active');
      reviewsTab.classList.add('hover:text-black');

      descContent.classList.remove('hidden');
      reviewsContent.classList.add('hidden');
    } else {
      reviewsTab.classList.add('tab-active');
      descTab.classList.remove('tab-active');
      descTab.classList.add('hover:text-black');

      reviewsContent.classList.remove('hidden');
      descContent.classList.add('hidden');
    }
  }
  window.showTab = showTab;

  // -------------------------
  // Image change
  // -------------------------
  window.changeImage = function (src) {
    const mi = $('mainImage');
    if (mi) mi.src = src;
  };

  // -------------------------
  // Zoom (guarded)
  // -------------------------
  if (mainImage && zoomLens && zoomResult) {
    mainImage.parentElement.addEventListener("mouseenter", () => {
      // create zoomed image element
      zoomResult.innerHTML = `<img id="zoomedImg" src="${mainImage.src}" style="position:relative; left:0; top:0;"/>`;
    });

    mainImage.parentElement.addEventListener("mousemove", function (e) {
      const zoomedImg = $('zoomedImg');
      if (!zoomedImg) return;

      zoomLens.classList.remove("hidden");
      zoomResult.classList.remove("hidden");

      const bounds = this.getBoundingClientRect();
      const X = e.clientX - bounds.left;
      const Y = e.clientY - bounds.top;

      let lensX = X - zoomLens.offsetWidth / 2;
      let lensY = Y - zoomLens.offsetHeight / 2;

      lensX = Math.max(0, Math.min(lensX, bounds.width - zoomLens.offsetWidth));
      lensY = Math.max(0, Math.min(lensY, bounds.height - zoomLens.offsetHeight));

      zoomLens.style.left = `${lensX}px`;
      zoomLens.style.top = `${lensY}px`;

      // compute ratio (guard zero/NaN)
      const ratioX = (zoomedImg.offsetWidth && mainImage.offsetWidth) ? (zoomedImg.offsetWidth / mainImage.offsetWidth) : 1;
      const ratioY = (zoomedImg.offsetHeight && mainImage.offsetHeight) ? (zoomedImg.offsetHeight / mainImage.offsetHeight) : 1;

      zoomedImg.style.left = `${-lensX * ratioX}px`;
      zoomedImg.style.top = `${-lensY * ratioY}px`;
    });

    mainImage.parentElement.addEventListener("mouseleave", () => {
      zoomLens.classList.add("hidden");
      zoomResult.classList.add("hidden");
    });
  }

  // -------------------------
  // Ensure qtyInput exists (fallback)
  // -------------------------
  if (!qtyInput) {
    console.warn("[productDetails] qty-input not found; creating fallback input.");
    const fallback = document.createElement('input');
    fallback.type = 'text';
    fallback.id = 'qty-input';
    fallback.value = '1';
    fallback.readOnly = true;
    fallback.style.position = 'absolute';
    fallback.style.left = '-9999px';
    document.body.appendChild(fallback);
    qtyInput = $('qty-input');
  }

  // Ensure plus/minus are safe buttons
  if (qtyMinus) qtyMinus.setAttribute('type', 'button');
  if (qtyPlus) qtyPlus.setAttribute('type', 'button');

  // -------------------------
  // Stock / UI helpers
  // -------------------------
  let currentStock = 0;
  try {
    if (sizeSelect && sizeSelect.options && sizeSelect.selectedIndex >= 0) {
      currentStock = parseInt(sizeSelect.options[sizeSelect.selectedIndex].dataset.stock || '0', 10) || 0;
    }
  } catch (err) {
    console.error("[productDetails] reading initial stock failed:", err);
    currentStock = 0;
  }
  console.log("[productDetails] initial stock:", currentStock);

  function updateStockDisplay(stock) {
    if (!stockMessage) return;
    if (stock === 0) {
      stockMessage.className = 'text-red-600 font-semibold';
      stockMessage.textContent = 'OUT OF STOCK';
    } else if (stock < 5) {
      stockMessage.className = 'text-red-600';
      stockMessage.innerHTML = `Remaining only <span id="stock-count">${stock}</span> products`;
    } else if (stock < 10) {
      stockMessage.className = 'text-orange-600';
      stockMessage.innerHTML = `Stock: <span id="stock-count">${stock}</span>`;
    } else {
      stockMessage.className = 'text-green-600';
      stockMessage.innerHTML = `Stock: <span id="stock-count">${stock}</span>`;
    }
  }

  function updateHeaderStock(stock) {
    if (!headerStock) return;
    if (stock === 0) {
      headerStock.className = 'text-red-600 font-semibold';
      headerStock.textContent = '| OUT OF STOCK';
    } else if (stock < 5) {
      headerStock.className = 'text-orange-600 font-semibold';
      headerStock.textContent = '| LIMITED PRODUCT';
    } else {
      headerStock.className = 'text-green-600 font-semibold';
      headerStock.textContent = '| In Stock';
    }
  }

  function updateButtonStates(stock) {
    const disabled = stock === 0;
    if (addToCartBtn) addToCartBtn.disabled = disabled;
    if (buyNowBtn) buyNowBtn.disabled = disabled;
    if (qtyMinus) qtyMinus.disabled = disabled;
    if (qtyPlus) qtyPlus.disabled = disabled;
  }

  // initialize UI
  updateStockDisplay(currentStock);
  updateHeaderStock(currentStock);
  updateButtonStates(currentStock);

  // -------------------------
  // Size select change
  // -------------------------
  if (sizeSelect) {
    sizeSelect.addEventListener('change', function () {
      try {
        const opt = this.options[this.selectedIndex];
        const price = opt.dataset.price;
        const stock = parseInt(opt.dataset.stock || '0', 10) || 0;
        const size = opt.dataset.size || '';

        currentStock = stock;

        if (priceElement) priceElement.textContent = `₹${price}/-`;
        if (selectedSizeLabel) selectedSizeLabel.textContent = size;
        if (qtyInput) qtyInput.value = '1';

        updateStockDisplay(stock);
        updateHeaderStock(stock);
        updateButtonStates(stock);

        console.log("[productDetails] size changed — stock:", stock);
      } catch (err) {
        console.error("[productDetails] size change handler error:", err);
      }
    });
  }

  // -------------------------
  // Quantity controls
  // -------------------------
  if (qtyMinus) {
    qtyMinus.addEventListener('click', (e) => {
      e.preventDefault();
      try {
        const input = $('qty-input');
        let qty = parseInt(input.value || '1', 10) || 1;
        if (qty > 1) {
          input.value = (qty - 1).toString();
          console.log("[productDetails] qty decreased to", input.value);
        } else {
          console.log("[productDetails] qty already at minimum 1");
        }
      } catch (err) {
        console.error("[productDetails] qty-minus click error:", err);
      }
    });
  } else {
    console.warn("[productDetails] qty-minus button not found");
  }

  if (qtyPlus) {
    qtyPlus.addEventListener('click', (e) => {
      e.preventDefault();
      try {
        const input = $('qty-input');
        let qty = parseInt(input.value || '1', 10) || 1;
        const max = (Number.isFinite(currentStock) && currentStock > 0) ? currentStock : 9999;
        if (qty < max) {
          input.value = (qty + 1).toString();
          console.log("[productDetails] qty increased to", input.value);
        } else {
          console.log("[productDetails] reached max stock", max);
        }
      } catch (err) {
        console.error("[productDetails] qty-plus click error:", err);
      }
    });
  } else {
    console.warn("[productDetails] qty-plus button not found");
  }

  // -------------------------
  // Add to cart (guarded)
  // -------------------------
  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', async () => {
      const productId = $('product-id')?.value || null;
      const variantIndex = sizeSelect ? sizeSelect.value : 0;
      const qty = $('qty-input')?.value || '1';

      try {
        const response = await fetch("/addToCart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, variantIndex, qty })
        });

        const data = await response.json();

        if (data.success) {
          if (typeof Swal !== "undefined") {
            Swal.fire({
              icon: "success",
              title: "Added!",
              text: "Product added to cart successfully",
              showConfirmButton: false,
              timer: 1400
            });
          } else {
            console.log("[productDetails] added to cart:", data);
          }
        } else {
          if (typeof Swal !== "undefined") {
            Swal.fire({
              icon: "error",
              title: "Oops!",
              text: data.message || "Could not add to cart"
            });
          } else {
            console.error("[productDetails] addToCart failed:", data);
          }
        }

      } catch (err) {
        console.error("[productDetails] addToCart error:", err);
        if (typeof Swal !== "undefined") {
          Swal.fire({ icon: "error", title: "Error", text: "Something went wrong. Try again!" });
        }
      }
    });
  } else {
    console.warn("[productDetails] add-to-cart button not found");
  }

  console.log("[productDetails] initialized");
});
