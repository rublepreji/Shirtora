async function removeImage(imageId, productId) {
          console.log('remove btn pressed');
          console.log(imageId,' ',productId);
          
          
          const response = await fetch(`/admin/removeimg?imageid=${encodeURIComponent(imageId)}&productid=${productId}`, {
            method: "delete",
          });
          const data = await response.json();
          if (data.success){
          Swal.fire({
              icon: "success",
              title: "Updated!",
              text: data.message || "Image removed!",
              showConfirmButton: false,
              timer: 2000,
            });
            setTimeout(()=>window.location.reload(),1400)
          } 
          else{
            Swal.fire({
                icon: "error",
                title: "Failed",
                text: data.message || "Failed to remove image!",
              });
          }
        }
        
        const form = document.getElementById("productForm");
        const fileInputs = ["img1", "img2", "img3", "img4"];
        const croppedImages = {};

        form.addEventListener("submit", async (e) => {
          e.preventDefault();

          // Collect values
          const name = document.getElementById("productName").value.trim();
          const desc = document.getElementById("description").value.trim();
          const cat = document.getElementById("category").value.trim();
          const brand = document.getElementById("brand").value.trim();
          const color = document.getElementById("color").value.trim();

          const variants = [...document.querySelectorAll(".variant")].map((v) => ({
            size: v.querySelector(".variant-size").value,
            price: v.querySelector(".variant-price").value,
            stock: v.querySelector(".variant-stock").value,
          }));

          // Prepare form data
          const payload = {
            productId: originalProduct.id,
            productName: name,
            description: desc,
            category: cat,
            brand: brand,
            colour: color,
            variants 
          };
          try{
          const res = await fetch("/admin/editproduct", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
            const data = await res.json();

            if (data.success) {
              Swal.fire({
                icon: "success",
                title: "Updated!",
                text: data.message || "Product updated successfully!",
                showConfirmButton: false,
                timer: 2000,
              });
            } else {
              Swal.fire({
                icon: "error",
                title: "Failed",
                text: data.message || "Failed to update product!",
              });
            }
          } catch (err) {
            console.error("Error:", err);
            Swal.fire({
              icon: "error",
              title: "Network error",
              text: "Something went wrong while updating.",
            });
          }
        });
  let cropper;
  const cropperModal = document.getElementById("cropperModal");
  const cropperImage = document.getElementById("cropperImage");
  const cropImageBtn = document.getElementById("cropImageBtn");
  const closeCropper = document.getElementById("closeCropper");
  let currentPreviewId = null;

  function handleImageBrowse(event, previewId, index) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      cropperImage.src = e.target.result;
      cropperModal.classList.remove("hidden");
      cropper = new Cropper(cropperImage, {
        aspectRatio: 3 / 4,
        viewMode: 1,
      });
      currentPreviewId = previewId;
    };
    reader.readAsDataURL(file);
  }

  cropImageBtn.addEventListener("click", async () => {
    if (!cropper) return;

    cropper.getCroppedCanvas().toBlob(async (blob) => {
      const preview = document.getElementById(currentPreviewId);
      const url = URL.createObjectURL(blob);
      preview.src = url;

      const key = currentPreviewId.replace("Preview", "");
      croppedImages[key] = blob;

      cropper.destroy();
      cropper = null;
      cropperModal.classList.add("hidden");

    
      try {
        const formData = new FormData();
        formData.append("productId", originalProduct.id);
        formData.append("imageIndex", key.replace("img", "")); 
        formData.append("image", blob, `${key}.jpg`);

        const res = await fetch("/admin/imagechanges", {
          method: "put",
          body:formData
        });

        const data = await res.json();
        if (data.success) {
          Swal.fire({
            icon: "success",
            title: "Image Updated",
            text: data.message || "Product image updated successfully!",
            showConfirmButton: false,
            timer: 2000,
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Image Update Failed",
            text: data.message || "Unable to update image!",
          });
        }
      } catch (err) {
        console.error("Error updating image:", err);
        Swal.fire({
          icon: "error",
          title: "Network Error",
          text: "Something went wrong while updating the image.",
        });
      }
    }, "image/jpeg");
  });
