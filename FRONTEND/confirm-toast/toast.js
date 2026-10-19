// ===============================
// SHOW TOAST
// ===============================
function showToast(type, message) {
    const validTypes = ["success", "error", "warning", "info"];
    const patientNotification = window.location.pathname.includes("/patient/");
    const doctorNotification = window.location.pathname.includes("/doctor/");

    if(!validTypes.includes(type)){
        type = "info";
    }
    
    let container = document.getElementById("toastContainer");

    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";

        document.body.appendChild(container);
    }

    if (patientNotification) {
        container.classList.add("patient-toast-container");
    } else if (doctorNotification) {
        container.classList.add("doctor-toast-container");
    }

    let icon = "";

    switch (type) {
        case "success":
            icon = "✅";
            break;

        case "error":
            icon = "❌";
            break;

        case "warning":
            icon = "⚠️";
            break;

        case "info":
            icon = "ℹ️";
            break;
    }

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    const messageSpan = document.createElement("span");

    if (patientNotification || doctorNotification) {
        const content = document.createElement("span");
        content.className = "toast-content";

        const iconSpan = document.createElement("span");
        iconSpan.className = "toast-icon";
        iconSpan.setAttribute("aria-hidden", "true");
        iconSpan.textContent = { success: "✓", error: "×", warning: "!", info: "i" }[type];

        messageSpan.className = "toast-message";
        messageSpan.innerText = message;
        content.append(iconSpan, messageSpan);
        toast.appendChild(content);
    } else {
        messageSpan.innerText = `${icon} ${message}`;
        toast.appendChild(messageSpan);
    }

    const closeSpan = document.createElement("span");
    closeSpan.className = "toast-close";
    closeSpan.innerHTML = "&times;";

    toast.appendChild(closeSpan);

    container.appendChild(toast);

    // Close button
    toast.querySelector(".toast-close").addEventListener("click", () => {
        removeToast(toast);
    });

    // Auto remove after 3 seconds
    setTimeout(() => {
        removeToast(toast);
    }, 3000);
}


// ===============================
// REMOVE TOAST
// ===============================
function removeToast(toast) {
    toast.style.animation = "fadeOut 0.3s ease";

    setTimeout(() => {
        toast.remove();
    }, 300);
}
