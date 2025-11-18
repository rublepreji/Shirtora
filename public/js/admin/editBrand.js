const nameInput = document.getElementById('name')
const descriptionInput = document.getElementById('description')
const imageUpload= document.getElementById('imageUpload')
const formSubmit= document.getElementById('submitForm')
const preview = document.getElementById('preview')
const brandId= document.getElementById('brandId')

imageUpload.addEventListener('change',()=>{
    const file= imageUpload.files[0]
    if(file){
    const preview=document.getElementById('preview')
    preview.src=URL.createObjectURL(file)
    }
})
formSubmit.addEventListener('submit',async (e)=>{
    e.preventDefault()
    
    let isValid=true
    if(nameInput.value.trim()=="" || descriptionInput.value.trim()==""){
    isValid=false
    }
    if(!imageUpload.files.length && !preview.src){
        isValid=false
    }
    if (!isValid) {
    Swal.fire({ 
        icon: "warning",
        title: "Please fill all the fields",
    });
    return;
    }
    const formData= new FormData()
    formData.append('id',brandId.value)
    formData.append('name',nameInput.value.trim())
    formData.append('description',descriptionInput.value.trim())
    if(imageUpload.files.length>0){
        formData.append('image',imageUpload.files[0])
    }
    try {
        const response=await fetch('/admin/editBrand',{
        method:"put",
        body:formData
        })
        const result=await response.json()
        if(result.success){
        Swal.fire({
        icon: "success",
        title: "Success!",
        text: result.message || "Brand updated successfully!",
        showConfirmButton: false,
        timer: 2000,
        });
        }
        else{
        Swal.fire({
        icon: "error",
        title: "Oops...",
        text: result.message || "Brand Cannot updated!",
        });
        }
    } catch (error) {
        Swal.fire({
        icon: "error",
        title: "Oops...",
        text: error.message || "Something went wrong!",
        });
    }
})