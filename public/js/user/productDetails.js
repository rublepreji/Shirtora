document.addEventListener("DOMContentLoaded", () => {

    function showTab(tabName) {
        const descTab = document.getElementById('desc-tab');
        const reviewsTab = document.getElementById('reviews-tab');
        const descContent = document.getElementById('description-content');
        const reviewsContent = document.getElementById('reviews-content');

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


    window.changeImage = function (src) {
        document.getElementById("mainImage").src = src;
    };

    //Zoom function
    const mainImage = document.getElementById("mainImage");
    const zoomLens = document.getElementById("zoomLens");
    const zoomResult = document.getElementById("zoomResult");

    mainImage.parentElement.addEventListener("mouseenter", () => {
        zoomResult.innerHTML = `<img id="zoomedImg" src="${mainImage.src}">`;
    });

    mainImage.parentElement.addEventListener("mousemove", function (e) {
        const zoomedImg = document.getElementById("zoomedImg");
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

        const ratioX = zoomedImg.offsetWidth / mainImage.offsetWidth;
        const ratioY = zoomedImg.offsetHeight / mainImage.offsetHeight;

        zoomedImg.style.left = `${-lensX * ratioX}px`;
        zoomedImg.style.top = `${-lensY * ratioY}px`;
    });

    mainImage.parentElement.addEventListener("mouseleave", () => {
        zoomLens.classList.add("hidden");
        zoomResult.classList.add("hidden");
    });


    const sizeSelect = document.getElementById('size-select');
    const priceElement = document.getElementById('product-price');
    const stockMessage = document.getElementById('stock-message');
    const selectedSizeLabel = document.getElementById('selected-size-label');
    const qtyInput = document.getElementById('qty-input');
    const qtyMinus = document.getElementById('qty-minus');
    const qtyPlus = document.getElementById('qty-plus');
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    const buyNowBtn = document.getElementById('buy-now-btn');
    const headerStock = document.getElementById('header-stock');

    let currentStock = parseInt(sizeSelect.options[sizeSelect.selectedIndex].dataset.stock);

    function updateStockDisplay(stock) {
        if (stock === 0) {
            stockMessage.className = 'text-red-600 font-semibold';
            stockMessage.textContent = 'OUT OF STOCK';
        } else if (stock < 5) {
            stockMessage.className = 'text-red-600';
            stockMessage.innerHTML = `Remaining only <span>${stock}</span> products`;
        } else if (stock < 10) {
            stockMessage.className = 'text-orange-600';
            stockMessage.innerHTML = `Stock: <span>${stock}</span>`;
        } else {
            stockMessage.className = 'text-green-600';
            stockMessage.innerHTML = `Stock: <span>${stock}</span>`;
        }
    }

    function updateHeaderStock(stock) {
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
        addToCartBtn.disabled = disabled;
        buyNowBtn.disabled = disabled;
        qtyMinus.disabled = disabled;
        qtyPlus.disabled = disabled;
    }


    sizeSelect.addEventListener('change', function () {
        const opt = this.options[this.selectedIndex];

        const price = opt.dataset.price;
        const stock = parseInt(opt.dataset.stock);
        const size = opt.dataset.size;

        currentStock = stock;

        priceElement.textContent = `₹${price}/-`;
        selectedSizeLabel.textContent = size;

        qtyInput.value = 1;

        updateStockDisplay(stock);
        updateHeaderStock(stock);
        updateButtonStates(stock);
    });


    qtyMinus.addEventListener('click', () => {
        let qty = parseInt(qtyInput.value);
        if (qty > 1) qtyInput.value = qty - 1;
    });

    qtyPlus.addEventListener('click', () => {
        let qty = parseInt(qtyInput.value);
        if (qty < currentStock) qtyInput.value = qty + 1;
    });


    const productId = document.getElementById("product-id");

    addToCartBtn.addEventListener("click", async () => {

        const variantIndex = sizeSelect.value;
        const qty = qtyInput.value;

        try {
            const response = await fetch("/addToCart", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId: productId.value,
                    variantIndex,
                    qty
                })
            });

            const data = await response.json();
            console.log(data)

            if (data.success) {
                Swal.fire({
                    icon: "success",
                    title: "Added!",
                    text: "Product added to cart successfully",
                    showConfirmButton: false,
                    timer: 1400
                });
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Oops!",
                    text: data.message
                });
            }

        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "Something went wrong. Try again!"
            });
        }
    });

});
