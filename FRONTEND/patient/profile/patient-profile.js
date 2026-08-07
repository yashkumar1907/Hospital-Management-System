const patient = JSON.parse(localStorage.getItem("patient"));
const token = localStorage.getItem("token");

if (!patient || !token || patient.role !== "patient") {
    localStorage.clear();
    window.location.href = "../login/patient-login.html";
}


const messageBox = document.getElementById("messageBox");

function showMessage(message,type){
    messageBox.className = "";
    messageBox.textContent = message;

    messageBox.classList.add(type==="success" ? "success-message" : "error-message");

    setTimeout(()=>{
        messageBox.className="";
        messageBox.textContent="";
    },3000);
}


const profileImage = patient.photo
    ? (patient.photo.startsWith("http") || patient.photo.startsWith("data:")
        ? patient.photo
        : `${CONFIG.API_BASE_URL}${patient.photo}`)
    : "../../assets/default-patient.jpg";

document.getElementById("profileImage").src = profileImage;
document.getElementById("profileAvatar").src = profileImage;

document.getElementById("headerPatientName").textContent = patient.name;
document.getElementById("profileName").textContent = patient.name;
document.getElementById("profileEmail").textContent = patient.email;
document.getElementById("profilePhone").textContent = patient.phone;
document.getElementById("fullName").textContent = patient.name;
document.getElementById("gender").textContent = patient.gender;
document.getElementById("email").textContent = patient.email;
document.getElementById("phone").textContent = patient.phone;
document.getElementById("bloodGroup").textContent = patient.bloodGroup;
document.getElementById("emergencyContact").textContent = patient.emergencyContact || "-";
document.getElementById("allergies").textContent = patient.allergies || "-";
document.getElementById("medicalHistory").textContent = patient.medicalHistory || "-";

const dob = new Date(patient.dob);

document.getElementById("dob").textContent = dob.toLocaleDateString("en-IN", {
    day:"2-digit",
    month:"short",
    year:"numeric"
});


const editProfileBtn = document.getElementById("editProfileBtn");
const editProfileModal = document.getElementById("editProfileModal");
const closeModal = document.getElementById("closeModal");
const cancelBtn = document.getElementById("cancelBtn");
const saveProfileBtn = document.getElementById("saveProfileBtn");

editProfileBtn.addEventListener("click", () => {
    editProfileModal.style.display = "flex";

    const profileImage =
        patient.photo
            ? (
                patient.photo.startsWith("http") ||
                patient.photo.startsWith("data:")
                    ? patient.photo
                    : `${CONFIG.API_BASE_URL}${patient.photo}`
            )
            : "../../assets/default-patient.jpg";

    document.getElementById("editPhotoPreview").src = profileImage;
    document.getElementById("editName").value = patient.name;
    document.getElementById("editDob").value = patient.dob.split("T")[0];
    document.getElementById("editGender").value = patient.gender;
    document.getElementById("editBloodGroup").value = patient.bloodGroup;
    document.getElementById("editEmail").value = patient.email;
    document.getElementById("editPhone").value = patient.phone;
    document.getElementById("editEmergencyContact").value = patient.emergencyContact || "";
    document.getElementById("editAllergies").value = patient.allergies || "";
    document.getElementById("editMedicalHistory").value = patient.medicalHistory || "";
});


function closeProfileModal(){
    editProfileModal.style.display = "none";
}

closeModal.addEventListener("click",
    closeProfileModal
);

cancelBtn.addEventListener("click",
    closeProfileModal
);


