 const firstNameId=document.getElementById('firstName')
        const lastNameId=document.getElementById('lastName')
        const phoneId=document.getElementById('phone')
        const emailId=document.getElementById('email')
        const passwordId=document.getElementById('password')
        const cPassId=document.getElementById('cPassword')
        const error1=document.getElementById('error1')
        const error2=document.getElementById('error2')
        const error3=document.getElementById('error3')
        const error4=document.getElementById('error4')
        const error5=document.getElementById('error5')
        const error6=document.getElementById('error6')
        const error7=document.getElementById('error7')
        const formSubmitId=document.getElementById('formSubmit')

        function firstNameValidateChecking(){
            let firstNameVal= firstNameId.value
            let namePattern= /^[A-Za-z ]{2,50}$/
            if(firstNameVal.trim()==""){
                error1.style.display='block'
                error1.innerHTML='Please enter a valid name'
                return false
            }
            else if(!namePattern.test(firstNameVal)){
                error1.style.display='block'
                error1.innerHTML="Name can only contain alphabets and spaces"
                return false
            }
            else{
                error1.style.display='none'
                error1.innerHTML=""
                return true
            }

        }
        function lastNameValidateChecking(){
            let lastNameVal=lastNameId.value
            let namePattern=/^[A-Za-z ]{2,50}$/
            if(lastNameVal.trim()==""){
                error2.style.display='block'
                error2.innerHTML='Enter a valid name'
                return false
            }
            else if(!namePattern.test(lastNameVal)){
                error2.style.display='block'
                error2.innerHTML='Name can only contain alphbets and space'
                return false
            }
            else{
                error2.style.display='none'
                error2.innerHTML=''
                return true
            }
        }

        function phoneValidateChecking(){
            const phoneVal=phoneId.value
            const phonePattern=/^[0-9]{10}$/
            if(!phonePattern.test(phoneVal)){
                error3.style.display='block'
                error3.innerHTML='Phone number must be 10 digits'
                return false
            }
            else{
                error3.style.display='none'
                error3.innerHTML=''
                return true
            }
        }
        function passwordValidateChecking(){
            const passVal= passwordId.value
            const cPassVal= cPassId.value
            const alpha= /^[A-Za-z]+$/
            const digit= /\d/
            if(passVal.length<6){
                error5.style.display='block'
                error5.innerHTML='Must contain atleast 6 characters'
                return false
            }
            else if(passVal.trim()==''){
                error5.style.display='block'
                error5.innerHTML='Password fields cannot be empty'
                return false
            }
            else if(!alpha.test(passVal) && !digit.test(passVal)){
                error5.style.display='block'
                error5.innerHTML='Should contain numbers and alphabets'
                return false
            }
            else{
                error5.style.display='none'
                error5.innerHTML='' 
                return true
            }
        }
        function emailValidateChecking(){
            const emailVal= emailId.value
            const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/;

            if(!emailPattern.test(emailVal)){
                error4.style.display='block'
                error4.innerHTML='Invalid Email Format'
                return false
            }
            else{
                error4.style.display='none'
                error4.innerHTML=''
                return true
            }
        }
        function confirmPasswordChecking(){
            const passwordVal= passwordId.value
            const confirmPassVal= cPassId.value
            if(passwordVal !== confirmPassVal){
                error6.style.display='block'
                error6.innerHTML='Passwords do not match'
                return false
            }
            else{
                error6.style.display='none'
                error6.innerHTML=''
                return true
            }
        }

            formSubmitId.addEventListener('submit',(e)=>{
                const firstNameValid=firstNameValidateChecking()
                const lastNameValid=lastNameValidateChecking()
                const emailValid=emailValidateChecking()
                const phoneNameValid= phoneValidateChecking()
                const passwordValid=passwordValidateChecking()
                const confirmPasswordValid= confirmPasswordChecking()

                let valid=firstNameValid &&lastNameValid &&emailValid &&phoneNameValid &&passwordValid &&confirmPasswordValid
                if(valid){
                   console.log("Your form data in valid");
                   
                }else{
                    e.preventDefault()
                }
            })
