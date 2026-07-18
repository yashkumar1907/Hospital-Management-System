const admin = JSON.parse(localStorage.getItem("admin"));
const token = localStorage.getItem("token");

if(!admin || !token){
    localStorage.clear();
    window.location.href = "../login/admin-login.html";
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
            throw new Error(data.message);
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
                : "../../../assets/default-patient.png";
            patientTableBody.innerHTML += `
                <tr>
                    <td>
                        <div class="doctor-info">
                            <div class="profile-avatar">
                                <img src="${patientPhoto}" class="patient-photo" onerror="this.src='../../../assets/default-patient.png'">
                            </div>
                            <div>
                                <h4>${patient.name}</h4>
                            </div>
                        </div>
                    </td>
                    <td>${patient.gender}</td>
                    <td>${patient.bloodGroup}</td>
                    <td>${patient.phone}</td>
                    <td>${patient.email}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="delete-btn" onclick="deletePatient('${patient._id}')">
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
        await fetch(
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
            throw new Error(data.message);
        }
        alert(data.message);
        loadPatients();
    }
    catch(error){
        console.error(error);
        showToast("error", error.message);
    }
}


document.getElementById("logoutBtn").addEventListener("click", () => {
    if(confirm("Are you sure you want to logout?")){
        localStorage.clear();
        window.location.href = "../login/admin-login.html";
    }
});


document.getElementById("searchPatient").addEventListener("input", () => {
    const search = document.getElementById("searchPatient").value.toLowerCase();
    const rows = document.querySelectorAll("#patientTableBody tr");

    rows.forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(search) ? "" : "none";
    });
});


loadPatients();

window.addEventListener("focus", loadPatients);