saveProfileBtn.addEventListener("click", async () => {
    try {
        const email = document.getElementById("editEmail").value.trim();
        const phone = document.getElementById("editPhone").value.trim();
        const emergencyContact = document.getElementById("editEmergencyContact").value.trim();
        const dob = document.getElementById("editDob").value;

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {
            showMessage("Please enter a valid email address.", "error");
            return;
        }

        if (!/^[6-9]\d{9}$/.test(phone)) {
            showMessage("Please enter a valid phone number.", "error");
            return;
        }

        if (emergencyContact && !/^[6-9]\d{9}$/.test(emergencyContact)) {
            showMessage("Please enter a valid emergency contact number.", "error");
            return;
        }

        const today = new Date().toISOString().split("T")[0];

        if (dob > today) {
            showMessage("Date of birth cannot be in the future.", "error");
            return;
        }

        const name = document.getElementById("editName").value.trim();

        if (!name) {
            showMessage("Name is required.", "error");
            return;
        }

        if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(name)) {
            showMessage("Name should contain only letters.", "error");
            return;
        }

        saveProfileBtn.disabled = true;
        saveProfileBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Saving...`;


        const newPhotoFile = document.getElementById("editPatientPhoto").files[0];

        const formData = new FormData();

        formData.append("name", name);
        formData.append("dob", document.getElementById("editDob").value);
        formData.append("gender", document.getElementById("editGender").value);
        formData.append("bloodGroup", document.getElementById("editBloodGroup").value);
        formData.append("email", email);
        formData.append("phone", phone);
        formData.append("emergencyContact", emergencyContact);
        formData.append(
            "allergies",
            document.getElementById("editAllergies").value.trim()
        );
        formData.append(
            "medicalHistory",
            document.getElementById("editMedicalHistory").value.trim()
        );

        if(newPhotoFile){
            formData.append("photo", newPhotoFile);
        }

        const response = await fetch(
            `${CONFIG.API_BASE_URL}/api/patients/profile`,
            {
                method:"PUT",
                headers:{
                    Authorization:`Bearer ${token}`
                },
                body:formData
            }
        );

        if(response.status === 401){
            localStorage.clear();
            window.location.href="../login/patient-login.html";
            return;            
        }

        const data = await response.json();

        if(!response.ok){
            showMessage(data.message, "error");
            saveProfileBtn.disabled = false;
            saveProfileBtn.innerHTML = "Save Changes";
            return;
        }

        if(!data.success){
            showMessage(data.message, "error");
            saveProfileBtn.disabled = false;
            saveProfileBtn.innerHTML = "Save Changes";
            return;
        }

        showMessage("Profile updated successfully.", "success");

        saveProfileBtn.disabled = false;
        saveProfileBtn.innerHTML = "Save Changes";

        setTimeout(() => {
            localStorage.setItem(
                "patient",
                JSON.stringify({
                    ...data.patient,
                    role: "patient"
                })
            );
            location.reload();
        }, 1200);
    }
    catch(error){
        console.error("Profile Update Error:");
        console.error(error);
        showMessage("Unable to update profile", "error");
        saveProfileBtn.disabled = false;
        saveProfileBtn.innerHTML = "Save Changes";
    }
});


document.getElementById("logoutBtn").addEventListener("click", async () => {

    const confirmed = await showConfirm({
        title:"Logout",
        message:"Are you sure you want to logout?",
        confirmText:"Logout",
        cancelText:"Cancel"
    });

    if(!confirmed){
        return;
    }

    localStorage.clear();

    showToast("success","Logged out successfully.");

    setTimeout(()=>{
        window.location.href="../login/patient-login.html";
    },700);

});


const editPatientPhoto = document.getElementById("editPatientPhoto");

editPatientPhoto.addEventListener("change",(e)=>{
    const file = e.target.files[0];
    if(!file) {
        return;
    }

    if(!file.type.startsWith("image/")){
        showMessage("Please select a valid image.", "error");
        editPatientPhoto.value = "";
        document.getElementById("editPhotoPreview").src = profileImage;
        return;
    }
    
    if(file.size > 2 * 1024 * 1024){
        showMessage("Image size should be less than 2 MB.", "error");
        editPatientPhoto.value = "";
        document.getElementById("editPhotoPreview").src = profileImage;
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event){
        document.getElementById("editPhotoPreview").src = event.target.result;
    };

    reader.readAsDataURL(file);
});

window.addEventListener("click", (e) => {
    if (e.target === editProfileModal) {
        closeProfileModal();
    }
});