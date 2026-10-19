// Read the admin account defensively without changing token validation.
window.getAdminSession = function () {
    try {
        const account = JSON.parse(localStorage.getItem("admin") || "null");
        return account && typeof account === "object" && !Array.isArray(account)
            ? account
            : null;
    } catch {
        return null;
    }
};
