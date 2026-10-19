(() => {
    const container = document.querySelector(".dashboard-container");
    const sidebar = container?.querySelector(".sidebar");
    const toggle = document.querySelector(".doctor-menu-toggle");
    if (!container || !sidebar || !toggle) return;

    document.body.classList.add("doctor-portal");

    let backdrop = document.querySelector(".doctor-sidebar-backdrop");
    if (!backdrop) {
        backdrop = document.createElement("button");
        backdrop.type = "button";
        backdrop.className = "doctor-sidebar-backdrop";
        backdrop.setAttribute("aria-label", "Close navigation menu");
        document.body.appendChild(backdrop);
    }

    const mobileQuery = window.matchMedia("(max-width: 767px)");
    const setExpanded = (expanded) => toggle.setAttribute("aria-expanded", String(expanded));
    const setMobileOpen = (open) => {
        container.classList.toggle("doctor-sidebar-open", open);
        setExpanded(open);
    };

    toggle.addEventListener("click", () => {
        if (mobileQuery.matches) {
            setMobileOpen(!container.classList.contains("doctor-sidebar-open"));
        } else {
            const collapsed = container.classList.toggle("doctor-sidebar-collapsed");
            setExpanded(!collapsed);
        }
    });

    backdrop.addEventListener("click", () => setMobileOpen(false));
    sidebar.querySelectorAll("a[href]").forEach((link) => {
        link.addEventListener("click", () => {
            if (mobileQuery.matches) setMobileOpen(false);
        });
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && container.classList.contains("doctor-sidebar-open")) {
            setMobileOpen(false);
            toggle.focus();
        }
    });

    mobileQuery.addEventListener("change", () => {
        container.classList.remove("doctor-sidebar-open", "doctor-sidebar-collapsed");
        setExpanded(true);
    });
})();
