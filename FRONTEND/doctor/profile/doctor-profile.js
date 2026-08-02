const doctor = JSON.parse(localStorage.getItem("doctor"));
const token = localStorage.getItem("token");

if (!doctor || !token || doctor.role !== "doctor") {
    localStorage.clear();
    window.location.href = "../login/doctor-login.html";
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

const doctorName = doctor.name || "Doctor";

const initials = doctorName
    .split(" ")
    .slice(0, 2)
    .map(word => word[0])
    .join("")
    .toUpperCase();

document.getElementById("profileAvatar").textContent = initials;
document.getElementById("headerDoctorName").textContent = doctorName;
document.getElementById("doctorName").textContent = doctorName;
document.getElementById("doctorEmail").textContent = doctor.email;
document.getElementById("doctorPhone").textContent = doctor.phone;
document.getElementById("fullName").textContent = doctor.name;
document.getElementById("specialization").textContent = doctor.specialization;
document.getElementById("department").textContent = doctor.department || doctor.specialization;
document.getElementById("experience").textContent = doctor.experience != null ? `${doctor.experience} Years` : "-";
document.getElementById("consultationFee").textContent = doctor.consultationFee != null ? `₹${doctor.consultationFee}` : "-";

const availability = document.getElementById("availability");

availability.textContent = doctor.availability ? "Available" : "Unavailable";
availability.className = doctor.availability ? "available" : "unavailable";

document.getElementById("professionalPhone").textContent = doctor.phone;
document.getElementById("accountEmail").textContent = doctor.email;

document.getElementById("logoutBtn").addEventListener("click", async () => {

    const confirmed = await showConfirm({
        title: "Logout",
        message: "Are you sure you want to logout?",
        confirmText: "Logout",
        cancelText: "Cancel"
    });

    if(!confirmed){
        return;
    }

    localStorage.clear();

    showToast("success", "Logged out successfully.");

    setTimeout(() => {
        window.location.href = "../login/doctor-login.html";
    }, 700);

});

const profilePhoto = doctor.photo
    ? (
        doctor.photo.startsWith("http") ||
        doctor.photo.startsWith("data:")
            ? doctor.photo
            : `${CONFIG.API_BASE_URL}${doctor.photo}`
      )
    : "../../assets/default-doctor.png";

document.getElementById("doctorProfileImage").src = profilePhoto;