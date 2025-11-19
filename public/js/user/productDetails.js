document.addEventListener("DOMContentLoaded",()=>{
    function showTab(tabName) {
    const descTab = document.getElementById('desc-tab');
    const reviewsTab = document.getElementById('reviews-tab');

    const descContent = document.getElementById('description-content');
    const reviewsContent = document.getElementById('reviews-content');

    if (tabName === 'description') {
        descTab.classList.add('tab-active');
        descTab.classList.remove('hover:text-black');
        reviewsTab.classList.remove('tab-active');
        reviewsTab.classList.add('hover:text-black');

        descContent.classList.remove('hidden');
        reviewsContent.classList.add('hidden');
    } else if (tabName === 'reviews') {
        reviewsTab.classList.add('tab-active');
        reviewsTab.classList.remove('hover:text-black');
        descTab.classList.remove('tab-active');
        descTab.classList.add('hover:text-black');

        reviewsContent.classList.remove('hidden');
        descContent.classList.add('hidden');
    }
}
        const qtyInput = document.getElementById('qty-input');
        if (qtyInput.value === '2') {
        qtyInput.value = '1';
        }
window.changeImage=function(src) {
document.getElementById("mainImage").src = src;

}

//Zoom        

//Zoom        
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

    if (lensX < 0) lensX = 0;
    if (lensY < 0) lensY = 0;
    if (lensX > bounds.width - zoomLens.offsetWidth) lensX = bounds.width - zoomLens.offsetWidth;
    if (lensY > bounds.height - zoomLens.offsetHeight) lensY = bounds.height - zoomLens.offsetHeight;

    zoomLens.style.left = `${lensX}px`;
    zoomLens.style.top = `${lensY}px`;

    // ---- REAL ZOOM RATIO FIX ----
    const ratioX = zoomedImg.offsetWidth / mainImage.offsetWidth;
    const ratioY = zoomedImg.offsetHeight / mainImage.offsetHeight;

    zoomedImg.style.left = `${-lensX * ratioX}px`;
    zoomedImg.style.top = `${-lensY * ratioY}px`;
});

mainImage.parentElement.addEventListener("mouseleave", () => {
    zoomLens.classList.add("hidden");
    zoomResult.classList.add("hidden");
});

})

// Size selection handler
document.addEventListener('DOMContentLoaded', function() {
    const sizeSelect = document.getElementById('size-select');
    const priceElement = document.getElementById('product-price');
    const stockMessage = document.getElementById('stock-message');
    const stockCount = document.getElementById('stock-count');
    const selectedSizeLabel = document.getElementById('selected-size-label');
    const qtyInput = document.getElementById('qty-input');
    const qtyMinus = document.getElementById('qty-minus');
    const qtyPlus = document.getElementById('qty-plus');
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    const buyNowBtn = document.getElementById('buy-now-btn');
    
    let currentStock = parseInt(sizeSelect.options[sizeSelect.selectedIndex].dataset.stock);
    
    // Update display based on selected size
    sizeSelect.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        const price = selectedOption.dataset.price;
        const stock = parseInt(selectedOption.dataset.stock);
        const size = selectedOption.dataset.size;
        
        currentStock = stock;
        
        // Update price
        priceElement.textContent = `₹${price}/-`;
        
        // Update selected size label
        selectedSizeLabel.textContent = size;
        
        // Update stock message
        updateStockDisplay(stock);
        
        // Reset quantity to 1
        qtyInput.value = 1;
        
        // Update button states
        updateButtonStates(stock);
    });
    
    function updateStockDisplay(stock) {
        if (stock === 0) {
            stockMessage.className = 'text-red-600 leading-relaxed font-semibold';
            stockMessage.innerHTML = 'OUT OF STOCK';
        } else if (stock < 5) {
            stockMessage.className = 'text-red-600 leading-relaxed';
            stockMessage.innerHTML = `Remaining only <span id="stock-count">${stock}</span> products`;
        } else if (stock >= 5 && stock < 10) {
            stockMessage.className = 'text-orange-600 leading-relaxed';
            stockMessage.innerHTML = `Stock: <span id="stock-count">${stock}</span>`;
        } else {
            stockMessage.className = 'text-green-600 leading-relaxed';
            stockMessage.innerHTML = `Stock: <span id="stock-count">${stock}</span>`;
        }
    }
    
    function updateButtonStates(stock) {
        if (stock === 0) {
            addToCartBtn.disabled = true;
            buyNowBtn.disabled = true;
            qtyMinus.disabled = true;
            qtyPlus.disabled = true;
        } else {
            addToCartBtn.disabled = false;
            buyNowBtn.disabled = false;
            qtyMinus.disabled = false;
            qtyPlus.disabled = false;
        }
    }
    
    // Quantity controls
    qtyMinus.addEventListener('click', function() {
        let qty = parseInt(qtyInput.value);
        if (qty > 1) {
            qtyInput.value = qty - 1;
        }
    });
    
    qtyPlus.addEventListener('click', function() {
        let qty = parseInt(qtyInput.value);
        if (qty < currentStock) {
            qtyInput.value = qty + 1;
        }
    });
    
    // Initial button state check
    updateButtonStates(currentStock);
});

// Add this inside the change event listener
const headerStock = document.getElementById('header-stock');
if (stock === 0) {
    headerStock.className = 'text-red-600 font-semibold ml-auto lg:ml-0';
    headerStock.textContent = '| OUT OF STOCK';
} else if (stock < 5) {
    headerStock.className = 'text-orange-600 font-semibold ml-auto lg:ml-0';
    headerStock.textContent = '| LIMITED PRODUCT';
} else {
    headerStock.className = 'text-green-600 font-semibold ml-auto lg:ml-0';
    headerStock.textContent = '| In Stock';
}