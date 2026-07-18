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


loadAppointments();

async function loadAppointments() {
    try {
        const response = await fetch(
            `${CONFIG.API_BASE_URL}/api/doctors/appointments`,
            {
                headers:{
                    Authorization:`Bearer ${token}`
                }
            }
        );

        if(response.status===401){
            localStorage.clear();
            window.location.href="../login/doctor-login.html";
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message);
        }

        const table = document.getElementById("appointmentsTable");

        let html = `
            <div class="table-header">
                <div>Date & Time</div>
                <div>Patient</div>
                <div>Notes</div>
                <div>Status</div>
                <div>Action</div>
            </div>
        `;

        const appointments =
            data.appointments.filter(
                appointment =>
                    appointment.status === "Confirmed" ||
                    appointment.status === "Completed" ||
                    appointment.status === "Cancelled"
            );
        
        appointments.sort((a,b)=>{
            if(a.appointmentDate===b.appointmentDate){
                return a.appointmentTime.localeCompare(
                    b.appointmentTime
                );    
            }
            
            return new Date(a.appointmentDate)-new Date(b.appointmentDate);    
        });

        document.getElementById("appointmentCount").textContent = `Total Appointments : ${appointments.length}`;


        if (appointments.length === 0) {
            table.innerHTML = `
                <div class="table-header">
                    <div>Date & Time</div>
                    <div>Patient</div>
                    <div>Notes</div>
                    <div>Status</div>
                    <div>Action</div>
                </div>

                <div style="padding:40px;text-align:center;color:#64748b;">
                    No appointments available.
                </div>
            `;   
            document.getElementById("appointmentCount").textContent = "Total Appointments : 0"; 
            return;
        }

        appointments.forEach(
            appointment => {
                let statusClass = appointment.status.toLowerCase();

                html += `
                <div class="appointment-row">
                    <div class="date-time">
                        <i class="fa-regular fa-calendar"></i>
                        <div>
                            <strong>${new Date(appointment.appointmentDate).toLocaleDateString("en-GB")}</strong>
                            <span>${appointment.appointmentTime}</span>
                        </div>
                    </div>

                    <div class="patient-info">
                        <div class="patient-avatar">
                        ${appointment.patientName.split(" ").map(word=>word[0]).slice(0,2).join("").toUpperCase()}
                        </div>

                        <div>
                            <strong>${appointment.patientName}</strong>
                        </div>
                    </div>

                    <div class="appointment-notes">${appointment.notes || "-"}</div>

                    <div>
                        <span class="status-badge ${statusClass}">
                            ${appointment.status}
                        </span>
                    </div>

                    <div class="action-menu">
                        ${appointment.status === "Confirmed" ?
                            `<button class="complete-btn" onclick="markCompleted('${appointment._id}')">Complete</button>`
                            :
                            "-"
                        }
                    </div>
                </div>
                `;
            }
        );
        table.innerHTML = html;
    }
    catch(error){
        console.error("Doctor Appointments Error:");
        console.error(error);

        document.getElementById("appointmentsTable").innerHTML = `
            <div style="padding:40px;text-align:center;color:#ef4444;">
                Unable to load appointments.
            </div>
        `;
    }
}


async function markCompleted(id) {
    try {
        const response = await fetch(
            `${CONFIG.API_BASE_URL}/api/doctors/appointments/status/${id}`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization:`Bearer ${token}`
                },
                body: JSON.stringify({
                    status: "Completed"
                })
            }
        );

        if(response.status===401){
            localStorage.clear();
            window.location.href="../login/doctor-login.html";
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message);
        }


        if(data.success){
            showMessage("Appointment completed", "success");
            loadAppointments();
        }
    }
    catch(error){
        console.error("Doctor Appointments Error:");
        console.error(error);
        showMessage("Unable to update appointment.","error");
    }
}



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



const initials = doctor.name.split(" ").map(word => word[0]).join("").toUpperCase();

document.getElementById("profileAvatar").textContent = initials;
document.getElementById("doctorName").textContent = doctor.name;


window.addEventListener("pageshow", loadAppointments);