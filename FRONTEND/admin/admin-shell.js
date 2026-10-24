(() => {
    const container = document.querySelector(".dashboard-container");
    const sidebar = container?.querySelector(".sidebar");
    const header = container?.querySelector(".main-content .dashboard-header");
    const heading = header?.querySelector(".profile-breadcrumb");
    if (!container || !sidebar || !header || !heading) return;

    let headingGroup = header.querySelector(".admin-heading-group");
    if (!headingGroup) {
        headingGroup = document.createElement("div");
        headingGroup.className = "admin-heading-group";

        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "admin-menu-toggle";
        toggle.setAttribute("aria-label", "Toggle navigation menu");
        toggle.setAttribute("aria-expanded", "true");
        toggle.innerHTML = '<i class="fa-solid fa-bars" aria-hidden="true"></i>';

        header.insertBefore(headingGroup, heading);
        headingGroup.append(toggle, heading);
    }

    const toggle = headingGroup.querySelector(".admin-menu-toggle");
    const navigationLinks = [...sidebar.querySelectorAll(".sidebar-menu a[href]")];
    const updateActiveNavigation = () => {
        const targets = navigationLinks.map((link) => ({
            link,
            url: new URL(link.href, window.location.href)
        }));
        const currentPath = window.location.pathname;
        const exactTarget = targets.find(({ url }) =>
            url.pathname === currentPath && url.hash && url.hash === window.location.hash
        );
        const pageTarget = exactTarget || targets.find(({ url }) =>
            url.pathname === currentPath && !url.hash
        );

        navigationLinks.forEach((link) => {
            const isCurrent = pageTarget?.link === link;
            link.classList.toggle("active", isCurrent);
            if (isCurrent) link.setAttribute("aria-current", "page");
            else link.removeAttribute("aria-current");
        });
    };
    updateActiveNavigation();
    window.addEventListener("hashchange", updateActiveNavigation);

    let backdrop = container.querySelector(".admin-sidebar-backdrop");
    if (!backdrop) {
        backdrop = document.createElement("button");
        backdrop.type = "button";
        backdrop.className = "admin-sidebar-backdrop";
        backdrop.setAttribute("aria-label", "Close navigation menu");
        container.appendChild(backdrop);
    }

    const mobileQuery = window.matchMedia("(max-width: 767px)");
    const setMobileOpen = (open) => {
        container.classList.toggle("admin-sidebar-open", open);
        toggle.setAttribute("aria-expanded", String(open));
    };

    toggle.addEventListener("click", () => {
        if (mobileQuery.matches) {
            setMobileOpen(!container.classList.contains("admin-sidebar-open"));
        } else {
            const collapsed = container.classList.toggle("admin-sidebar-collapsed");
            toggle.setAttribute("aria-expanded", String(!collapsed));
        }
    });

    backdrop.addEventListener("click", () => setMobileOpen(false));
    sidebar.querySelectorAll("a[href]").forEach((link) => {
        link.addEventListener("click", () => {
            if (mobileQuery.matches) setMobileOpen(false);
        });
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && container.classList.contains("admin-sidebar-open")) {
            setMobileOpen(false);
            toggle.focus();
        }
    });

    mobileQuery.addEventListener("change", () => {
        container.classList.remove("admin-sidebar-open", "admin-sidebar-collapsed");
        toggle.setAttribute("aria-expanded", "true");
    });
})();
