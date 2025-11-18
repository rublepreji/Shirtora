document.getElementById('resetForm').addEventListener('submit',async(e)=>{
        e.preventDefault()
        const newPassword= document.getElementById('newPassword').value.trim()
        const confirmPassword= document.getElementById('confirmPassword').value.trim()
        const error1= document.getElementById('error1')
        const error2= document.getElementById('error2')
        
        const alpha= /[A-Za-z]/
        const digit= /\d/
        error1.textContent=''
        error2.textContent=''

        let validate= true
        if(newPassword.length<6){
            error1.textContent='Must contain atleast 6 characters'
            validate=false
        }
        else if(!alpha.test(newPassword) || !digit.test(newPassword)){
            error1.textContent='Should contain numbers and alphabets'
            validate=false
        }
     
        if(newPassword!=confirmPassword){
            error2.textContent='Passwords do not match'
            validate=false
        }

        if(validate){
            const response= await fetch(`/resetpassword`,{
                method:'post',
                 headers: {
                    "Content-Type": "application/json"
                },
                body:JSON.stringify({password:newPassword,confirmPassword:confirmPassword})
            })
            const data = await response.json()
            if(data.success){
                Swal.fire({
                icon: "success",
                title: "Success!",
                text: data.message||"Your action was completed successfully.",
                }).then(()=>{
                    window.location.href='/signin'
                })
            }
            else{
                Swal.fire({
                icon: "error",
                title: "Error!",
                text: data.message||"Something went wrong.",
                }).then(()=>{
                    window.location.href='/pageNotFound'
                })
            }

        }

    })