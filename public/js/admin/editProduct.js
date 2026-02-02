// =========================
// VALIDATION HELPERS
// =========================
function showError(id, msg) {
  const el = document.getElementById(id);
  el.innerText = msg;
  el.classList.remove("hidden");
}

function hideError(id) {
  document.getElementById(id).classList.add("hidden");
}

// =========================
// VALIDATION FUNCTION
// =========================
function validateForm() {
  let valid = true;

  const name = productName.value.trim();
  const descText = description.value.trim();
  const colorValue = color.value.trim();
  const colorRegex = /^[A-Za-z\s]+$/;

  // Product Name
  if (name.length < 3) {
    showError("nameError", "Product name must be at least 3 characters.");
    valid = false;
  } else hideError("nameError");

  // Description
  if (descText.length < 10) {
    showError("descError", "Description must be at least 10 characters.");
    valid = false;
  } else hideError("descError");

  // Category
  if (!category.value.trim()) {
    showError("catError", "Please select a category.");
    valid = false;
  } else hideError("catError");

  // Brand
  if (!brand.value.trim()) {
    showError("brandError", "Please select a brand.");
    valid = false;
  } else hideError("brandError");

  // Color
  if (!colorRegex.test(colorValue)) {
    showError("colorError", "Colour must contain only letters.");
    valid = false;
  } else hideError("colorError");

  // Variants
  const variants = document.querySelectorAll(".variant");

  if (variants.length === 0) {
    showError("variantError", "At least 1 variant is required.");
    valid = false;
  } else {
    hideError("variantError");

    variants.forEach((v, i) => {
  const price = v.querySelector(".variant-price").value.trim();
  const stock = v.querySelector(".variant-stock").value.trim();

  // PRICE validation (minimum 10)
  if (
    price === "" ||
    isNaN(price) ||
    Number(price) < 10
  ) {
    showError(
      "variantError",
      `Variant ${i + 1}: Price must be at least 10.`
    );
    valid = false;
  }

  // STOCK validation (only positive integers)
  if (
    stock === "" ||
    isNaN(stock) ||
    Number(stock) <= 0 ||
    !Number.isInteger(Number(stock))
  ) {
    showError(
      "variantError",
      `Variant ${i + 1}: Stock must be a positive whole number.`
    );
    valid = false;
  }
});

  }

  return valid;
}

// =========================
// FORM SUBMIT
// =========================
const form = document.getElementById("productForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!validateForm()) return;

  const payload = {
    productId: originalProduct.id,
    productName: productName.value.trim(),
    description: description.value.trim(),
    category: category.value.trim(),
    brand: brand.value.trim(),
    colour: color.value.trim(),
    variants: [...document.querySelectorAll(".variant")].map((v) => ({
      size: v.querySelector(".variant-size").value,
      price: v.querySelector(".variant-price").value,
      stock: v.querySelector(".variant-stock").value,
    })),
  };

  try {
    const res = await fetch("/admin/editproduct", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (data.success) {
      Swal.fire({
        icon: "success",
        title: "Updated!",
        text: "Product updated successfully",
        showConfirmButton: false,
        timer: 2000,
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: data.message || "Update failed",
      });
    }
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Network error",
      text: "Something went wrong.",
    });
  }
});



// image cropper
let cropper;
const cropperModal = document.getElementById("cropperModal");
const cropperImage = document.getElementById("cropperImage");
const cropButton = document.getElementById("cropImageBtn");
let currentPreviewId = null;

window.handleImageBrowse = function (event, previewId) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    cropperImage.src = reader.result;
    cropperModal.classList.remove("hidden");

    cropper = new Cropper(cropperImage, {
      aspectRatio: 3 / 4,
      viewMode: 1,
    });

    currentPreviewId = previewId;
  };
  reader.readAsDataURL(file);
};

cropButton.addEventListener("click", () => {
  if (!cropper) return;

  cropper.getCroppedCanvas().toBlob(async (blob) => {
    const preview = document.getElementById(currentPreviewId);
    preview.src = URL.createObjectURL(blob);

    const key = currentPreviewId.replace("Preview", "");

    const formData = new FormData();
    formData.append("productId", originalProduct.id);
    formData.append("imageIndex", key.replace("img", ""));
    formData.append("image", blob, `${key}.jpg`);

    const res = await fetch("/admin/imagechanges", {
      method: "PUT",
      body: formData,
    });

    const data = await res.json();

    if (data.success) {
      Swal.fire({
        icon: "success",
        title: "Image Updated",
        showConfirmButton: false,
        timer: 1500,
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: data.message,
      });
    }

    cropper.destroy();
    cropper = null;
    cropperModal.classList.add("hidden");
  });
});

// =========================
// DELETE IMAGE (MIN 3)
// =========================

async function deleteImage(imageUrl, index) {
  const totalImages = document.querySelectorAll('[id$="Preview"]').length;

  if (totalImages <= 3) {
    Swal.fire({
      icon: "warning",
      title: "Minimum 3 images required",
    });
    return;
  }

  const confirm = await Swal.fire({
    title: "Delete this image?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete",
  });

  if (!confirm.isConfirmed) return;

  try {
    const res = await fetch("/admin/deleteimage", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: originalProduct.id,
        image: imageUrl,
      }),
    });

    const data = await res.json();

    if (data.success) {
      document.getElementById(`img${index}Preview`).remove();

      Swal.fire({
        icon: "success",
        title: "Deleted",
        timer: 1000,
        showConfirmButton: false,
      });

      location.reload(); // refresh previews
    } else {
      Swal.fire({
        icon: "error",
        text: data.message,
      });
    }
  } catch {
    Swal.fire({
      icon: "error",
      text: "Something went wrong",
    });
  }
}


// =========================
// ADD MORE VARIANTS (MAX 3)
// =========================

const addVariantBtn = document.getElementById("addVariantBtn");
const variantSection = document.getElementById("variantSection");

const MAX_VARIANTS = 3;

addVariantBtn.addEventListener("click", () => {
  const existingVariants = document.querySelectorAll(".variant").length;

  if (existingVariants >= MAX_VARIANTS) {
    Swal.fire({
      icon: "warning",
      title: "Limit reached",
      text: "You can add maximum 3 variants only.",
    });
    return;
  }

  const div = document.createElement("div");
  div.className = "grid grid-cols-3 gap-4 variant";

  div.innerHTML = `
    <div>
      <label class="block text-sm font-medium text-gray-700">Size</label>
      <select class="variant-size w-full mt-1 border border-gray-300 rounded-md px-3 py-2">
        <option value="">Select</option>
        <option>S</option>
        <option>M</option>
        <option>L</option>
        <option>XL</option>
      </select>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700">Price</label>
      <input
        type="text"
        placeholder="Price"
        class="variant-price w-full mt-1 border border-gray-300 rounded-md px-3 py-2"
      />
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700">Stock</label>
      <input
        type="text"
        placeholder="Stock"
        class="variant-stock w-full mt-1 border border-gray-300 rounded-md px-3 py-2"
      />
    </div>
  `;

  variantSection.appendChild(div);
});



