const isLocalDevelopment = ["localhost", "127.0.0.1"].includes(window.location.hostname);

const CONFIG = Object.freeze({
    API_BASE_URL: isLocalDevelopment
        ? `http://${window.location.hostname}:5000`
        : "https://hospital-management-system-backend-ls3k.onrender.com"
});

window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;

    const pathname = window.location.pathname;
    const role = ["patient", "doctor", "admin"].find((candidate) =>
        pathname.includes(`/${candidate}/`)
    );

    if (!role || /\/(login|register)\//.test(pathname)) return;

    const token = localStorage.getItem("token");
    let account;
    let claims;

    try {
        account = JSON.parse(localStorage.getItem(role) || "null");
        claims = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    } catch {
        claims = null;
    }

    if (!token || account?.role !== role || claims?.role !== role || claims.exp * 1000 <= Date.now()) {
        localStorage.clear();
        window.location.replace(`/${role}/login/${role}-login.html`);
    }
});
