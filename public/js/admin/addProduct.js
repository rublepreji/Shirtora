// /js/admin/addProduct.js  (copy-paste overwrite)
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
  const prototype = document.querySelector(".variant");
  if (!prototype) return;
  const newVariant = prototype.cloneNode(true);
  // clear values in the cloned row
  newVariant.querySelectorAll("select, input").forEach((el) => (el.value = ""));
  section.appendChild(newVariant);
});

// --- Image Upload ---
const fileInputs = ["img1", "img2", "img3", "img4"];
fileInputs.forEach((id) => {
  const input = document.getElementById(id);
  if (!input) return;
  input.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // basic type check
    if (!file.type.startsWith("image/")) {
      showError("imgError", "Please select a valid image file.");
      return;
    } else {
      // hide imgError if previously shown
      const imgErr = document.getElementById("imgError");
      if (imgErr) imgErr.classList.add("hidden");
    }

    const reader = new FileReader();
    reader.onload = () => {
      cropperImage.src = reader.result;
      modal.classList.remove("hidden");
      modal.classList.add("flex");

      if (cropper) {
        try { cropper.destroy(); } catch (err) { /* ignore */ }
      }
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
  if (cropper) {
    try { cropper.destroy(); } catch (err) {}
    cropper = null;
  }
  currentImageInput = null;
});

// helper: convert canvas to blob (returns Promise)
function canvasToBlobAsync(canvas, type = "image/jpeg", quality = 0.9) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

// Crop & Save (uses async blob creation so blob is ready before continuing)
document.getElementById("cropImageBtn").addEventListener("click", async () => {
  if (!cropper || !currentImageInput) return;
  try {
    const canvas = cropper.getCroppedCanvas({ width: 400, height: 533 });
    if (!canvas) throw new Error("Could not get cropped canvas");

    // set preview immediately
    const preview = document.getElementById(currentImageInput + "Preview");
    if (preview) preview.src = canvas.toDataURL("image/jpeg");

    // create blob and store it
    const blob = await canvasToBlobAsync(canvas, "image/jpeg", 0.9);
    if (blob) {
      croppedImages[currentImageInput] = blob;
      // optional debug:
      // console.log("Stored blob:", currentImageInput, blob.size);
    } else {
      showError("imgError", "Failed to crop image. Try again with another image.");
    }
  } catch (err) {
    console.error("Crop & save error:", err);
    showError("imgError", "Could not crop image. Try again.");
  } finally {
    modal.classList.add("hidden");
    if (cropper) {
      try { cropper.destroy(); } catch (err) {}
      cropper = null;
    }
    currentImageInput = null;
  }
});

// ---------- Validation helpers ----------
function showError(id, message) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message;
  el.classList.remove("hidden");
}

function hideError(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = "";
  el.classList.add("hidden");
}

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}
function isPositiveNumberString(v) {
  if (!isNonEmptyString(v)) return false;
  const n = Number(v);
  return Number.isFinite(n) && n > 0;
}
function isNonNegativeIntegerString(v) {
  if (!isNonEmptyString(v)) return false;
  const n = Number(v);
  return Number.isInteger(n) && n >= 0;
}

// ---------- Form Validation & Submit ----------
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // hide previous errors
  document.querySelectorAll("p.text-red-500").forEach((el) => el.classList.add("hidden"));

  let valid = true;

  const name = document.getElementById("productName").value.trim();
  const desc = document.getElementById("description").value.trim();
  const cat = document.getElementById("category").value.trim();
  const brand = document.getElementById("brand").value.trim();
  const color = document.getElementById("color").value.trim();
  const variants = document.querySelectorAll(".variant");

  if (!isNonEmptyString(name)) { showError("nameError", "Product name is required."); valid = false; }
  if (!isNonEmptyString(desc)) { showError("descError", "Description is required."); valid = false; }
  if (!isNonEmptyString(cat)) { showError("catError", "Please select a category."); valid = false; }
  if (!isNonEmptyString(brand)) { showError("brandError", "Please select a brand."); valid = false; }
  if (!isNonEmptyString(color)) { showError("colorError", "Color is required."); valid = false; }

  // Validate variants
  let variantList = [];
  let variantValid = true;
  if (!variants || variants.length === 0) {
    showError("variantError", "At least one variant is required.");
    variantValid = false;
  } else {
    variants.forEach((v, idx) => {
      const sizeEl = v.querySelector(".variant-size");
      const priceEl = v.querySelector(".variant-price");
      const stockEl = v.querySelector(".variant-stock");

      const size = sizeEl?.value || "";
      const price = priceEl?.value || "";
      const stock = stockEl?.value || "";

      if (!size) {
        variantValid = false;
        showError("variantError", `Variant ${idx + 1}: size is required.`);
      } else if (!isPositiveNumberString(price)) {
        variantValid = false;
        showError("variantError", `Variant ${idx + 1}: price must be a positive number.`);
      } else if (!isNonNegativeIntegerString(stock)) {
        variantValid = false;
        showError("variantError", `Variant ${idx + 1}: stock must be 0 or a positive integer.`);
      } else {
        // valid row
        variantList.push({ size: size.trim(), price: Number(price), stock: Number(stock) });
      }
    });
  }

  if (!variantValid) valid = false;

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
  // NOTE: your original code used "images" — keep same name. If your backend expects "images[]", change field name accordingly.
  let imgIndex = 0;
  Object.entries(croppedImages).forEach(([key, blob]) => {
    imgIndex++;
    formData.append("images", blob, `image${imgIndex}.jpg`);
  });

  // Send to backend
  try {
    const res = await fetch("/admin/addproduct", {
      method: "POST",
      body: formData,
    });

    // try to parse JSON (backend should return json)
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
      // reset previews
      fileInputs.forEach((id) => {
        const preview = document.getElementById(id + "Preview");
        if (preview) preview.src = "https://via.placeholder.com/150";
      });
      // clear cropped images store
      Object.keys(croppedImages).forEach(k => delete croppedImages[k]);
      // remove extra variants (keep the first)
      const variantSection = document.getElementById("variantSection");
      const allVariants = variantSection.querySelectorAll(".variant");
      for (let i = allVariants.length - 1; i >= 1; i--) allVariants[i].remove();
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
