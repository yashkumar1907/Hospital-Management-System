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
            throw new Error(doctorsData.message || "Unable to load doctors.");
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
            throw new Error(patientsData.message || "Unable to load patients.");
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
            throw new Error(appointmentsData.message || "Unable to load appointments.");
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
        showToast("error", error.message);
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
            : "../../assets/default-patient.jpg";

        const patientName = escapeHtml(appointment.patientName || "-");
        
        const department = escapeHtml(appointment.department || "-");
        
        const status = escapeHtml(appointment.status || "-");
        const appointmentTime = escapeHtml(appointment.appointmentTime || "-");

        return `
            <div class="appointment-row">
                <div class="appointment-user">
                    <img src="${escapeHtml(patientPhoto)}" alt="${patientName}">

                    <div>
                        <h4>${patientName}</h4>
                        <p>${department}</p>
                    </div>
                </div>

                <div class="appointment-date">
                    <p>${new Date(appointment.appointmentDate).toLocaleDateString("en-GB")}</p>
                    <span>${appointmentTime}</span>
                </div>

                <span class="status ${statusClass}">
                    ${status}
                </span>

            </div>
        `;
    }).join("");
}


function renderAppointmentsChart(appointments){
    const monthlyCounts = Array(12).fill(0);
    const currentYear = new Date().getUTCFullYear();

    appointments.forEach(appointment => {
        const appointmentDate = new Date(appointment.appointmentDate);
        if (!Number.isNaN(appointmentDate.getTime()) && appointmentDate.getUTCFullYear() === currentYear) {
            monthlyCounts[appointmentDate.getUTCMonth()]++;
        }
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
        window.location.href = "../login/admin-login.html";
    }, 700);
});


loadDashboard();

window.addEventListener("pageshow", loadDashboard);

const analyticsRange = document.getElementById("analyticsRange");
const customRange = document.getElementById("customRange");
let analyticsRequest = 0;

function localDateInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
}

function getAnalyticsDates() {
    const endDate = new Date();
    endDate.setHours(0, 0, 0, 0);
    if (analyticsRange.value === "custom") return { start: document.getElementById("analyticsStart").value, end: document.getElementById("analyticsEnd").value };
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - (analyticsRange.value === "today" ? 0 : Number(analyticsRange.value) - 1));
    return { start: localDateInput(startDate), end: localDateInput(endDate) };
}

function destroyAnalyticsCharts() {
    ["analyticsTrendChart", "analyticsStatusChart", "analyticsWorkloadChart"].forEach((id) => Chart.getChart(id)?.destroy());
}

function renderAnalyticsCharts(data) {
    destroyAnalyticsCharts();
    const palette = ["#2563eb", "#16a34a", "#f97316", "#dc2626", "#7c3aed", "#0891b2"];
    const trendLabels = data.trends.map((item) => {
        const date = item.date.length === 7 ? new Date(`${item.date}-01T00:00:00.000Z`) : new Date(`${item.date}T00:00:00.000Z`);
        return date.toLocaleDateString("en-IN", data.period.grouping === "monthly"
            ? { timeZone: "UTC", month: "short", year: "numeric" }
            : { timeZone: "UTC", day: "2-digit", month: "short" });
    });
    new Chart(document.getElementById("analyticsTrendChart"), {
        type: "line", data: { labels: trendLabels, datasets: [{ label: "Appointments", data: data.trends.map((item) => item.count), borderColor: "#2563eb", backgroundColor: "rgba(37,99,235,.12)", fill: true, tension: .3 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { title: (items) => data.trends[items[0].dataIndex]?.date || "" } } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { ticks: { autoSkip: data.period.grouping === "monthly", maxRotation: 45, minRotation: data.period.grouping === "daily" ? 45 : 0 } } } }
    });
    new Chart(document.getElementById("analyticsStatusChart"), {
        type: "doughnut", data: { labels: data.statuses.map((item) => item.status), datasets: [{ data: data.statuses.map((item) => item.count), backgroundColor: palette }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }
    });
    const workloadCounts = data.doctorWorkload.map((item) => item.count);
    const workloadMax = Math.max(5, Math.ceil(Math.max(0, ...workloadCounts) * 1.5));
    new Chart(document.getElementById("analyticsWorkloadChart"), {
        type: "bar", data: { labels: data.doctorWorkload.map((item) => item.doctorName || "Unknown doctor"), datasets: [{ label: "Appointments", data: workloadCounts, backgroundColor: "#7c9be8", borderRadius: 5, maxBarThickness: 32 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (context) => ` ${context.parsed.y} appointments` } } }, scales: { y: { beginAtZero: true, max: workloadMax, ticks: { precision: 0, stepSize: Math.max(1, Math.ceil(workloadMax / 5)) } }, x: { ticks: { autoSkip: false, maxRotation: 40, minRotation: 0 } } } }
    });
}

