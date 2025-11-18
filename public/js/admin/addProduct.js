const form = document.getElementById("productForm");
let currentImageInput = null;
let cropper = null;
const modal = document.getElementById("cropperModal");
const cropperImage = document.getElementById("cropperImage");

// Temporary store for cropped image blobs
const croppedImages = {};

// --- Handle Variants ---
document.getElementById("addVariantBtn").addEventListener("click", () => {
  const section = document.getElementById("variantSection");
  const newVariant = document.querySelector(".variant").cloneNode(true);
  newVariant.querySelectorAll("select").forEach((sel) => (sel.value = ""));
  section.appendChild(newVariant);
});

// --- Image Upload & Cropper ---
const fileInputs = ["img1", "img2", "img3", "img4"];
fileInputs.forEach((id) => {
  const input = document.getElementById(id);
  input.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      cropperImage.src = reader.result;
      modal.classList.remove("hidden");
      modal.classList.add("flex");

      if (cropper) cropper.destroy();
      cropper = new Cropper(cropperImage, {
        aspectRatio: 3 / 4,
        viewMode: 2,
        dragMode: "move",
        responsive: true,
      });

      currentImageInput = id;
    };
    reader.readAsDataURL(file);
  });
});

// Close Modal
document.getElementById("closeCropper").addEventListener("click", () => {
  modal.classList.add("hidden");
  if (cropper) cropper.destroy();
});

// Crop & Save
document.getElementById("cropImageBtn").addEventListener("click", () => {
  if (!cropper || !currentImageInput) return;
  const canvas = cropper.getCroppedCanvas({ width: 400, height: 533 });
  const preview = document.getElementById(currentImageInput + "Preview");
  preview.src = canvas.toDataURL("image/jpeg");

  // Convert base64 to blob for upload
  canvas.toBlob((blob) => {
    croppedImages[currentImageInput] = blob;
  }, "image/jpeg");

  modal.classList.add("hidden");
  cropper.destroy();
});

// --- Form Validation + Submit ---
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  document.querySelectorAll("p.text-red-500").forEach((el) => el.classList.add("hidden"));
  let valid = true;

  const name = document.getElementById("productName").value.trim();
  const desc = document.getElementById("description").value.trim();
  const cat = document.getElementById("category").value.trim();
  const brand = document.getElementById("brand").value.trim();
  const color = document.getElementById("color").value.trim();
  const variants = document.querySelectorAll(".variant");

  if (name === "") { showError("nameError", "Product name is required."); valid = false; }
  if (desc === "") { showError("descError", "Description is required."); valid = false; }
  if (cat === "") { showError("catError", "Please select a category."); valid = false; }
  if (brand === "") { showError("brandError", "Please select a brand."); valid = false; }
  if (color === "") { showError("colorError", "Color is required."); valid = false; }

  let variantList = [];
  let variantValid = true;
  variants.forEach((v) => {
    const size = v.querySelector(".variant-size").value;
    const price = v.querySelector(".variant-price").value;
    const stock = v.querySelector(".variant-stock").value;
    if (!size || !price || !stock) variantValid = false;
    else variantList.push({ size, price, stock });
  });

  if (!variantValid) {
    showError("variantError", "All variant fields must be selected.");
    valid = false;
  }

  // Image validation
  if (Object.keys(croppedImages).length === 0) {
    showError("imgError", "Please upload and crop at least one image.");
    valid = false;
  }

  if (!valid) return;

  // Prepare FormData
  const formData = new FormData();
  formData.append("name", name);
  formData.append("description", desc);
  formData.append("category", cat);
  formData.append("brand", brand);
  formData.append("color", color);
  formData.append("variants", JSON.stringify(variantList));

  // Append cropped images
  Object.entries(croppedImages).forEach(([key, blob], index) => {
    formData.append("images", blob, `image${index + 1}.jpg`);
  });

  // Send to backend
  try {
    const res = await fetch("/admin/addproduct", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (data.success) {
      Swal.fire({
        icon: "success",
        title: "Success!",
        text: data.message || "Product added successfully!",
        showConfirmButton: false,
        timer: 2000,
      });
      form.reset();
      fileInputs.forEach((id) => {
        document.getElementById(id + "Preview").src = "https://via.placeholder.com/150";
      });
    } else {
      Swal.fire({
          icon: "error",
          title: "Oops...",
          text: data.message || "Failed to add product!",
        });
    }
  } catch (err) {
    console.error("Upload error:", err);
    Swal.fire({
      icon: "error",
      title: "Error!",
      text: "Network error or server unreachable!",
    });
  }
});

function showError(id, message) {
  const el = document.getElementById(id);
  el.textContent = message;
  el.classList.remove("hidden");
}