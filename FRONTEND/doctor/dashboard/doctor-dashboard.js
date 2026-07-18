const doctor = JSON.parse(localStorage.getItem("doctor"));
const token = localStorage.getItem("token");

if(!doctor || !token){
    localStorage.clear();
    window.location.href = "../login/doctor-login.html";
}


async function loadDashboardData(){
    try{
        document.getElementById("appointmentsContainer").innerHTML = `
            <div style="padding:40px;text-align:center;color:#64748b;">
                Loading appointments...
            </div>
        `;

        const response = 
            await fetch(
                `${CONFIG.API_BASE_URL}/api/doctors/appointments`, {
                headers:{
                    Authorization:`Bearer ${token}`
                }
        });

        if(response.status===401){
            localStorage.clear();
            window.location.href="../login/doctor-login.html";
            return;
        }

        const data = await response.json();
        if(!response.ok){
            throw new Error(data.message);
        }

        const appointments = data.appointments;
        document.getElementById("totalAppointments").textContent = appointments.length;
        
        const confirmed = appointments.filter(appointment => appointment.status === "Confirmed").length;
        document.getElementById("confirmedAppointments").textContent = confirmed;

        const completed =
            appointments.filter(
                appointment => appointment.status === "Completed"
            ).length;

        document.getElementById("completedAppointments").textContent = completed;

        document.getElementById("appointmentSummary").innerHTML =
                `
                    <div class="summary-box">
                        <h2>${appointments.length}</h2>
                        <p>Total Appointments</p>
                        <br>
                        <h2>${completed}</h2>
                        <p>Completed Appointments</p>
                    </div>
                `;

        const today = new Date().toISOString().split("T")[0];

        const todayAppointments =
            appointments.filter(
                appointment => new Date(appointment.appointmentDate).toISOString().split("T")[0] === today
            ).length;

        document.getElementById("todayAppointments").textContent = todayAppointments;
        loadTodayAppointments(appointments);
    }
    catch(error){
        document.getElementById("todayAppointments").textContent = "-";
        document.getElementById("totalAppointments").textContent = "-";
        document.getElementById("completedAppointments").textContent = "-";
        document.getElementById("confirmedAppointments").textContent = "-";
        console.error("Doctor Dashboard Error:");
        console.error(error);

        document.getElementById("appointmentsContainer").innerHTML = `
            <p style="text-align:center;color:#ef4444;">
                Unable to load appointments.
            </p>
        `;

        document.getElementById("appointmentSummary").innerHTML = `
            <p style="text-align:center;color:#ef4444;">
                Unable to load summary.
            </p>
        `;
    }
}


const initials = doctor.name.split(" ").map(word => word[0]).join("").toUpperCase();

document.getElementById("profileAvatar").textContent = initials;
document.getElementById("doctorName").textContent = doctor.name;

const today = new Date();

document.getElementById("todayDate").textContent =
today.toLocaleDateString("en-IN",{
    weekday:"long",
    day:"numeric",
    month:"long",
    year:"numeric"
});

document.getElementById("logoutBtn").addEventListener("click", () => {
    if(confirm("Are you sure you want to logout?")){
        localStorage.clear();
        window.location.href = "../login/doctor-login.html";
    }
});


function loadTodayAppointments(appointments){
    const container = document.getElementById("appointmentsContainer");

    const today = new Date().toISOString().split("T")[0];

    const todayList =
        appointments
        .filter(
            appointment =>
                new Date(appointment.appointmentDate)
                    .toISOString()
                    .split("T")[0] === today
        )
        .sort(
            (a,b)=>
            a.appointmentTime.localeCompare(
                b.appointmentTime
            )
        );

    if(todayList.length === 0){
        container.innerHTML = `
            <div class="summary-box">
                <h3>No Appointments Today</h3>
                <p>Your schedule is clear for today.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = todayList.map(appointment => {

        let statusClass = "";

        switch(appointment.status){

            case "Confirmed":
                statusClass = "confirmed";
                break;

            case "Completed":
                statusClass = "completed";
                break;

            case "Cancelled":
                statusClass = "cancelled";
                break;

            default:
                statusClass = "confirmed";

        }

        return `
            <div class="appointment-item">

                <div class="patient-info">
                    <h4>${appointment.patientName}</h4>
                    <p>${appointment.appointmentTime}</p>
                </div>

                <span class="status ${statusClass}">
                    ${appointment.status}
                </span>

            </div>
        `;

    }).join("");
}


loadDashboardData();

window.addEventListener("pageshow", loadDashboardData);