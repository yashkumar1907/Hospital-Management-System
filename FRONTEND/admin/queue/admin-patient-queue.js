const admin = window.getAdminSession();
const token = localStorage.getItem("token");

if (!admin || !token || admin.role !== "admin") {
    localStorage.clear();
    window.location.href = "../login/admin-login.html";
}

const adminName = admin?.name || "Admin";
document.getElementById("adminName").textContent = adminName;
document.getElementById("profileAvatar").textContent = adminName.split(" ").slice(0, 2).map((part) => part[0] || "").join("").toUpperCase();

const dateInput = document.getElementById("queueDate");
const queueRows = document.getElementById("queueRows");
const notice = document.getElementById("queueNotice");
let queueData = [];
let queueLoading = false;
let refreshPending = false;

function localDateValue(date) {
    return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
}

dateInput.value = localDateValue(new Date());

function renderQueue() {
    const statusFilter = document.getElementById("queueStatusFilter").value;
    const search = document.getElementById("queueSearch").value.trim().toLocaleLowerCase();
    const visible = queueData.filter((item) => {
        const matchesStatus = statusFilter === "all" || item.status === statusFilter;
        const matchesSearch = !search || item.patientName.toLocaleLowerCase().includes(search) || String(item.queueNumber).includes(search.replace(/^#/, ""));
        return matchesStatus && matchesSearch;
    });

    if (!queueData.length) {
        queueRows.innerHTML = '<tr><td colspan="5" class="queue-empty">There are no appointments for this date.</td></tr>';
        return;
    }
    if (!visible.length) {
        queueRows.innerHTML = '<tr><td colspan="5" class="queue-empty">No appointments match these filters.</td></tr>';
        return;
    }

    queueRows.innerHTML = visible.map((item) => {
        const statusClass = item.status.toLowerCase().replaceAll(" ", "-");
        const appointmentDate = item.appointmentDate
            ? new Date(item.appointmentDate).toLocaleDateString("en-IN", { timeZone: "UTC", day: "2-digit", month: "short", year: "numeric" })
            : "-";
        return `<tr>
            <td><span class="queue-number">#${item.queueNumber}</span></td>
            <td>${escapeHtml(item.patientName || "-")}</td>
            <td>${escapeHtml(item.doctorName || "-")}</td>
            <td>${appointmentDate}<br><span>${escapeHtml(item.appointmentTime || "-")}</span></td>
            <td><span class="queue-status ${statusClass}">${escapeHtml(item.status)}</span></td>
        </tr>`;
    }).join("");
}

async function loadQueue() {
    if (queueLoading) { refreshPending = true; return; }
    queueLoading = true;
    notice.className = "queue-notice";
    notice.textContent = "Loading queue…";
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/admin/queue?date=${encodeURIComponent(dateInput.value)}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (response.status === 401) {
            localStorage.clear();
            window.location.href = "../login/admin-login.html";
            return;
        }
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Unable to load the patient queue.");
        queueData = data.queue || [];
        document.getElementById("pendingApprovalCount").textContent = data.stats?.["Approved Pending"] ?? 0;
        document.getElementById("approvedCount").textContent = data.stats?.Approved ?? 0;
        document.getElementById("completedCount").textContent = data.stats?.Completed ?? 0;
        const selectedDate = new Date(`${data.date}T00:00:00.000Z`).toLocaleDateString("en-IN", { timeZone: "UTC", day: "2-digit", month: "long", year: "numeric" });
        document.getElementById("queueDateLabel").textContent = `Appointments scheduled for ${selectedDate}`;
        notice.textContent = `${queueData.length} queue ${queueData.length === 1 ? "entry" : "entries"} · Updates automatically every 15 seconds.`;
        renderQueue();
    } catch (error) {
        queueData = [];
        document.getElementById("pendingApprovalCount").textContent = "—";
        document.getElementById("approvedCount").textContent = "—";
        document.getElementById("completedCount").textContent = "—";
        notice.className = "queue-notice error";
        notice.textContent = error.message || "Unable to connect to the server.";
        queueRows.innerHTML = '<tr><td colspan="5" class="queue-empty">Queue data could not be loaded. It will retry automatically.</td></tr>';
    } finally {
        queueLoading = false;
        if (refreshPending) {
            refreshPending = false;
            loadQueue();
        }
    }
}

dateInput.addEventListener("change", loadQueue);
document.getElementById("queueStatusFilter").addEventListener("change", renderQueue);
document.getElementById("queueSearch").addEventListener("input", renderQueue);
document.getElementById("logoutBtn").addEventListener("click", async (event) => {
    event.preventDefault();
    const confirmed = await showConfirm({ title: "Logout", message: "Are you sure you want to logout?", confirmText: "Logout", cancelText: "Cancel" });
    if (!confirmed) return;
    localStorage.clear();
    showToast("success", "Logged out successfully.");
    setTimeout(() => { window.location.href = "../login/admin-login.html"; }, 700);
});

loadQueue();
const queueRefreshTimer = setInterval(loadQueue, 15000);
window.addEventListener("pagehide", () => clearInterval(queueRefreshTimer), { once: true });
