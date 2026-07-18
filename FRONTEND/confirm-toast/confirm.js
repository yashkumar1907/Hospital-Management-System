let confirmResolve = null;

function showConfirm({
    title = "Confirm",
    message = "Are you sure?",
    confirmText = "OK",
    cancelText = "Cancel"
}) {

    return new Promise((resolve) => {

        confirmResolve = resolve;

        let overlay = document.getElementById("confirmOverlay");

        if (!overlay) {
            overlay = document.createElement("div");
            overlay.id = "confirmOverlay";

            overlay.innerHTML = `
                <div class="confirm-box">
                    <h2 id="confirmTitle"></h2>
                    <p id="confirmMessage"></p>

                    <div class="confirm-buttons">
                        <button id="confirmCancelBtn" class="confirm-cancel-btn">
                            ${cancelText}
                        </button>

                        <button id="confirmOkBtn" class="confirm-ok-btn">
                            ${confirmText}
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);
        }

        document.getElementById("confirmTitle").innerText = title;
        document.getElementById("confirmMessage").innerText = message;

        document.getElementById("confirmCancelBtn").innerText = cancelText;
        document.getElementById("confirmOkBtn").innerText = confirmText;

        overlay.style.display = "flex";

        document.getElementById("confirmCancelBtn").onclick = () => {
            closeConfirm(false);
        };

        document.getElementById("confirmOkBtn").onclick = () => {
            closeConfirm(true);
        };

        overlay.onclick = (event) => {
            if (event.target === overlay) {
                closeConfirm(false);
            }
        };

        document.onkeydown = (event) => {
            if (event.key === "Escape") {
                closeConfirm(false);
            }
        };
    });
}

function closeConfirm(result) {
    const overlay = document.getElementById("confirmOverlay");

    if (overlay) {
        overlay.style.display = "none";
    }

    document.onkeydown = null;

    if (confirmResolve) {
        confirmResolve(result);
        confirmResolve = null;
    }
}