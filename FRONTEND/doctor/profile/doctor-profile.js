const doctor = JSON.parse(localStorage.getItem("doctor"));
const token = localStorage.getItem("token");

if(!doctor || !token){
    localStorage.clear();
    window.location.href="../login/doctor-login.html";
}

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

const messageBox = document.getElementById("messageBox");

const initials = doctor.name.split(" ").slice(0,2).map(word=>word[0]).join("").toUpperCase();

document.getElementById("profileAvatar").textContent = initials;
document.getElementById("headerDoctorName").textContent = doctor.name;
document.getElementById("doctorName").textContent = doctor.name;
document.getElementById("doctorEmail").textContent = doctor.email;
document.getElementById("doctorPhone").textContent = doctor.phone;
document.getElementById("fullName").textContent = doctor.name;
document.getElementById("specialization").textContent = doctor.specialization;
document.getElementById("department").textContent = doctor.department || doctor.specialization;
document.getElementById("experience").textContent = `${doctor.experience} Years`;
document.getElementById("consultationFee").textContent = `₹${doctor.consultationFee}`;

const availability = document.getElementById("availability");

availability.textContent = doctor.availability ? "Available" : "Unavailable";
availability.className = doctor.availability ? "available" : "unavailable";

document.getElementById("professionalPhone").textContent = doctor.phone;
document.getElementById("accountEmail").textContent = doctor.email;

document.getElementById("logoutBtn").addEventListener("click", () => {
    if(confirm("Are you sure you want to logout?")){
        localStorage.clear();
        window.location.href = "../login/doctor-login.html";
    }
});

const profilePhoto = doctor.photo
    ? (
        doctor.photo.startsWith("http") ||
        doctor.photo.startsWith("data:")
            ? doctor.photo
            : `${CONFIG.API_BASE_URL}${doctor.photo}`
      )
    : "../../../assets/default-doctor.png";

document.getElementById("doctorProfileImage").src = profilePhoto;

document.querySelector(".edit-profile-btn").addEventListener("click",()=>{
    showMessage("Profile editing will be available soon.", "success");
});