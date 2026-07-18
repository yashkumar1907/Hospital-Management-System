const patient = JSON.parse(localStorage.getItem("patient"));
const token = localStorage.getItem("token");

if(!patient || !token){
    localStorage.clear();
    window.location.href = "../login/patient-login.html";
}

const profilePhoto = patient.photo
    ? (patient.photo.startsWith("http") || patient.photo.startsWith("data:")
        ? patient.photo
        : `${CONFIG.API_BASE_URL}${patient.photo}`)
    : "../../../assets/default-patient.jpg";

document.getElementById("profileAvatar").src = profilePhoto;

document.getElementById("patientName").textContent = patient.name;

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
        window.location.href = "../login/patient-login.html";
    }, 700);

});


async function loadAppointments(){
    try{
        const response = await fetch(
            `${CONFIG.API_BASE_URL}/api/patients/appointments`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if(response.status === 401){
            localStorage.clear();
            window.location.href = "../login/patient-login.html";
            return;
        }

        const data = await response.json();

        if(!response.ok){
            throw new Error(data.message);
        }

        document.getElementById("appointmentCount").textContent = `Total Appointments : ${data.appointments.length}`;

        const appointmentList = document.getElementById("appointmentList");
        appointmentList.innerHTML = "";

        if(data.appointments.length === 0){
            appointmentList.innerHTML = `
                <div style="text-align:center;padding:60px;color:#64748b;">
                    <h3>No Appointments Found</h3>
                    <p>Book your first appointment.</p>

                    <a href="../appointment/patient-book-appointment.html" class="book-now-btn">
                        Book Appointment
                    </a>
                </div>
            `;
            document.getElementById("appointmentCount").textContent = "Total Appointments : 0";
            return;
        }

        data.appointments.forEach(
            appointment => {
                const appointmentDate = new Date(appointment.appointmentDate);

                const formattedDate = appointmentDate.toLocaleDateString("en-IN",{
                    day:"2-digit",
                    month:"short",
                    year:"numeric"
                });
        
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
                        statusClass="pending";
                }
        
                appointmentList.innerHTML += `
                    <div class="appointment-item">
                        <div class="doctor-info">
                            <img src="${
                                appointment.doctorPhoto
                                ?
                                (
                                appointment.doctorPhoto.startsWith("http")
                                ?
                                appointment.doctorPhoto
                                :
                                `${CONFIG.API_BASE_URL}${appointment.doctorPhoto}`
                                )
                                :
                                '../../../assets/default-patient.jpg'
                                }">
                            <div>
                                <h3>${appointment.doctorName}</h3>
                                <p>${appointment.department}</p>
                                <span class="hospital">
                                    <i class="fa-solid fa-location-dot"></i>
                                    CityCare Hospital
                                </span>
                            </div>
                        </div>

                        <div class="appointment-details">
                            <div class="detail-row">
                                <i class="fa-regular fa-calendar"></i>
                                <div>
                                    <span>Date</span>
                                    <p>${formattedDate}</p>
                                </div>
                            </div>

                            <div class="detail-row">
                                <i class="fa-regular fa-clock"></i>
                                <div>
                                    <span>Time</span>
                                    <p>${appointment.appointmentTime}</p>
                                </div>
                            </div>
                            <div class="detail-row">
                                <i class="fa-regular fa-note-sticky"></i>

                                <div>
                                    <span>Notes</span>
                                    <p>${appointment.notes
                                        ?
                                        appointment.notes
                                        :
                                        "-"}</p>
                                </div>
                            </div>
                        </div>

                        <div class="status-badge ${statusClass}">
                            ${appointment.status}
                        </div>
                    </div>
                `;
            }
        );
    }
    catch(error){
        console.error("Load Appointments Error:");
        console.error(error);

        document.getElementById("appointmentCount").textContent = "";

        document.getElementById("appointmentList").innerHTML = `
            <div style="text-align:center;padding:60px;color:#ef4444;">
                Unable to load appointments.
            </div>
        `;
    }
}

loadAppointments();

window.addEventListener("focus",loadAppointments);