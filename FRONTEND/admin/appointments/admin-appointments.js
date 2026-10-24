// =====================
// Logged In Admin
// =====================

const admin = window.getAdminSession();
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
const appointmentSearch = document.getElementById("searchAppointment");
const appointmentStatusFilter = document.getElementById("appointmentStatusFilter");
const appointmentDateFilter = document.getElementById("appointmentDateFilter");
const appointmentSort = document.getElementById("appointmentSort");
const appointmentCount = document.getElementById("appointmentCount");
let allAppointments = [];

function appointmentDateKey(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function compareAppointmentTime(left, right) {
    const getStartMinutes = (value) => {
        const match = String(value || "").match(/^(\d{1,2}):(\d{2})/);
        return match ? Number(match[1]) * 60 + Number(match[2]) : null;
    };
    const leftMinutes = getStartMinutes(left);
    const rightMinutes = getStartMinutes(right);
    if (leftMinutes !== null && rightMinutes !== null) return leftMinutes - rightMinutes;
    return String(left || "").localeCompare(String(right || ""), undefined, { numeric: true, sensitivity: "base" });
}

function getFilteredAppointments() {
    const search = appointmentSearch.value.trim().toLocaleLowerCase();
    const status = appointmentStatusFilter.value;
    const date = appointmentDateFilter.value;
    const direction = appointmentSort.value === "desc" ? -1 : 1;

    return allAppointments.filter((appointment) => {
        const matchesSearch = !search ||
            String(appointment.patientName || "").toLocaleLowerCase().includes(search) ||
            String(appointment.doctorName || "").toLocaleLowerCase().includes(search);
        const matchesStatus = status === "all" || appointment.status === status;
        const matchesDate = !date || appointmentDateKey(appointment.appointmentDate) === date;
        return matchesSearch && matchesStatus && matchesDate;
    }).sort((left, right) => {
        const dateOrder = appointmentDateKey(left.appointmentDate).localeCompare(appointmentDateKey(right.appointmentDate));
        const timeOrder = dateOrder || compareAppointmentTime(left.appointmentTime, right.appointmentTime);
        return (timeOrder || String(left._id || "").localeCompare(String(right._id || ""))) * direction;
    });
}

function renderAppointments() {
    const appointments = getFilteredAppointments();
    const hasFilters = appointmentSearch.value.trim() || appointmentStatusFilter.value !== "all" || appointmentDateFilter.value;
    appointmentCount.textContent = hasFilters
        ? `Showing ${appointments.length} of ${allAppointments.length} appointments`
        : `Total Appointments : ${allAppointments.length}`;

    if (!allAppointments.length) {
        appointmentTableBody.innerHTML = '<tr><td colspan="7" class="appointment-empty">No appointments found.</td></tr>';
        return;
    }
    if (!appointments.length) {
        appointmentTableBody.innerHTML = '<tr><td colspan="7" class="appointment-empty">No appointments match the selected filters.</td></tr>';
        return;
    }

    appointmentTableBody.innerHTML = appointments.map((appointment) => {
        const dateKey = appointmentDateKey(appointment.appointmentDate);
        const formattedDate = dateKey
            ? new Date(`${dateKey}T00:00:00.000Z`).toLocaleDateString("en-GB", { timeZone: "UTC" })
            : "-";
        const patientName = escapeHtml(appointment.patientName || "-");
        const doctorName = escapeHtml(appointment.doctorName || "-");
        const department = escapeHtml(appointment.department || "-");
        const appointmentTime = escapeHtml(appointment.appointmentTime || "-");
        const status = escapeHtml(appointment.status || "-");
        const id = escapeHtml(appointment._id || "");

        return `<tr>
            <td>${patientName}</td>
            <td>${doctorName}</td>
            <td>${department}</td>
            <td>${formattedDate}</td>
            <td>${appointmentTime}</td>
            <td><span class="status ${String(appointment.status || "").toLowerCase()}">${status}</span></td>
            <td>${appointment.status === "Pending"
                ? `<button class="confirm-btn" onclick="confirmAppointment('${id}', this)">Confirm</button>`
                : `<span style="font-weight:600;">${status}</span>`}
            </td>
        </tr>`;
    }).join("");
}

async function loadAppointments(){
    appointmentCount.textContent = "Loading appointments…";
    appointmentTableBody.innerHTML = '<tr><td colspan="7" class="appointment-empty">Loading appointments…</td></tr>';
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

        allAppointments = Array.isArray(data.appointments) ? data.appointments : [];
        renderAppointments();
    }
    catch(error){
        allAppointments = [];
        console.error(error);
        appointmentCount.textContent = "Appointments could not be loaded";
        appointmentTableBody.innerHTML = '<tr><td colspan="7" class="appointment-empty">Appointments could not be loaded.</td></tr>';
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




appointmentSearch.addEventListener("input", renderAppointments);
appointmentStatusFilter.addEventListener("change", renderAppointments);
appointmentDateFilter.addEventListener("change", renderAppointments);
appointmentSort.addEventListener("change", renderAppointments);
document.getElementById("clearAppointmentFilters").addEventListener("click", () => {
    appointmentSearch.value = "";
    appointmentStatusFilter.value = "all";
    appointmentDateFilter.value = "";
    appointmentSort.value = "asc";
    renderAppointments();
});

loadAppointments();

window.addEventListener("pageshow", loadAppointments);
