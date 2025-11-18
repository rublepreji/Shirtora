const nameId = document.getElementById("name");
const descriptionId = document.getElementById("description");
const errorName = document.getElementById("error-name");
const errorDescription = document.getElementById("error-description");
const id= document.getElementById('id').value
const form = document.getElementById("addCategoryForm");

function validateName() {
    const name = nameId.value.trim();
    if (name === "") {
    errorName.style.display = "block";
    errorName.innerHTML = "Name is required";
    return false;
    } else if (!/^[A-Za-z][A-Za-z\s\-]{1,49}$/.test(name)) {
    errorName.style.display = "block";
    errorName.innerHTML = "Category name should contain only letters";
    return false;
    }
    return true;
}

function validateDescription() {
    const description = descriptionId.value.trim();
    if (description === "") {
    errorDescription.style.display = "block";
    errorDescription.innerHTML = "Please enter a description";
    return false;
    }
    return true;
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorName.style.display = "none";
    errorDescription.style.display = "none";

    const validName = validateName();
    const validDescription = validateDescription();

    if (!validName || !validDescription) return;

    const name = nameId.value.trim();
    const description = descriptionId.value.trim();

    try {
    const response = await fetch("/admin/postEditCategory", {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, description, id }),
    });

    const result = await response.json();

    if (!response.ok) {
        Swal.fire({
        icon: "error",
        title: "Oops...",
        text: result.error || "Something went wrong!",
        });
        return;
    }

    Swal.fire({
        icon: "success",
        title: "Success!",
        text: result.message || "Category added successfully!",
        showConfirmButton: false,
        timer: 2000,
    });

    form.reset();
    } catch (err) {
    Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Network error or server unreachable!",
    });
    }
});