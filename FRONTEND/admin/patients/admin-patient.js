const admin = JSON.parse(localStorage.getItem("admin"));
const token = localStorage.getItem("token");

if (!admin || !token || admin.role !== "admin") {
    localStorage.clear();
    window.location.href = "../login/admin-login.html";
}

if(admin){
    const adminName = admin.name || "Admin";

    document.getElementById("adminName").textContent = adminName;

    const initials = adminName
        .split(" ")
        .slice(0, 2)
        .map(word => word[0])
        .join("")
        .toUpperCase();

    document.getElementById("profileAvatar").textContent = initials;
}


const patientTableBody = document.getElementById("patientTableBody");

let patients = [];

async function loadPatients(){
    try{
        const response = await fetch(
            `${CONFIG.API_BASE_URL}/api/patients/all`,
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

        if(!response.ok){
            throw new Error(data.message || "Unable to load patients.");
        }

        patients = data.patients;

        document.getElementById("patientCount").textContent = `Total Patients : ${patients.length}`;

        if(patients.length === 0){
            patientTableBody.innerHTML = `
                <tr>
                    <td colspan="6" style=" text-align:center; padding:40px;color:#64748b;">
                        No patients found
                    </td>
                </tr>
            `;
            document.getElementById("patientCount").textContent = "Total Patients : 0";
            return;
        }

        patientTableBody.innerHTML = "";

        patients.forEach(patient => {
            const patientPhoto = patient.photo
                ? (
                    patient.photo.startsWith("http") ||
                    patient.photo.startsWith("data:")
                        ? patient.photo
                        : `${CONFIG.API_BASE_URL}${patient.photo}`
                )
                : "../../assets/default-patient.png";

            const patientName = (patient.name || "-")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
            
            const gender = (patient.gender || "-")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
            
            const bloodGroup = (patient.bloodGroup || "-")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
            
            const phone = (patient.phone || "-")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
            
            const email = (patient.email || "-")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");

            const row = document.createElement("tr");
            row.innerHTML = `
                    <td>
                        <div class="doctor-info">
                            <div class="profile-avatar">
                                <img src="${patientPhoto}" alt="${patientName}" class="patient-photo" onerror="this.src='../../assets/default-patient.png'">
                            </div>
                            <div>
                                <h4>${patientName}</h4>
                            </div>
                        </div>
                    </td>
                    <td>${gender}</td>
                    <td>${bloodGroup}</td>
                    <td>${phone}</td>
                    <td>${email}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="delete-btn" onclick="deletePatient('${patient._id}')">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            patientTableBody.appendChild(row);
        });
    }
    catch(error){
        console.error(error);
        document.getElementById("patientCount").textContent = "";
        showToast("error", error.message);
    }
}


async function deletePatient(id){
    const confirmed = await showConfirm({
        title: "Delete Patient",
        message: "Are you sure you want to delete this patient?",
        confirmText: "Delete",
        cancelText: "Cancel"
    });
    
    if(!confirmed){
        return;
    }

    try{
        const response = await fetch(
            `${CONFIG.API_BASE_URL}/api/patients/${id}`,
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

        if(!response.ok){
            throw new Error(data.message || "Unable to delete patient.");
        }
        showToast("success", data.message);
        loadPatients();
    }
    catch(error){
        console.error(error);
        showToast("error", error.message);
    }
}


document.getElementById("logoutBtn").addEventListener("click", async () => {

    const confirmed = await showConfirm({
        title: "Logout",
        message: "Are you sure you want to logout?",
        confirmText: "Logout",
        cancelText: "Cancel"
    });

    if (!confirmed) {
        return;
    }

    localStorage.clear();

    showToast("success", "Logged out successfully.");

    setTimeout(() => {
        window.location.href = "../login/admin-login.html";
    }, 700);

});


document.getElementById("searchPatient").addEventListener("input", () => {
    const search = document.getElementById("searchPatient").value.toLowerCase();
    const rows = document.querySelectorAll("#patientTableBody tr");

    rows.forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(search) ? "" : "none";
    });
});


loadPatients();

window.addEventListener("pageshow", loadPatients);