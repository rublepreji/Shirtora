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

