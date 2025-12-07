document.getElementById('profile-image-upload').addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                // Check if the file is an image (optional, but good practice)
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    
                    reader.onload = function(e) {
                        // Update the src attribute of the image tag
                        document.getElementById('imagePreview').src = e.target.result;
                    };
                    
                    // Read the file as a data URL (Base64 string)
                    reader.readAsDataURL(file);
                } else {
                    alert('Please select a valid image file.');
                    // Optionally clear the file input if it wasn't an image
                    event.target.value = null; 
                }
            }
        });

        function validateForm() {
    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const file = document.getElementById("profile-image-upload").files[0];

    const nameRegex = /^[A-Za-z\s]{2,}$/;
    const phoneRegex = /^[0-9]{10}$/;

    // First Name Validation
    if (!nameRegex.test(firstName)) {
        Swal.fire({
            icon: "error",
            title: "Invalid First Name!",
            text: "First name must have at least 2 letters and contain only alphabets.",
        });
        return false;
    }

    // Last Name Validation
    if (!nameRegex.test(lastName)) {
        Swal.fire({
            icon: "error",
            title: "Invalid Last Name!",
            text: "Last name must have at least 2 letters and contain only alphabets.",
        });
        return false;
    }

    // Phone Validation
    if (!phoneRegex.test(phone)) {
        Swal.fire({
            icon: "error",
            title: "Invalid Phone Number!",
            text: "Phone number must be exactly 10 digits.",
        });
        return false;
    }

    // Image validation (optional but useful)
    if (file && !file.type.startsWith("image/")) {
        Swal.fire({
            icon: "error",
            title: "Invalid Image!",
            text: "Please upload a valid image file.",
        });
        return false;
    }

    return true;
}

        
    document.getElementById("profile-form").addEventListener("submit", async function(e) {
    e.preventDefault();

    if (!validateForm()) return;

    const formData = new FormData();
    formData.append("firstName", document.getElementById("firstName").value);
    formData.append("lastName", document.getElementById("lastName").value);
    formData.append("phone", document.getElementById("phone").value);

    const file = document.getElementById("profile-image-upload").files[0];
    if (file) {
        formData.append("profileImg", file);
    }
    try {
        const response = await fetch("/updatedetails", {
        method: "POST",
        body: formData,
    });
    const data=await response.json()
 if(data.success){
    Swal.fire({
        icon: "success",
        title: "Success!",
        text: data.message||"category updated successfully",
        showConfirmButton: false,
        timer: 1500
    })
 }else{
    Swal.fire({
        icon: "error",
        title: "Error!",
        text: data.message ||"something went wrong",
        confirmButtonColor: "#d33"
    });
 }
    } catch (error) {
        Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Internal server error",
        confirmButtonColor: "#d33"
    });
    }


});