function renderAnalyticsRecent(appointments) {
    const tbody = document.getElementById("analyticsRecentRows");
    if (!appointments.length) {
        tbody.innerHTML = '<tr><td colspan="4" class="analytics-empty">No appointments in this period.</td></tr>';
        return;
    }
    tbody.innerHTML = appointments.map((item) => {
        const date = item.appointmentDate ? new Date(item.appointmentDate).toLocaleDateString("en-IN", { timeZone: "UTC", day: "2-digit", month: "short", year: "numeric" }) : "-";
        return `<tr><td>${escapeHtml(item.patientName)}</td><td>${escapeHtml(item.doctorName)}</td><td>${date} · ${escapeHtml(item.appointmentTime)}</td><td>${escapeHtml(item.status)}</td></tr>`;
    }).join("");
}

async function loadAnalytics() {
    const requestId = ++analyticsRequest;
    const message = document.getElementById("analyticsMessage");
    const dates = getAnalyticsDates();
    if (!dates.start || !dates.end || dates.start > dates.end) {
        message.textContent = "Choose a valid date range with the start date on or before the end date.";
        message.className = "analytics-message error";
        return;
    }
    message.textContent = "Loading analytics…";
    message.className = "analytics-message";
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/admin/analytics?start=${encodeURIComponent(dates.start)}&end=${encodeURIComponent(dates.end)}`, { headers: { Authorization: `Bearer ${token}` } });
        if (response.status === 401 || response.status === 403) {
            if (response.status === 401) { localStorage.clear(); window.location.href = "../login/admin-login.html"; }
            throw new Error(response.status === 403 ? "Admin access is required to view analytics." : "Your session has expired.");
        }
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Unable to load analytics.");
        if (requestId !== analyticsRequest) return;
        document.getElementById("analyticsPatients").textContent = result.kpis.registeredPatients;
        document.getElementById("analyticsAppointments").textContent = result.kpis.totalAppointments;
        document.getElementById("analyticsCompleted").textContent = result.kpis.completedAppointments;
        document.getElementById("analyticsCancellation").textContent = result.kpis.cancellationRate + "%";
        renderAnalyticsCharts(result);
        renderAnalyticsRecent(result.recentAppointments);
        message.textContent = result.kpis.totalAppointments ? `Showing ${result.period.grouping} data from ${result.period.start} to ${result.period.end}.` : "No appointments found for this period. Patient total includes all registered patients.";
    } catch (error) {
        if (requestId !== analyticsRequest) return;
        message.textContent = error.message || "Unable to load analytics.";
        message.className = "analytics-message error";
        destroyAnalyticsCharts();
        document.getElementById("analyticsRecentRows").innerHTML = '<tr><td colspan="4" class="analytics-empty">Analytics could not be loaded.</td></tr>';
    }
}

analyticsRange.addEventListener("change", () => {
    customRange.hidden = analyticsRange.value !== "custom";
    if (analyticsRange.value !== "custom") loadAnalytics();
    else {
        const end = new Date();
        const start = new Date(end);
        start.setDate(start.getDate() - 6);
        document.getElementById("analyticsStart").value = localDateInput(start);
        document.getElementById("analyticsEnd").value = localDateInput(end);
    }
});
document.getElementById("applyAnalyticsRange").addEventListener("click", loadAnalytics);
loadAnalytics();
