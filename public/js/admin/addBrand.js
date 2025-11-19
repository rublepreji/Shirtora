const nameInput = document.getElementById('name');
    const descriptionInput = document.getElementById('description');
    const imageUpload = document.getElementById('imageUpload');
    const formSubmit = document.getElementById('submitForm');
    const errorName= document.getElementById('error-name')
    const errorDescription= document.getElementById('error-description')
    const errorImage= document.getElementById('error-image')

    function validateName(){
      const name= nameInput.value.trim()
      if(name===""){
        errorName.style.display="block"
        errorName.innerHTML="Name is required"
        return false
      } else if (!/^[A-Za-z][A-Za-z\s\-]{1,49}$/.test(name)) {
      errorName.style.display = "block";
      errorName.innerHTML = "Category name should contain only letters";
      return false;
    } else if (name.length>15){
      errorName.style.display = "block";
      errorName.innerHTML = "Text content is limited to ten letters";
      return false;
    }
    return true
    }
    function validateDescription(){
      const description= descriptionInput.value.trim()
      if (description === "") {
      errorDescription.style.display = "block";
      errorDescription.innerHTML = "Please enter a description";
      return false;
    }
    return true;
    }

    function validateImage() {
      if(!imageUpload.files || imageUpload.files.length==0){
        errorImage.style.display="block"
        errorImage.innerHTML="Image is required"
        return false
      }
      return true
    }

    imageUpload.addEventListener('change',()=>{
      const file= imageUpload.files[0]
      if(file){
        const preview= document.getElementById('Preview')
        preview.src= URL.createObjectURL(file)
      }
    })

    formSubmit.addEventListener('submit', async (e) => {
      e.preventDefault(); 

      errorName.style.display = "none";
      errorDescription.style.display = "none";
      const validName = validateName();
      const validDescription = validateDescription(); 
      const image= validateImage()

      if (!validName || !validDescription || !image) return;
   
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