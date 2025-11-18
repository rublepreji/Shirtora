const nameInput = document.getElementById('name');
    const descriptionInput = document.getElementById('description');
    const imageUpload = document.getElementById('imageUpload');
    const formSubmit = document.getElementById('submitForm');

    imageUpload.addEventListener('change',()=>{
      const file= imageUpload.files[0]
      if(file){
        const preview= document.getElementById('Preview')
        preview.src= URL.createObjectURL(file)
      }
    })

    formSubmit.addEventListener('submit', async (e) => {
      e.preventDefault(); // stop normal form submit

      let isValid = true;
      if (nameInput.value.trim() === "") isValid = false;
      if (descriptionInput.value.trim() === "") isValid = false;
      if (imageUpload.files.length === 0) isValid = false;

      if (!isValid) {
        Swal.fire({
          icon: "warning",
          title: "Please fill all fields",
        });
        return;
      }

      const formData = new FormData();
      formData.append("name", nameInput.value.trim());
      formData.append("description", descriptionInput.value.trim());
      formData.append("image", imageUpload.files[0]);

      try {
        const response = await fetch("/admin/postaddbrand", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (response.ok) {
          Swal.fire({
            icon: "success",
            title: "Success!",
            text: result.message || "Brand added successfully!",
            showConfirmButton: false,
            timer: 2000,
          });

          // Optional: clear form after success
          formSubmit.reset();
        } else {
          Swal.fire({
            icon: "error",
            title: "Error!",
            text: result.message || "Failed to add brand.",
          });
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Something went wrong!",
        });
      }
    });