/**
 * Global function for thumbnail clicks
 * Needs to be outside DOMContentLoaded so the HTML onclick can find it.
 */
function changeImage(src) {
    const mainImg = document.getElementById('mainImage');
    const zoomResult = document.getElementById('zoomResult');
    
    if (mainImg) {
        mainImg.src = src;
        // Trigger a background update for the zoom window immediately
        if (zoomResult) {
            zoomResult.style.backgroundImage = `url('${src}')`;
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("[productDetails] script loaded");

    const $ = (id) => document.getElementById(id);

    // Elements
    const sizeSelect = $("size-select");
    const priceElement = $("product-price");
    const originalPriceEl = document.querySelector(".strike-through");
    const stockMessage = $("stock-message");
    const selectedSizeLabel = $("selected-size-label");
    const qtyInput = $("qty-input");
    const qtyMinus = $("qty-minus");
    const qtyPlus = $("qty-plus");
    const addToCartBtn = $("add-to-cart-btn");
    const buyNowBtn = $("buy-now-btn");
    const headerStock = $("header-stock");

    // Offer logic
    const offerPercent = priceElement ? Number(priceElement.dataset.offer || 0) : 0;
    const calculateFinalPrice = (price, offer) => Math.round(price - (price * offer) / 100);

    // Stock UI Helpers
    function updateStockUI(stock) {
        if (!stockMessage) return;
        if (stock === 0) {
            stockMessage.className = "text-red-600 font-semibold";
            stockMessage.textContent = "OUT OF STOCK";
        } else if (stock < 5) {
            stockMessage.className = "text-red-600";
            stockMessage.innerHTML = `Remaining only <span>${stock}</span> products`;
        } else {
            stockMessage.className = "text-green-600";
            stockMessage.innerHTML = `Stock: <span>${stock}</span>`;
        }
    }

    // Initialize Size/Price
    let currentStock = 0;
    if (sizeSelect && sizeSelect.options.length > 0) {
        const opt = sizeSelect.options[sizeSelect.selectedIndex];
        currentStock = Number(opt.dataset.stock || 0);
        updateStockUI(currentStock);
    }

    // Size Change Listener
    sizeSelect?.addEventListener("change", function() {
        const opt = this.options[this.selectedIndex];
        const basePrice = Number(opt.dataset.price || 0);
        currentStock = Number(opt.dataset.stock || 0);
        
        if (priceElement) priceElement.textContent = `₹${calculateFinalPrice(basePrice, offerPercent)}/-`;
        if (originalPriceEl) originalPriceEl.textContent = `₹${basePrice}`;
        if (selectedSizeLabel) selectedSizeLabel.textContent = opt.dataset.size;
        
        qtyInput.value = "1";
        updateStockUI(currentStock);
    });

    // Quantity Logic
    qtyPlus?.addEventListener("click", () => {
        let val = parseInt(qtyInput.value);
        if (val < currentStock) qtyInput.value = val + 1;
    });
    qtyMinus?.addEventListener("click", () => {
        let val = parseInt(qtyInput.value);
        if (val > 1) qtyInput.value = val - 1;
    });

    // --- IMPROVED ZOOM LOGIC ---
    function initZoom() {
        const img = $("mainImage");
        const lens = $("zoomLens");
        const result = $("zoomResult");

        if (!img || !lens || !result) return;

        // Set the background image once
        result.style.backgroundImage = `url('${img.src}')`;

        const moveLens = (e) => {
            const rect = img.getBoundingClientRect();
            
            // Calculate magnification ratios
            const cx = result.offsetWidth / lens.offsetWidth;
            const cy = result.offsetHeight / lens.offsetHeight;

            // Set background size relative to ratios
            result.style.backgroundSize = `${img.width * cx}px ${img.height * cy}px`;

            // Calculate cursor position
            let x = e.clientX - rect.left;
            let y = e.clientY - rect.top;

            // Center lens on cursor
            x = x - (lens.offsetWidth / 2);
            y = y - (lens.offsetHeight / 2);

            // Boundaries
            if (x > img.width - lens.offsetWidth) x = img.width - lens.offsetWidth;
            if (x < 0) x = 0;
            if (y > img.height - lens.offsetHeight) y = img.height - lens.offsetHeight;
            if (y < 0) y = 0;

            // Apply positions
            lens.style.left = x + "px";
            lens.style.top = y + "px";
            result.style.backgroundPosition = `-${x * cx}px -${y * cy}px`;
        };

        const toggleZoom = (show) => {
            lens.classList.toggle('hidden', !show);
            result.classList.toggle('hidden', !show);
            // Refresh background in case thumbnail changed
            if (show) result.style.backgroundImage = `url('${img.src}')`;
        };

        img.addEventListener("mousemove", moveLens);
        lens.addEventListener("mousemove", moveLens);
        img.addEventListener("mouseenter", () => toggleZoom(true));
        img.addEventListener("mouseleave", () => toggleZoom(false));
    }

    initZoom();

    // Add To Cart Logic
    addToCartBtn?.addEventListener("click", async () => {
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
                Swal.fire({ icon: "success", title: "Added to cart", timer: 1200, showConfirmButton: false });
            } else {
                Swal.fire("Error", data.message || "Failed", "error");
            }
        } catch (err) {
            Swal.fire("Error", "Something went wrong", "error");
        }
    });
}); 