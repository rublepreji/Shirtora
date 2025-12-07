<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

const profileUploadVisible = document.getElementById('profile-upload-visible');
    const profileUploadSubmit = document.getElementById('profile-upload-submit');
    const profileImageContainer = document.querySelector('.profile-img-container');

    profileUploadVisible.addEventListener('change', function(event) {
        const file = event.target.files[0];

        if (file) {
            // 1. Show Preview
            const reader = new FileReader();
            reader.onload = function(e) {
                profileImageContainer.innerHTML = ''; 
                const img = document.createElement('img');
                img.src = e.target.result;
                img.alt = 'Profile Picture Preview';
                img.className = 'w-full h-full object-cover';
                profileImageContainer.appendChild(img);
            }
            reader.readAsDataURL(file);

            profileUploadSubmit.files = event.target.files;

        } else {
            profileUploadSubmit.files = null; 
        }
    });

    // SweetAlerts
    const flashError= "<%=messages.error || ''%>"
    if(flashError){
        Swal.fire({
        icon: "error",
        title: "Error",
        text: flashError,
        });
    }
    const flashSuccess= "<%=messages.success || ''%>"
    if(flashSuccess){
        Swal.fire({
        icon: "success",
        title: "Success",
        text: flashSuccess,
        });
    }