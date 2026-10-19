const patient = JSON.parse(localStorage.getItem("patient") || "{}") || {};
const token = localStorage.getItem("token");

if (!patient || !token || patient.role !== "patient") {
    localStorage.clear();
    window.location.href = "../login/patient-login.html";
}

const profilePhoto = patient.photo
    ? (patient.photo.startsWith("http") || patient.photo.startsWith("data:")
        ? patient.photo
        : `${CONFIG.API_BASE_URL}${patient.photo}`)
    : "../../assets/default-patient.jpg";

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


                const appointmentCard = document.createElement("div");
                appointmentCard.className = "appointment-item";
                const canCancel = ["Pending", "Confirmed"].includes(appointment.status);


                const notes = escapeHtml(appointment.notes || "-");
                const doctorName = escapeHtml(appointment.doctorName || "-");
                const department = escapeHtml(appointment.department || "-");
                const appointmentTime = escapeHtml(appointment.appointmentTime || "-");
                const appointmentStatus = escapeHtml(appointment.status || "-");

                const doctorPhoto = appointment.doctorId?.photo
                    ? (
                        appointment.doctorId.photo.startsWith("http")
                            ? appointment.doctorId.photo
                            : `${CONFIG.API_BASE_URL}${appointment.doctorId.photo}`
                    )
                    : "../../assets/default-doctor.jpg";

                appointmentCard.innerHTML += `
                        <div class="doctor-info">
                            <img src="${escapeHtml(doctorPhoto)}">
                            <div>
                                <h3>${doctorName}</h3>
                                <p>${department}</p>
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
                                    <p>${appointmentTime}</p>
                                </div>
                            </div>
                            <div class="detail-row">
                                <i class="fa-regular fa-note-sticky"></i>


                                <div>
                                    <span>Notes</span>
                                    <p>${notes}</p>
                                </div>
                            </div>
                        </div>

                        <div class="appointment-actions">
                            <div class="status-badge ${statusClass}">
                                ${appointmentStatus}
                            </div>
                            ${canCancel ? `<button type="button" class="cancel-appointment-btn" data-appointment-id="${escapeHtml(appointment._id)}">Cancel Appointment</button>` : ""}
                        </div>
                `;

                appointmentList.appendChild(appointmentCard);
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

document.getElementById("appointmentList").addEventListener("click", async (event) => {
    const button = event.target.closest(".cancel-appointment-btn");
    if (!button || button.disabled) return;

    const confirmed = await showConfirm({
        title: "Cancel Appointment",
        message: "Are you sure you want to cancel this appointment?",
        confirmText: "Cancel Appointment",
        cancelText: "Keep Appointment"
    });
    if (!confirmed) return;

    button.disabled = true;
    try {
        const response = await fetch(
            `${CONFIG.API_BASE_URL}/api/patients/appointments/${encodeURIComponent(button.dataset.appointmentId)}/cancel`,
            {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` }
            }
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Unable to cancel appointment.");
        showToast("success", data.message);
        await loadAppointments();
    } catch (error) {
        showToast("error", error.message || "Unable to connect to server.");
        button.disabled = false;
    }
});

loadAppointments();

window.addEventListener("pageshow",loadAppointments);
