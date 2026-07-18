/* ===========================
   DOM ELEMENTS
=========================== */
const messageBox = document.getElementById("messageBox");
const patientLoginForm = document.getElementById("patientLoginForm");
const togglePassword = document.getElementById("togglePassword");
const passwordField = document.getElementById("password");


/* ===========================
   UTILITY FUNCTIONS
=========================== */
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

/* ===========================
   AUTO LOGIN CHECK
=========================== */
const token = localStorage.getItem("token");
const patient = JSON.parse(localStorage.getItem("patient"));

if(token && patient){
    window.location.href = "../dashboard/patient-dashboard.html";
}


/* ===========================
   FORM SUBMISSION
=========================== */
patientLoginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if(!email || !password){
        showMessage("Please fill all fields", "error");
        return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if(!emailPattern.test(email)){
        showMessage("Please enter a valid email address", "error");
        return;
    }

    const loginBtn = document.querySelector(".login-btn");

    try {
        loginBtn.disabled = true;
        loginBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Signing In...`;

        const response = await fetch(
            `${CONFIG.API_BASE_URL}/api/patients/login`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password
                })
            }
        );

        const data = await response.json();

        if(!response.ok){
            loginBtn.disabled = false;
            loginBtn.innerHTML = "Login to Dashboard";
            showMessage(data.message || "Invalid email or password", "error");
            return;
        }

        localStorage.setItem("patient", JSON.stringify(data.patient));
        localStorage.setItem("token", data.token);
        
        showMessage("Login Successful. Redirecting...", "success");
        
        setTimeout(() => {
            window.location.href = "../dashboard/patient-dashboard.html";
        }, 2000);

    } catch(error){
        loginBtn.disabled = false;
        loginBtn.innerHTML = `Login to Dashboard`;
        console.error("Patient Login Error:", error);
        showMessage("Unable to connect to server", "error");
        document.getElementById("email").focus();
    }
});

/* ===========================
   PASSWORD TOGGLE
=========================== */
togglePassword.addEventListener("click", () => {
    if(passwordField.type === "password"){
        passwordField.type = "text";
        togglePassword.classList.replace("fa-eye", "fa-eye-slash");
    }else{
        passwordField.type = "password";
        togglePassword.classList.replace("fa-eye-slash", "fa-eye");
    }
});

/* ===========================
   ENTER KEY
=========================== */
patientLoginForm.addEventListener("keydown", (e)=>{
    if(e.key==="Enter"){
        patientLoginForm.requestSubmit();
    }
});

/* ===========================
   INITIAL FOCUS
=========================== */
document.getElementById("email").focus();