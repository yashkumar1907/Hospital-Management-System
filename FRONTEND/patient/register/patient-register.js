// ==============================
// DOM ELEMENTS
// ==============================
const messageBox = document.getElementById("messageBox");
const registerBtn = document.querySelector(".register-btn");

const patientRegisterForm = document.getElementById("patientRegisterForm");

const dobField = document.getElementById("dob");
const phoneField = document.getElementById("phone");

const togglePassword = document.getElementById("togglePassword");
const passwordField = document.getElementById("password");

const confirmPasswordField = document.getElementById("confirmPassword");
const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");

const patientPhoto = document.getElementById("patientPhoto");
const photoPreview = document.getElementById("photoPreview");


// ==============================
// UTILITY FUNCTIONS
// ==============================
function showMessage(message, type){
    messageBox.className = "";
    messageBox.textContent = message;

    if(type === "success"){
        messageBox.className = "success-message";
    }
    else{
        messageBox.className = "error-message";
    }

    setTimeout(() => {
        messageBox.className = "";
        messageBox.textContent = "";
        messageBox.style.display = "none";
    }, 3000);
}

function convertToBase64(file){
    return new Promise((resolve,reject)=>{
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}


// ==============================
// INITIAL SETUP
// ==============================
dobField.max = new Date().toISOString().split("T")[0];

phoneField.addEventListener("input",()=>{
    phoneField.value =
        phoneField.value
        .replace(/\D/g,"")
        .slice(0,10);
});


// ==============================
// FORM SUBMISSION
// ==============================
patientRegisterForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fullName = document.getElementById("fullName").value.trim();
    if(!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(fullName)){
        showMessage("Name should contain only letters.","error");
        return;
    }

    const dob = document.getElementById("dob").value;
    const gender = document.getElementById("gender").value;
    const bloodGroup = document.getElementById("bloodGroup").value;
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const patientPhotoFile = document.getElementById("patientPhoto").files[0];
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const terms = document.getElementById("terms").checked;

    if(!fullName ||!dob ||!gender ||!bloodGroup ||!email ||!phone ||!password ||!confirmPassword){
        showMessage("Please fill all fields", "error");
        return;
    }

    const today = new Date().toISOString().split("T")[0];

    if(dob > today){
        showMessage("Date of birth cannot be in the future.", "error");
        return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailPattern.test(email)){
        showMessage("Please enter a valid email address", "error");
        return;
    }
    
    if(!/^[6-9]\d{9}$/.test(phone)){
        showMessage("Phone number must be 10 digits", "error");
        return;
    }

    if(password.length < 8){
        showMessage("Password must be at least 8 characters", "error");
        return;
    }

    if(password !== confirmPassword){
        showMessage("Passwords do not match", "error");
        return;
    }

    if(!terms){
        showMessage("Please accept Terms & Conditions", "error");
        return;
    }

    if (registerBtn.disabled) {
        return;
    }

    try {
        registerBtn.disabled = true;
        registerBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Creating Account...`;

        let photo = "";
        if(patientPhotoFile){
            photo = await convertToBase64(patientPhotoFile);
        }

        const response = await fetch(
            `${CONFIG.API_BASE_URL}/api/patients/register`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({name: fullName, dob, gender, bloodGroup, email, phone, photo, password})
            }
        );

        if (!response.ok) {
            const data = await response.json();
            registerBtn.disabled = false;
            registerBtn.innerHTML = "Create Account";
            showMessage(data.message, "error");
            return;
        }

        const data = await response.json();

        showMessage("Registration successful. Redirecting to login...", "success");
        patientRegisterForm.reset();
        document.getElementById("fullName").focus();
        photoPreview.src = "../../../assets/default-patient.jpg";

        registerBtn.disabled = false;
        registerBtn.innerHTML = "Create Account";

        setTimeout(() => {
            window.location.href = "../login/patient-login.html";
        }, 2000);
    
    } catch(error){
        registerBtn.disabled = false;
        registerBtn.innerHTML = "Create Account";
        console.error("Registration Error:", error);
        showMessage("Unable to connect to server", "error");
    }
})


// ==============================
// PASSWORD TOGGLE
// ==============================
togglePassword.addEventListener("click", () => {
    if(passwordField.type === "password"){
        passwordField.type = "text";
        togglePassword.classList.replace("fa-eye", "fa-eye-slash");
    }else{
        passwordField.type = "password";
        togglePassword.classList.replace("fa-eye-slash", "fa-eye");
    }
});


// ==============================
// CONFIRM PASSWORD TOGGLE
// ==============================
toggleConfirmPassword.addEventListener("click", () => {
    if(confirmPasswordField.type === "password"){
        confirmPasswordField.type = "text";
        toggleConfirmPassword.classList.replace("fa-eye", "fa-eye-slash");
    }
    else{
        confirmPasswordField.type = "password";
        toggleConfirmPassword.classList.replace("fa-eye-slash", "fa-eye");
    }
});


// ==============================
// ENTER KEY SUBMIT
// ==============================
patientRegisterForm.addEventListener("keydown",(e)=>{
    if(e.key==="Enter"){
        patientRegisterForm.requestSubmit();
    }
});


// ==============================
// PHOTO PREVIEW
// ==============================
patientPhoto.addEventListener("change",(e)=>{
    const file = e.target.files[0];
    if(!file) {
        return;
    }
    if(!file.type.startsWith("image/")){
        showMessage("Please select a valid image.", "error");
        patientPhoto.value = "";
        return;
    }

    if(file.size > 2 * 1024 * 1024){
        showMessage("Image size should be less than 2 MB.", "error");
        patientPhoto.value = "";
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event){
        photoPreview.src = event.target.result;
    };
    reader.readAsDataURL(file);
});