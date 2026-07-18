/* =========================
   DOM ELEMENTS
========================= */
const avatar = document.getElementById("profileAvatar");


/* =========================
   AUTH CHECK
========================= */
const patient = JSON.parse(localStorage.getItem("patient"));
const token = localStorage.getItem("token");

if(!patient || !token){
    localStorage.clear();
    window.location.href="../login/patient-login.html";
}


/* =========================
   INITIALIZATION
========================= */
function initializeDashboard(){
    if(patient.photo){
        avatar.src = patient.photo.startsWith("http")
            ? patient.photo
            : `${CONFIG.API_BASE_URL}${patient.photo}`;
    }
    else{
        avatar.src = "../../../assets/default-patient.jpg";
    }
    
    document.getElementById("patientName").textContent = `Welcome back, ${patient.name}`;
    
    const today = new Date();
    
    document.getElementById("todayDate").textContent = today.toLocaleDateString("en-IN",{
        weekday:"long",
        day:"numeric",
        month:"long",
        year:"numeric"
    });
}


/* =========================
   LOGOUT
========================= */
logoutBtn.addEventListener("click", async () => {
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
        window.location.href = "../login/patient-login.html";
    }, 700);
});


/* =========================
   LOAD DASHBOARD
========================= */
async function loadDashboardData(){
    try{
        const latestAppointmentDiv = document.getElementById("latestAppointment");
        latestAppointmentDiv.innerHTML = `
            <div class="loading-state">
                Loading appointment...
            </div>
        `;

        const response = await fetch(
            `${CONFIG.API_BASE_URL}/api/patients/appointments`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        
        if (response.status === 401) {
            localStorage.clear();
            window.location.href = "../login/patient-login.html";
            return;
        }
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message);
        }
        
        
        const appointments = data.appointments;
        
        const total = appointments.length;

        const pending = appointments.filter(a => a.status === "Pending").length;
        const completed = appointments.filter(a => a.status === "Completed").length;
        const confirmed = appointments.filter(a => a.status === "Confirmed").length;

        document.getElementById("totalAppointments").textContent = total;
        document.getElementById("pendingAppointments").textContent = pending;
        document.getElementById("completedAppointments").textContent = completed;

        const upcoming = pending + confirmed;
        document.getElementById("upcomingAppointments").textContent = upcoming;


        if (appointments.length === 0) {
            latestAppointmentDiv.innerHTML = `
                <div class="empty-state">
                    No appointments booked yet.
                </div>
            `;
        }
        else{
            const latest =
                appointments.find(a =>
                a.status==="Pending" ||
                a.status==="Confirmed"
                ) || appointments[0];

            const doctorPhoto = latest.doctorPhoto ?
                (latest.doctorPhoto.startsWith("http") ? latest.doctorPhoto
                :
                `${CONFIG.API_BASE_URL}${latest.doctorPhoto}`
                )
                :
                "../../../assets/default-patient.jpg";

            let statusClass = "";

            switch (latest.status) {
                case "Pending":
                    statusClass = "pending";
                    break;

                case "Completed":
                    statusClass = "completed";
                    break;

                case "Confirmed":
                    statusClass = "approved";
                    break;

                case "Cancelled":
                    statusClass = "cancelled";
                    break;

                default:
                    statusClass = "approved";
            }

            latestAppointmentDiv.innerHTML = `
                <div class="doctor-info">
                    <div class="doctor-left">
                        <img src="${doctorPhoto}" alt="Doctor Profile">
                        <div class="doctor-details">
                            <h4>${latest.doctorName}</h4>
                            <p class="speciality">${latest.department}</p>
                            <div class="hospital">
                                <i class="fa-solid fa-hospital"></i>
                                <span>CityCare Hospital</span>
                            </div>
                        </div>
                    </div>
                    <span class="status ${statusClass}">
                        ${latest.status}
                    </span>
                </div>

                <div class="appointment-details">
                    <div class="detail-item">
                        <div class="detail-icon">
                            <i class="fa-regular fa-calendar"></i>
                        </div>

                        <div class="detail-content">
                            <span>Date</span>
                            <h5>${new Date(latest.appointmentDate).toLocaleDateString("en-GB")}</h5>
                        </div>
                    </div>

                    <div class="detail-item">
                        <div class="detail-icon">
                            <i class="fa-regular fa-clock"></i>
                        </div>

                        <div class="detail-content">
                            <span>Time</span>
                            <h5>${latest.appointmentTime}</h5>
                        </div>
                    </div>

                    <div class="detail-item">
                        <div class="detail-icon">
                            <i class="fa-solid fa-location-dot"></i>
                        </div>

                        <div class="detail-content">
                            <span>Hospital</span>
                            <h5>CityCare Hospital</h5>
                        </div>
                    </div>
                </div>

                <div class="appointment-note">
                    <i class="fa-solid fa-circle-info"></i>
                    Please arrive 15 minutes before your appointment.
                </div>
            `;
        }
    }
    catch(error){
        document.getElementById("totalAppointments").textContent = "-";
        document.getElementById("pendingAppointments").textContent = "-";
        document.getElementById("completedAppointments").textContent = "-";
        document.getElementById("upcomingAppointments").textContent = "-";
        console.error("Dashboard Load Error:", error);
    
        document.getElementById("latestAppointment").innerHTML = `
            <div class="error-state">
                Unable to load appointment details.
            </div>
        `;
    }
}


/* =========================
   INITIAL LOAD
========================= */
loadDashboardData();
initializeDashboard();


/* =========================
   PAGE SHOW
========================= */
window.addEventListener("pageshow", loadDashboardData);