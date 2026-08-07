const doctor = JSON.parse(localStorage.getItem("doctor"));
const token = localStorage.getItem("token");

if (!doctor || !token || doctor.role !== "doctor") {
    localStorage.clear();
    window.location.href = "../login/doctor-login.html";
}

document.getElementById("doctorName").textContent = doctor.name;

const slotDate = document.getElementById("slotDate");
const generateBtn = document.getElementById("generateBtn");
const slotsContainer = document.getElementById("slotsContainer");

const today = new Date().toISOString().split("T")[0];
slotDate.min = today;
slotDate.value = today;

slotDate.addEventListener("change", loadSlots);

generateBtn.addEventListener("click", generateSlots);

async function generateSlots() {

    if (!slotDate.value) {
        showToast("warning", "Please select a date.");
        return;
    }

    generateBtn.disabled = true;
    generateBtn.innerHTML =
        `<i class="fa-solid fa-spinner fa-spin"></i> Generating...`;

    try {

        const response = await fetch(
            `${CONFIG.API_BASE_URL}/api/doctor-slots/generate`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    date: slotDate.value
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            showToast("error", data.message);
        } else {
            showToast("success", data.message);
        }

        loadSlots();

    }
    catch (error) {

        console.error(error);

        showToast("error", "Unable to connect to server.");

    }

    generateBtn.disabled = false;
    generateBtn.innerHTML =
        `<i class="fa-solid fa-plus"></i> Generate Slots`;

}

async function loadSlots() {

    if (!slotDate.value) return;

    slotsContainer.innerHTML =
        `<div class="empty-state">Loading...</div>`;

    try {

        const response = await fetch(
            `${CONFIG.API_BASE_URL}/api/doctor-slots/my-slots/${slotDate.value}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {

            slotsContainer.innerHTML =
                `<div class="empty-state">${data.message}</div>`;

            return;
        }

        if (data.slots.length === 0) {

            slotsContainer.innerHTML =
                `<div class="empty-state">
                    No slots generated for this date.
                </div>`;

            return;
        }

        slotsContainer.innerHTML = "";

        data.slots.forEach(slot => {

            let statusClass = slot.status.toLowerCase();

            let button = "";

            if (slot.status === "Available") {

                button = `
                    <button
                        class="slot-btn block-btn"
                        onclick="blockSlot('${slot._id}')">
                        Block
                    </button>
                `;

            }

            if (slot.status === "Blocked") {

                button = `
                    <button
                        class="slot-btn unblock-btn"
                        onclick="unblockSlot('${slot._id}')">
                        Unblock
                    </button>
                `;

            }

            slotsContainer.innerHTML += `
                <div class="slot-item">

                    <div>

                        <div class="slot-time">
                            ${slot.startTime} - ${slot.endTime}
                        </div>

                        <div class="slot-status ${statusClass}">
                            ${slot.status}
                        </div>

                    </div>

                    ${button}

                </div>
            `;

        });

    }
    catch (error) {

        console.error(error);

        slotsContainer.innerHTML =
            `<div class="empty-state">
                Unable to load slots.
            </div>`;

    }

}

async function blockSlot(id) {

    const confirmed = await showConfirm({
        title: "Block Slot",
        message: "Do you want to block this slot?",
        confirmText: "Block",
        cancelText: "Cancel"
    });

    if (!confirmed) return;

    const response = await fetch(
        `${CONFIG.API_BASE_URL}/api/doctor-slots/block/${id}`,
        {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    const data = await response.json();

    showToast(response.ok ? "success" : "error", data.message);

    loadSlots();

}

async function unblockSlot(id) {

    const confirmed = await showConfirm({
        title: "Unblock Slot",
        message: "Do you want to unblock this slot?",
        confirmText: "Unblock",
        cancelText: "Cancel"
    });

    if (!confirmed) return;

    const response = await fetch(
        `${CONFIG.API_BASE_URL}/api/doctor-slots/unblock/${id}`,
        {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    const data = await response.json();

    showToast(response.ok ? "success" : "error", data.message);

    loadSlots();

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
        window.location.href = "../login/doctor-login.html";
    }, 700);

});

loadSlots();