// =====================
// Logged In Admin
// =====================

const admin = JSON.parse(localStorage.getItem("admin"));
const token = localStorage.getItem("token");

if(!admin || !token){
    localStorage.clear();
    window.location.href = "../login/admin-login.html";
}


if(admin){
    document.getElementById("adminName").textContent = admin.name;

    const initials = admin.name
        .split(" ")
        .slice(0,2)
        .map(word=>word[0])
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
            throw new Error(data.message);
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

                appointmentTableBody.innerHTML += `
                    <tr>
                        <td>${appointment.patientName}</td>
                        <td>${appointment.doctorName}</td>
                        <td>${appointment.department}</td>
                        <td>${appointmentDate.toLocaleDateString("en-GB")}</td>
                        <td>${appointment.appointmentTime}</td>
                        <td>
                            <span class="status ${appointment.status.toLowerCase()}">${appointment.status}</span>
                        </td>
                        <td>
                            ${appointment.status === "Pending"
                                ?
                                `<button class="confirm-btn" onclick="confirmAppointment('${appointment._id}')">
                                    Confirm
                                </button>`
                                :
                                `<span style="font-weight:600;">
                                    ${appointment.status}
                                </span>`
                            }
                        </td>
                    </tr>
                `;
            }
        );
    }
    catch(error){
        console.error(error);
        showToast("error", error.message);
    }
}

async function confirmAppointment(id){
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
            throw new Error(data.message);
        }

        if(data.success){
            showToast("success", "Appointment confirmed successfully.");
            loadAppointments();
        }
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




document.getElementById("searchAppointment").addEventListener("input",(e)=>{
    const value = e.target.value.toLowerCase();

    const rows = document.querySelectorAll("#appointmentTableBody tr");
    rows.forEach(row=>{
        row.style.display = row.innerText.toLowerCase().includes(value) ? "" : "none";
    });
});

loadAppointments();

window.addEventListener("focus", loadAppointments);