// =====================
// Logged In Admin
// =====================
const admin = JSON.parse(localStorage.getItem("admin"));
const token = localStorage.getItem("token");

if(!admin || !token){
    localStorage.clear();
    window.location.href="../login/admin-login.html";
}


if(admin){
    document.getElementById("adminName").textContent = admin.name;
    const initials =
        admin.name
        .split(" ")
        .slice(0,2)
        .map(word=>word[0])
        .join("")
        .toUpperCase();

    document.getElementById("profileAvatar").textContent = initials;
}


const doctorTableBody = document.getElementById("doctorTableBody");
const doctorModal = document.getElementById("doctorModal");
const addDoctorBtn = document.getElementById("addDoctorBtn");
const closeModalBtn = document.getElementById("closeModalBtn");

const editDoctorModal = document.getElementById("editDoctorModal");
const closeEditModalBtn = document.getElementById("closeEditModalBtn");

let doctors = [];
let selectedDoctorId = null;

async function loadDoctors() {
    try {
        const response = await fetch(
            `${CONFIG.API_BASE_URL}/api/doctors/all`,
            {
                headers:{
                    Authorization:`Bearer ${token}`
                }
            }
        );

        if(response.status===401){
            localStorage.clear();
            window.location.href="../login/admin-login.html";
            return;
        }

        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message);
        }

        doctorTableBody.innerHTML = "";

        doctors = data.doctors;

        if(doctors.length === 0){
            doctorTableBody.innerHTML = `
                <tr>
                    <td colspan="5"
                        style="text-align:center;padding:40px;">
                        No doctors found
                    </td>
                </tr>
            `;
            return;
        }

        

        doctors.forEach((doctor) => {
            const doctorPhoto = doctor.photo
                ? (
                    doctor.photo.startsWith("http") ||
                    doctor.photo.startsWith("data:")
                        ? doctor.photo
                        : `${CONFIG.API_BASE_URL}${doctor.photo}`
                )
                : "../../../assets/default-doctor.png";

            doctorTableBody.innerHTML += `
                <tr>
                    <td>
                        <div class="doctor-info">
                            <img src="${doctorPhoto}">
                            <div>
                                <h4>${doctor.name}</h4>
                                <p>${doctor.email}</p>
                            </div>
                        </div>
                    </td>

                    <td>${doctor.specialization}</td>
                    <td>${doctor.qualification || "-"}</td>
                    <td>${doctor.experience ? doctor.experience + " Years" : "-"}</td>
                    <td>${doctor.phone}</td>
                    <td>${doctor.email}</td>
                    <td>
                        <span class="status 
                            ${doctor.availability ? "confirmed" : "pending"}">
                            ${doctor.availability ? "Available" : "Unavailable"}
                        </span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="edit-btn" onclick="openEditDoctorModal('${doctor._id}')">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button class="delete-btn" onclick="deleteDoctor('${doctor._id}')">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
    }
    catch(error){
        console.error(error);
        alert(error.message);
    }
}

addDoctorBtn.addEventListener("click", () => {
    doctorModal.classList.add("active");
});

closeModalBtn.addEventListener("click", () => {
    doctorModal.classList.remove("active");
    document.getElementById("doctorPhoto").value = "";
    document.getElementById("doctorName").value = "";
    document.getElementById("doctorSpecialization").value = "";
    document.getElementById("doctorEmail").value = "";
    document.getElementById("doctorPhone").value = "";
    document.getElementById("doctorPassword").value = "";
    document.getElementById("doctorQualification").value = "";
    document.getElementById("doctorExperience").value = "";
    document.getElementById("doctorAbout").value = "";
});


document.getElementById("saveDoctorBtn").addEventListener("click", addDoctor);

async function addDoctor() {.
    const name = document.getElementById("doctorName").value.trim();
    const specialization = document.getElementById("doctorSpecialization").value.trim();
    const email = document.getElementById("doctorEmail").value.trim();
    const phone = document.getElementById("doctorPhone").value.trim();
    const password = document.getElementById("doctorPassword").value.trim();
    const qualification = document.getElementById("doctorQualification").value.trim();
    const experience = document.getElementById("doctorExperience").value;
    const consultationFee = document.getElementById("doctorConsultationFee").value;
    const availability = document.getElementById("doctorAvailability").value;
    const about = document.getElementById("doctorAbout").value.trim();

    const photo = document.getElementById("doctorPhoto").files[0];
    if(photo){

        if(!photo.type.startsWith("image/")){
            alert("Please select a valid image.");
            return;
        }
    
        if(photo.size > 2 * 1024 * 1024){
            alert("Image size should be less than 2 MB.");
            return;
        }
    
    }

    if(!name || !specialization || !email || !phone || !password || !qualification || !experience || !about){
        alert("Please fill all fields");
        return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if(!emailPattern.test(email)){
        showMessage("Please enter a valid email.", "error");
        return;
    }
    
    if(!/^[6-9]\d{9}$/.test(phone)){
        showMessage("Please enter a valid phone number.", "error");
        return;
    }

    try {
        const formData = new FormData();

        formData.append("name", name);
        formData.append("specialization", specialization);
        formData.append("email", email);
        formData.append("phone", phone);
        formData.append("password", password);
        formData.append("qualification", qualification);
        formData.append("experience", experience);
        formData.append("consultationFee", consultationFee);
        formData.append("availability", availability);
        formData.append("about", about);
        if(photo){
            formData.append("photo", photo);
        }

        const response =
            await fetch(
                `${CONFIG.API_BASE_URL}/api/doctors/add`,
                {
                    method:"POST",
                    headers:{
                        Authorization:`Bearer ${token}`
                    },
                    body:formData
                }
            );

        if(response.status===401){
            localStorage.clear();
            window.location.href="../login/admin-login.html";
            return;
        }

        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message);
        }
        alert(data.message);
        doctorModal.classList.remove("active");
        loadDoctors();
    }
    catch(error){
        console.error(error);
        alert(error.message);
    }
}


async function deleteDoctor(id) {
    const confirmDelete = confirm("Are you sure you want to delete this doctor?");
    if(!confirmDelete) return;

    try {
        const response =
            await fetch(
                `${CONFIG.API_BASE_URL}/api/doctors/${id}`,
                {
                    method:"DELETE",
                    headers:{
                        Authorization:`Bearer ${token}`
                    }
                }
            );

        if(response.status===401){
            localStorage.clear();
            window.location.href="../login/admin-login.html";
            return;
        }

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message);
        }
        alert(data.message);
        loadDoctors();
    }
    catch(error){
        console.error(error);
        alert(error.message);
    }
}


closeEditModalBtn.addEventListener("click", () => {
    editDoctorModal.classList.remove("active");
});


function openEditDoctorModal(id){
    const doctor = doctors.find(doc => doc._id === id);
    if(!doctor) return;

    selectedDoctorId = id;

    document.getElementById("editDoctorName").value = doctor.name;
    document.getElementById("editDoctorSpecialization").value = doctor.specialization;
    document.getElementById("editDoctorEmail").value = doctor.email;
    document.getElementById("editDoctorPhone").value = doctor.phone;
    document.getElementById("editDoctorPassword").value = "";
    document.getElementById("editDoctorQualification").value = doctor.qualification || "";
    document.getElementById("editDoctorExperience").value = doctor.experience || "";
    document.getElementById("editDoctorConsultationFee").value = doctor.consultationFee || "";
    document.getElementById("editDoctorAvailability").value = doctor.availability ? "true" : "false";
    document.getElementById("editDoctorAbout").value = doctor.about || "";

    editDoctorModal.classList.add("active");
}


document.getElementById("updateDoctorBtn").addEventListener("click",updateDoctor);

async function updateDoctor(){
    try{
        const response =
            await fetch(
                `${CONFIG.API_BASE_URL}/api/doctors/${selectedDoctorId}`,
                {
                    method:"PUT",
                    headers:{
                        "Content-Type": "application/json",
                        Authorization:`Bearer ${token}`
                    },
                    body:JSON.stringify({
                        name: document.getElementById("editDoctorName").value.trim(),
                        specialization: document.getElementById("editDoctorSpecialization").value.trim(),
                        email: document.getElementById("editDoctorEmail").value.trim(),
                        phone: document.getElementById("editDoctorPhone").value.trim(),
                        password: document.getElementById("editDoctorPassword").value.trim(),
                        qualification: document.getElementById("editDoctorQualification").value.trim(),
                        experience: document.getElementById("editDoctorExperience").value,
                        about: document.getElementById("editDoctorAbout").value.trim(),
                        consultationFee: document.getElementById("editDoctorConsultationFee").value,
                        availability: document.getElementById("editDoctorAvailability").value==="true",
                    })
                }
        );

        if(response.status===401){
            localStorage.clear();
            window.location.href="../login/admin-login.html";
            return;
        }

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message);
        }
        alert(data.message);

        editDoctorModal.classList.remove("active");
        loadDoctors();
    }
    catch(error){
        console.error(error);
        alert(error.message);
    }
}


document.getElementById("searchDoctor").addEventListener("input", searchDoctor);

function searchDoctor(){
    const searchText = document.getElementById("searchDoctor").value.toLowerCase();

    const rows = document.querySelectorAll("#doctorTableBody tr");
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchText) ? "" : "none";
    });
}

document.getElementById("logoutBtn").addEventListener("click", () => {
    if(confirm("Are you sure you want to logout?")){
        localStorage.clear();
        window.location.href = "../login/admin-login.html";
    }
});


loadDoctors();

window.addEventListener("focus", loadDoctors);