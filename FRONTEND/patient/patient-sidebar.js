(() => {
    const dashboard = document.querySelector(".dashboard-container");
    const sidebar = document.querySelector(".sidebar");
    const header = document.querySelector(".dashboard-header");

    if (!dashboard || !sidebar || !header) return;

    sidebar.id ||= "patientSidebar";

    let toggle = header.querySelector(".menu-toggle");
    if (!toggle) {
        toggle = document.createElement("button");
        toggle.className = "menu-toggle";
        toggle.type = "button";
        toggle.innerHTML = '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
    }

    // Keep the control in the same header position on every patient page.
    // The dashboard has legacy toggle markup; moving that existing button
    // preserves its listeners and avoids creating a second control.
    if (header.firstElementChild !== toggle) header.insertBefore(toggle, header.firstElementChild);

    toggle.type = "button";
    toggle.setAttribute("aria-controls", sidebar.id);

    const backdrop = document.createElement("div");
    backdrop.className = "patient-sidebar-backdrop";
    backdrop.setAttribute("aria-hidden", "true");
    dashboard.appendChild(backdrop);

    const mobileQuery = window.matchMedia("(max-width: 768px)");
    const collapsedKey = "patientSidebarCollapsed";

    const isCollapsed = () => dashboard.classList.contains("patient-sidebar-collapsed");
    const isDrawerOpen = () => dashboard.classList.contains("patient-drawer-open");

    const updateToggle = () => {
        const expanded = mobileQuery.matches ? isDrawerOpen() : !isCollapsed();
        toggle.setAttribute("aria-expanded", String(expanded));
        toggle.setAttribute(
            "aria-label",
            mobileQuery.matches
                ? (expanded ? "Close navigation menu" : "Open navigation menu")
                : (expanded ? "Collapse sidebar" : "Expand sidebar")
        );
        const icon = toggle.querySelector("i");
        if (icon) icon.className = `fa-solid ${mobileQuery.matches && expanded ? "fa-xmark" : "fa-bars"}`;
    };

    const setDrawerOpen = (open, restoreFocus = false) => {
        dashboard.classList.toggle("patient-drawer-open", open);
        document.body.classList.toggle("patient-drawer-open", open);
        updateToggle();
        if (!open && restoreFocus) toggle.focus();
    };

    const syncViewport = () => {
        if (mobileQuery.matches) {
            dashboard.classList.remove("patient-sidebar-collapsed");
            setDrawerOpen(false);
        } else {
            setDrawerOpen(false);
            try {
                dashboard.classList.toggle("patient-sidebar-collapsed", sessionStorage.getItem(collapsedKey) === "true");
            } catch {}
            updateToggle();
        }
    };

    syncViewport();

    toggle.addEventListener("click", () => {
        if (mobileQuery.matches) {
            setDrawerOpen(!isDrawerOpen());
            return;
        }

        const collapsed = !isCollapsed();
        dashboard.classList.toggle("patient-sidebar-collapsed", collapsed);
        try { sessionStorage.setItem(collapsedKey, String(collapsed)); } catch {}
        updateToggle();
    });

    backdrop.addEventListener("click", () => setDrawerOpen(false, true));

    sidebar.addEventListener("click", (event) => {
        if (mobileQuery.matches && event.target.closest("a")) setDrawerOpen(false);

        if (event.target.closest("#logoutBtn")) {
            // The existing page logout handler opens this shared prompt during
            // the same click. Scope the patient theme to that prompt only.
            window.setTimeout(() => {
                const overlay = document.getElementById("confirmOverlay");
                const title = document.getElementById("confirmTitle");
                if (!overlay || title?.textContent.trim() !== "Logout") return;

                overlay.classList.add("patient-logout-confirm");
                const cleanup = new MutationObserver(() => {
                    if (overlay.style.display === "none") {
                        overlay.classList.remove("patient-logout-confirm");
                        cleanup.disconnect();
                    }
                });
                cleanup.observe(overlay, { attributes: true, attributeFilter: ["style"] });
            }, 0);
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && mobileQuery.matches && isDrawerOpen()) {
            setDrawerOpen(false, true);
        }
    });

    mobileQuery.addEventListener("change", syncViewport);
})();
