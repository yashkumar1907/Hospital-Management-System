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

    const initials =
        admin.name
        .split(" ")
        .slice(0,2)
        .map(word=>word[0])
        .join("")
        .toUpperCase();

    document.getElementById("profileAvatar").textContent = initials;

    const today = new Date();

    document.getElementById("todayDate").textContent =
        today.toLocaleDateString("en-IN",{
            weekday:"long",
            day:"numeric",
            month:"long",
            year:"numeric"
        });
}


// =====================
// Dashboard Data
// =====================
async function loadDashboard(){
    try{
        document.getElementById("recentAppointments").innerHTML = `
        <div style="padding:40px;text-align:center;color:#64748b;">
            Loading appointments...
        </div>
        `;
        
        const doctorsRes = await fetch(
            `${CONFIG.API_BASE_URL}/api/doctors/all`,
            {
                headers:{
                    Authorization:`Bearer ${token}`
                }
            }
        );

        if(doctorsRes.status===401){
            localStorage.clear();
            window.location.href="../login/admin-login.html";
            return;
        }


        const doctorsData = await doctorsRes.json();

        if(!doctorsRes.ok){
            throw new Error(doctorsData.message);
        }

        const patientsRes = await fetch(
            `${CONFIG.API_BASE_URL}/api/patients/all`,
            {
                headers:{
                    Authorization:`Bearer ${token}`
                }
            }
        );

        if(patientsRes.status===401){
            localStorage.clear();
            window.location.href="../login/admin-login.html";
            return;
        }

        const patientsData = await patientsRes.json();

        if(!patientsRes.ok){
            throw new Error(patientsData.message);
        }

        const appointmentsRes = await fetch(
            `${CONFIG.API_BASE_URL}/api/patients/all-appointments`,
            {
                headers:{
                    Authorization:`Bearer ${token}`
                }
            }
        );
        
        if(appointmentsRes.status===401){
            localStorage.clear();
            window.location.href="../login/admin-login.html";
            return;
        }

        const appointmentsData = await appointmentsRes.json();

        if(!appointmentsRes.ok){
            throw new Error(appointmentsData.message);
        }

        const doctors = doctorsData.doctors || [];
        const patients = patientsData.patients || [];
        const appointments = appointmentsData.appointments || [];

        document.getElementById("totalDoctors").textContent = doctors.length;
        document.getElementById("totalPatients").textContent = patients.length;
        document.getElementById("totalAppointments").textContent = appointments.length;

        const pending = appointments.filter(appointment => appointment.status === "Pending");

        document.getElementById("pendingAppointments").textContent = pending.length;

        loadRecentAppointments(appointments);
        renderAppointmentsChart(appointments);
    }
    catch(error){
        document.getElementById("totalDoctors").textContent = "-";
        document.getElementById("totalPatients").textContent = "-";
        document.getElementById("totalAppointments").textContent = "-";
        document.getElementById("pendingAppointments").textContent = "-";
        console.error(error);

        document.getElementById("recentAppointments").innerHTML = `
            <div style="padding:40px;text-align:center;color:#ef4444;">
                Unable to load dashboard data.
            </div>
        `;
    }
}


function loadRecentAppointments(appointments){
    const container = document.getElementById("recentAppointments");

    const latest =
        appointments
        .slice()
        .sort((a,b)=>
        new Date(b.createdAt || b.appointmentDate) -
        new Date(a.createdAt || a.appointmentDate)
        )
        .slice(0,5);

    if(latest.length === 0){

        container.innerHTML = `
            <div style="padding:40px;text-align:center;color:#64748b;">
                No appointments available.
            </div>
        `;
    
        return;
    }

    container.innerHTML = latest.map((appointment) => {
        
        let statusClass = "";

        switch(appointment.status){

            case "Pending":
                statusClass="pending";
                break;

            case "Confirmed":
                statusClass="confirmed";
                break;

            case "Completed":
                statusClass="completed";
                break;

            case "Cancelled":
                statusClass="cancelled";
                break;

            default:
                statusClass="upcoming";

        }

        const patientPhoto = appointment.patientPhoto
            ? (
                appointment.patientPhoto.startsWith("http") ||
                appointment.patientPhoto.startsWith("data:")
                    ? appointment.patientPhoto
                    : `${CONFIG.API_BASE_URL}${appointment.patientPhoto}`
            )
            : "../../../assets/default-patient.jpg";

        return `
            <div class="appointment-row">
                <div class="appointment-user">
                    <img src="${patientPhoto}">

                    <div>
                        <h4>${appointment.patientName}</h4>
                        <p>${appointment.department}</p>
                    </div>
                </div>

                <div class="appointment-date">
                    <p>${new Date(appointment.appointmentDate).toLocaleDateString("en-GB")}</p>
                    <span>${appointment.appointmentTime}</span>
                </div>

                <span class="status ${statusClass}">
                    ${appointment.status}
                </span>

            </div>
        `;
    }).join("");
}


function renderAppointmentsChart(appointments){
    const monthlyCounts = Array(12).fill(0);

    appointments.forEach(appointment => {
        const month = new Date(appointment.appointmentDate).getMonth();
        monthlyCounts[month]++;
    });

    const ctx = document.getElementById("appointmentsChart").getContext("2d");

    const existingChart = Chart.getChart("appointmentsChart");

    if(existingChart){

        existingChart.destroy();

    }

    new Chart(ctx, {
        type:"line",
        data:{
            labels:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],

            datasets:[{
                label:"Appointments",
                data:monthlyCounts,
                borderColor:"#2563eb",
                backgroundColor: "rgba(37,99,235,0.1)",
                borderWidth:3,
                tension:0.4,
                fill:true
            }]
        },

        options:{
            responsive: true,
            maintainAspectRatio: false,
            plugins:{
                legend:{
                    display:true
                }
            }
        }
    });
}

document.getElementById("logoutBtn").addEventListener("click", () => {
    if(confirm("Are you sure you want to logout?")){
        localStorage.clear();
        window.location.href = "../login/admin-login.html";
    }
});


loadDashboard();

window.addEventListener("focus",()=>{

    loadDashboard();

});