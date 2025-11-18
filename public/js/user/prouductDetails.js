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
    
document.addEventListener('DOMContentLoaded', () => {
        const qtyInput = document.getElementById('qty-input');
        if (qtyInput.value === '2') {
        qtyInput.value = '1';
        }
});

function changeImage(src) {
document.getElementById("mainImage").src = src;

}

//Zoom        
const mainImage = document.getElementById("mainImage");
const zoomLens = document.getElementById("zoomLens");

mainImage.parentElement.addEventListener("mousemove", function (e) {
    const bounds = this.getBoundingClientRect();
    
    const x = e.clientX - bounds.left;
    const y = e.clientY - bounds.top;

    zoomLens.style.left = `${x - zoomLens.offsetWidth / 2}px`;
    zoomLens.style.top = `${y - zoomLens.offsetHeight / 2}px`;
    zoomLens.classList.remove("hidden");

    
    const zoomLevel = 2; 
    mainImage.style.transformOrigin = `${x}px ${y}px`;
    mainImage.style.transform = `scale(${zoomLevel})`;
});

mainImage.parentElement.addEventListener("mouseleave", function () {
    zoomLens.classList.add("hidden");
    mainImage.style.transform = "scale(1)";
});