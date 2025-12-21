// /js/user/productDetails.js
document.addEventListener("DOMContentLoaded", () => {
  console.log("[productDetails] script loaded");

  const $ = (id) => document.getElementById(id);

  // -------------------------
  // Elements
  // -------------------------
  const sizeSelect = $("size-select");
  const priceElement = $("product-price");            // discounted price
  const originalPriceEl = document.querySelector(".strike-through"); // original price
  const stockMessage = $("stock-message");
  const selectedSizeLabel = $("selected-size-label");

  const qtyInput = $("qty-input");
  const qtyMinus = $("qty-minus");
  const qtyPlus = $("qty-plus");

  const addToCartBtn = $("add-to-cart-btn");
  const buyNowBtn = $("buy-now-btn");
  const headerStock = $("header-stock");

  // -------------------------
  // OFFER
  // -------------------------
  const offerPercent = priceElement
    ? Number(priceElement.dataset.offer || 0)
    : 0;

  console.log("[productDetails] offer percent:", offerPercent);

  function calculateFinalPrice(price, offer) {
    const p = Number(price) || 0;
    const o = Number(offer) || 0;
    return Math.round(p - (p * o) / 100);
  }

  // -------------------------
  // STOCK UI HELPERS
  // -------------------------
  function updateStockDisplay(stock) {
    if (!stockMessage) return;

    if (stock === 0) {
      stockMessage.className = "text-red-600 font-semibold";
      stockMessage.textContent = "OUT OF STOCK";
    } else if (stock < 5) {
      stockMessage.className = "text-red-600";
      stockMessage.innerHTML = `Remaining only <span>${stock}</span> products`;
    } else if (stock < 10) {
      stockMessage.className = "text-orange-600";
      stockMessage.innerHTML = `Stock: <span>${stock}</span>`;
    } else {
      stockMessage.className = "text-green-600";
      stockMessage.innerHTML = `Stock: <span>${stock}</span>`;
    }
  }

  function updateHeaderStock(stock) {
    if (!headerStock) return;

    if (stock === 0) {
      headerStock.textContent = "| OUT OF STOCK";
      headerStock.className = "text-red-600 font-semibold";
    } else if (stock < 5) {
      headerStock.textContent = "| LIMITED PRODUCT";
      headerStock.className = "text-orange-600 font-semibold";
    } else {
      headerStock.textContent = "| In Stock";
      headerStock.className = "text-green-600 font-semibold";
    }
  }

  function updateButtonStates(stock) {
    const disabled = stock === 0;
    if (addToCartBtn) addToCartBtn.disabled = disabled;
    if (buyNowBtn) buyNowBtn.disabled = disabled;
    if (qtyMinus) qtyMinus.disabled = disabled;
    if (qtyPlus) qtyPlus.disabled = disabled;
  }

  // -------------------------
  // INITIAL LOAD
  // -------------------------
  let currentStock = 0;

  if (sizeSelect && sizeSelect.selectedIndex >= 0) {
    const opt = sizeSelect.options[sizeSelect.selectedIndex];
    currentStock = Number(opt.dataset.stock || 0);

    const basePrice = Number(opt.dataset.price || 0);
    const finalPrice = calculateFinalPrice(basePrice, offerPercent);

    if (priceElement) priceElement.textContent = `₹${finalPrice}/-`;
    if (originalPriceEl) originalPriceEl.textContent = `₹${basePrice}`;
  }

  updateStockDisplay(currentStock);
  updateHeaderStock(currentStock);
  updateButtonStates(currentStock);

  // -------------------------
  // SIZE CHANGE (THIS IS WHAT YOU WANTED)
  // -------------------------
  if (sizeSelect) {
    sizeSelect.addEventListener("change", function () {
      const opt = this.options[this.selectedIndex];

      const basePrice = Number(opt.dataset.price || 0);
      const stock = Number(opt.dataset.stock || 0);
      const size = opt.dataset.size || "";

      currentStock = stock;

      // 🔥 Apply offer
      const finalPrice = calculateFinalPrice(basePrice, offerPercent);

      // 🔥 Update UI
      if (priceElement) {
        priceElement.textContent = `₹${finalPrice}/-`;
      }

      if (originalPriceEl) {
        originalPriceEl.textContent = `₹${basePrice}`;
      }

      if (selectedSizeLabel) {
        selectedSizeLabel.textContent = size;
      }

      if (qtyInput) qtyInput.value = "1";

      updateStockDisplay(stock);
      updateHeaderStock(stock);
      updateButtonStates(stock);

      console.log("[productDetails] size changed", {
        size,
        basePrice,
        offerPercent,
        finalPrice,
        stock,
      });
    });
  }

  // -------------------------
  // QUANTITY
  // -------------------------
  if (qtyMinus) {
    qtyMinus.addEventListener("click", () => {
      let qty = Number(qtyInput.value || 1);
      if (qty > 1) qtyInput.value = qty - 1;
    });
  }

  if (qtyPlus) {
    qtyPlus.addEventListener("click", () => {
      let qty = Number(qtyInput.value || 1);
      if (qty < currentStock) qtyInput.value = qty + 1;
    });
  }

  // -------------------------
  // ADD TO CART
  // -------------------------
  if (addToCartBtn) {
    addToCartBtn.addEventListener("click", async () => {
      const productId = $("product-id")?.value;
      const variantIndex = sizeSelect?.value || 0;
      const qty = qtyInput?.value || 1;

      try {
        const res = await fetch("/addToCart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, variantIndex, qty }),
        });

        const data = await res.json();

        if (data.success) {
          Swal.fire({
            icon: "success",
            title: "Added to cart",
            timer: 1200,
            showConfirmButton: false,
          });
        } else {
          Swal.fire("Error", data.message || "Failed", "error");
        }
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "Something went wrong", "error");
      }
    });
  }

  console.log("[productDetails] initialized successfully");
});
