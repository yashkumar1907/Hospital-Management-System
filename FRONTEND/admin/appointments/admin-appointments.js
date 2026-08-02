// =====================
// Logged In Admin
// =====================

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


const appointmentTableBody = document.getElementById("appointmentTableBody");

async function loadAppointments(){
    try{
        const response = await fetch(
            `${CONFIG.API_BASE_URL}/api/patients/all-appointments`,
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
            throw new Error(data.message || "Unable to load appointments.");
        }

        document.getElementById("appointmentCount").textContent = `Total Appointments : ${data.appointments.length}`;

        appointmentTableBody.innerHTML = "";

        if(data.appointments.length === 0){
            appointmentTableBody.innerHTML = `
                <tr>
                    <td colspan="7"
                        style="text-align:center;padding:40px;color:#64748b;">
                        No appointments found.
                    </td>
                </tr>
            `;
            document.getElementById("appointmentCount").textContent = "Total Appointments : 0";
            return;
        }

        data.appointments
        .sort((a,b)=>{

            if(a.appointmentDate===b.appointmentDate){

                return a.appointmentTime.localeCompare(
                    b.appointmentTime
                );

            }

            return new Date(a.appointmentDate)-
                new Date(b.appointmentDate);

        })
        .forEach(
            appointment => {
                const appointmentDate = new Date(appointment.appointmentDate);


                const patientName = (appointment.patientName || "-")
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;");

                const doctorName = (appointment.doctorName || "-")
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;");

                const department = (appointment.department || "-")
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;");

                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${patientName}</td>
                    <td>${doctorName}</td>
                    <td>${department}</td>
                    <td>${appointmentDate.toLocaleDateString("en-GB")}</td>
                    <td>${appointment.appointmentTime}</td>
                    <td>
                        <span class="status ${appointment.status.toLowerCase()}">${appointment.status}</span>
                    </td>
                    <td>
                        ${appointment.status === "Pending"
                            ?
                            `<button class="confirm-btn" onclick="confirmAppointment('${appointment._id}', this)">
                                Confirm
                            </button>`
                            :
                            `<span style="font-weight:600;">
                                ${appointment.status}
                            </span>`
                        }
                    </td>
                `;
                appointmentTableBody.appendChild(row);
            }
        );
    }
    catch(error){
        console.error(error);
        showToast("error", error.message);
    }
}

async function confirmAppointment(id, button){
    const confirmed = await showConfirm({
        title: "Confirm Appointment",
        message: "Are you sure you want to confirm this appointment?",
        confirmText: "Confirm",
        cancelText: "Cancel"
    });
    
    if(!confirmed){
        return;
    }
    try{
        button.disabled = true;
        button.textContent = "Confirming...";
        const response =
            await fetch(
                `${CONFIG.API_BASE_URL}/api/doctors/appointments/status/${id}`,
                {
                    method:"PATCH",
                    headers:{
                        "Content-Type":"application/json",
                        Authorization:`Bearer ${token}`
                    },
                    body:JSON.stringify({
                        status:"Confirmed"
                    })
                }
            );

        if(response.status===401){
            localStorage.clear();
            window.location.href="../login/admin-login.html";
            return;
        }
        
        const data = await response.json();

        if(!response.ok){
            throw new Error(data.message || "Unable to update appointment.");
        }

        if(data.success){
            showToast("success", "Appointment confirmed successfully.");
            loadAppointments();
        }
    }
    catch(error){
        button.disabled = false;
        button.textContent = "Confirm";
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
    
    if (!confirmed) return;
    
    localStorage.clear();
    
    showToast("success", "Logged out successfully.");
    
    setTimeout(() => {
        window.location.href = "../login/admin-login.html";
    }, 700);
});




document.getElementById("searchAppointment").addEventListener("input",(e)=>{
    const value = e.target.value.toLowerCase();

    const rows = document.querySelectorAll("#appointmentTableBody tr");
    rows.forEach(row=>{
        row.style.display = row.innerText.toLowerCase().includes(value) ? "" : "none";
    });
});

loadAppointments();

window.addEventListener("pageshow", loadAppointments);