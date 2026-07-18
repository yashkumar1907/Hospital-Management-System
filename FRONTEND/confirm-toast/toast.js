// ===============================
// SHOW TOAST
// ===============================
function showToast(type, message) {
    const validTypes = ["success", "error", "warning", "info"];

    if(!validTypes.includes(type)){
        type = "info";
    }
    
    let container = document.getElementById("toastContainer");

    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";

        document.body.appendChild(container);
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

    toast.innerHTML = `
        <span>${icon} ${message}</span>
        <span class="toast-close">&times;</span>
    `;

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