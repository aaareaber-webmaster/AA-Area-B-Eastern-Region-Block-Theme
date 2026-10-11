/* Sliding panels for the custom Navigation overlay. */
document
  .querySelectorAll("ul.area-overlay-navigation")
  .forEach((root) => {
    const overlay = root.closest(".wp-block-navigation__responsive-container");
    if (!overlay) return;

    // Page List wraps its items in another ul. Flatten it so the panel
    // path selectors operate on direct li children of the navigation root.
    root.querySelectorAll(":scope > ul.wp-block-page-list").forEach((pageList) => {
      pageList.replaceWith(...pageList.childNodes);
    });

    const stack = [];
    let transitioning = false;

    overlay.addEventListener(
      "focusout",
      (event) => {
        if (transitioning) {
          event.stopImmediatePropagation();
        }
      },
      true,
    );

    root.classList.add("area-slide-navigation");

    root.querySelectorAll(".has-child").forEach((item) => {
      const panel = item.querySelector(
        ":scope > .wp-block-navigation__submenu-container",
      );

      if (!panel) return;

      let toggle = item.querySelector(
        ":scope > .wp-block-navigation-submenu__toggle",
      );

      /*
       * core/page-list does not output submenu toggle buttons.
       * Create one so the custom sliding overlay can use the same
       * interaction model as Navigation Submenu blocks.
       */
      if (!toggle) {
        const link = item.querySelector(
          ":scope > .wp-block-pages-list__item__link, " +
            ":scope > .wp-block-navigation-item__content",
        );

        if (!link) return;

        const label = link.textContent.trim();

        toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className =
          "wp-block-navigation-submenu__toggle area-slide-toggle";

        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", `Open submenu for ${label}`);

        toggle.innerHTML = `
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="12"
					height="12"
					viewBox="0 0 24 24"
					aria-hidden="true"
					focusable="false"
				>
					<path d="M9 18l6-6-6-6"/>
				</svg>
			`;

        link.insertAdjacentElement("afterend", toggle);
      }

      const link = item.querySelector(
        ":scope > .wp-block-pages-list__item__link, " +
          ":scope > .wp-block-navigation-item__content",
      );

      const label = link?.textContent.trim() || toggle.textContent.trim();

      const row = document.createElement("li");
      row.className = "area-slide-heading";

      const back = document.createElement("button");
      back.type = "button";
      back.className = "area-slide-back";
      back.textContent = "‹ Back";
      back.setAttribute("aria-label", `Back from ${label}`);

      const title = document.createElement("span");
      title.textContent = label;

      row.append(back, title);
      panel.prepend(row);

      toggle.addEventListener("click", () => {
        transitioning = true;

        const previous = stack.length ? stack[stack.length - 1].panel : root;

        previous.classList.remove("area-slide-current");
        previous.classList.add("area-slide-path");

        item.classList.add("area-slide-branch");
        panel.classList.add("area-slide-current");

        toggle.setAttribute("aria-expanded", "true");

        stack.push({
          panel,
          item,
          toggle,
          previous,
          back,
        });

        back.focus();
        transitioning = false;
      });

      back.addEventListener("click", () => {
        goBack();
      });
    });

    function goBack(restoreFocus = true) {
      const entry = stack.pop();

      if (!entry) return;

      transitioning = true;

      entry.panel.classList.remove("area-slide-current");
      entry.item.classList.remove("area-slide-branch");

      entry.previous.classList.remove("area-slide-path");
      entry.previous.classList.add("area-slide-current");

      entry.toggle.setAttribute("aria-expanded", "false");

      if (restoreFocus) {
        entry.toggle.focus();
      }

      transitioning = false;
    }

    root.classList.add("area-slide-current");

    overlay.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Escape" && stack.length) {
          event.preventDefault();
          event.stopImmediatePropagation();
          goBack();
          return;
        }

        if (event.key === "Tab") {
          const controls = [
            ...overlay.querySelectorAll('a[href], button, [tabindex="0"]'),
          ].filter(
            (element) =>
              element.getClientRects().length &&
              getComputedStyle(element).visibility !== "hidden",
          );

          const first = controls[0];
          const last = controls[controls.length - 1];

          if (
            (event.shiftKey && document.activeElement === first) ||
            (!event.shiftKey && document.activeElement === last)
          ) {
            event.preventDefault();

            (event.shiftKey ? last : first)?.focus();
          }

          /*
           * Core caches focus endpoints before a submenu
           * panel is opened.
           */
          event.stopImmediatePropagation();
        }
      },
      true,
    );

    new MutationObserver(() => {
      if (!overlay.classList.contains("is-menu-open")) {
        while (stack.length) {
          goBack(false);
        }
      }
    }).observe(overlay, {
      attributes: true,
      attributeFilter: ["class"],
    });
  });
