const admin = JSON.parse(localStorage.getItem("admin"));
const token = localStorage.getItem("token");

if (admin && token) {
    window.location.href = "../dashboard/admin-dashboard.html";
}

const messageBox = document.getElementById("messageBox");

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

const adminLoginForm = document.getElementById("adminLoginForm");

adminLoginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    const loginBtn = document.getElementById("loginBtn");

    loginBtn.disabled = true;
    loginBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Signing In...`;

    if(!email || !password){
        showMessage("Please fill all fields", "error");
        return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailPattern.test(email)){
        showMessage("Please enter a valid email address", "error");
        return;
    }

    try{
        const response = await fetch(
            `${CONFIG.API_BASE_URL}/api/admin/login`,
            {
                method:"POST",
                headers:{
                    "Content-Type":"application/json"
                },
                body:JSON.stringify({
                    email,
                    password
                })
            }
        );
    
        const data = await response.json();
    
        if(!response.ok){
            loginBtn.disabled = false;
            loginBtn.innerHTML = "Login to Dashboard";
    
            showMessage(data.message,"error");
            return;
        }
    
        localStorage.setItem("admin", JSON.stringify(data.admin));
    
        localStorage.setItem("token", data.token);
    
        showMessage("Login Successful. Redirecting...","success");
    
        setTimeout(()=>{
            window.location.href="../dashboard/admin-dashboard.html";
        },1500);
    
    }
    catch(error){
        console.error("Admin Login Error:");
        console.error(error);
    
        loginBtn.disabled = false;
        loginBtn.innerHTML = "Login to Dashboard";
    
        showMessage("Unable to connect to server.", "error");
    }
})



const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");

togglePassword.addEventListener("click", () => {
    if(passwordInput.type === "password"){
        passwordInput.type = "text";
        togglePassword.classList.replace("fa-eye", "fa-eye-slash");
    }
    else{
        passwordInput.type = "password";
        togglePassword.classList.replace("fa-eye-slash", "fa-eye");
    }
});


adminLoginForm.addEventListener("keydown",(e)=>{
    if(e.key==="Enter"){
        adminLoginForm.requestSubmit();
    }
});