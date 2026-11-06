// Subscribe-only panel. No admin functions or secrets.
(() => {
    "use strict";

    const endpoint = "https://lock-newsletter.gabriel-saint-gelais.workers.dev/api/subscribe";
    const nav = document.querySelector('nav[aria-label="Main navigation"]');
    if (!nav || document.getElementById("newsletter-panel")) return;

    const style = document.createElement("style");
    style.textContent = `
        .newsletter-toggle {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 42px;
            align-self: stretch;
            margin: 0;
            padding: 8px;
            border: 2px solid #fff;
            background: #111;
            color: #fff;
            font: inherit;
            cursor: pointer;
        }

        .newsletter-toggle:hover,
        .newsletter-toggle[aria-expanded="true"] {
            background: #fff;
            color: #111;
        }

        .newsletter-panel {
            width: min(100%, 420px);
            margin: 18px 0 0 auto;
            padding: 20px;
            border: 2px solid #fff;
            background: #111;
            color: #fff;
            font: inherit;
            text-align: left;
            overflow-wrap: anywhere;
        }

        .newsletter-panel[hidden] {
            display: none !important;
        }

        .newsletter-panel h2 {
            margin: 0 0 16px;
            font-size: 12px;
            line-height: 2;
        }

        .newsletter-panel label {
            display: block;
            margin-top: 14px;
        }

        .newsletter-panel input[type="email"] {
            width: 100%;
            min-width: 0;
            margin-top: 8px;
            padding: 12px;
            border: 2px solid #fff;
            background: #111;
            color: #fff;
            font: inherit;
        }

        .newsletter-panel input[type="checkbox"] {
            width: 18px;
            height: 18px;
            margin-right: 8px;
            vertical-align: middle;
            accent-color: #fff;
        }

        .newsletter-panel button {
            margin-top: 16px;
            padding: 12px;
            border: 2px solid #fff;
            background: #111;
            color: #fff;
            font: inherit;
            cursor: pointer;
        }

        .newsletter-panel button:hover {
            background: #fff;
            color: #111;
        }

        .newsletter-panel button:disabled {
            opacity: 0.6;
            cursor: wait;
        }

        .newsletter-note {
            color: #bbb;
            font-size: 9px;
            line-height: 2.2;
        }

        .newsletter-panel a {
            color: #87ceeb;
        }

        .newsletter-trap {
            position: absolute;
            left: -10000px;
        }

        .newsletter-toggle:focus-visible,
        .newsletter-panel :focus-visible {
            outline: 2px dashed #87ceeb;
            outline-offset: 4px;
        }
    `;
    document.head.append(style);

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "newsletter-toggle";
    toggle.textContent = "+";
    toggle.title = "Subscribe to article updates";
    toggle.setAttribute("aria-label", "Subscribe to article updates");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-controls", "newsletter-panel");
    nav.append(toggle);

    const panel = document.createElement("section");
    panel.id = "newsletter-panel";
    panel.className = "newsletter-panel";
    panel.hidden = true;
    panel.setAttribute("aria-labelledby", "newsletter-heading");
    panel.innerHTML = `
        <h2 id="newsletter-heading">STAY INFORMED</h2>
        <p>New articles, by email.</p>

        <form id="newsletter-form">
            <label for="newsletter-email">Email address</label>
            <input
                id="newsletter-email"
                name="email"
                type="email"
                autocomplete="email"
                maxlength="254"
                required
            >

            <div class="newsletter-trap" aria-hidden="true">
                <label for="newsletter-website">Leave this field empty</label>
                <input
                    id="newsletter-website"
                    name="website"
                    type="text"
                    tabindex="-1"
                    autocomplete="off"
                >
            </div>

            <label class="newsletter-note" for="newsletter-consent">
                <input id="newsletter-consent" type="checkbox" required>
                I agree to receive new-article updates from The Lock Corner
                by Gabriel Lavoie-St-Gelais.
            </label>

            <button type="submit">Subscribe</button>
        </form>

        <p id="newsletter-message" role="status" aria-live="polite"></p>
        <p class="newsletter-note">
            Your email is stored for article updates.
            No confirmation email is sent.
        </p>
        <p class="newsletter-note">
            Contact:
            <a href="mailto:Gabriel.saint.gelais+lock@gmail.com">
                Gabriel.saint.gelais+lock@gmail.com
            </a>
        </p>
    `;
    nav.insertAdjacentElement("afterend", panel);

    const form = panel.querySelector("form");
    const email = form.elements.email;
    const submit = form.querySelector('button[type="submit"]');
    const message = panel.querySelector("#newsletter-message");

    function setOpen(open, returnFocus = false) {
        panel.hidden = !open;
        toggle.setAttribute("aria-expanded", String(open));
        toggle.textContent = open ? "−" : "+";
        if (open) email.focus();
        else if (returnFocus) toggle.focus();
    }

    toggle.addEventListener("click", () => setOpen(panel.hidden));
    panel.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            event.preventDefault();
            setOpen(false, true);
        }
    });

    form.addEventListener("submit", async event => {
        event.preventDefault();
        submit.disabled = true;
        message.textContent = "Please wait...";
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                credentials: "omit",
                signal: controller.signal,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: email.value.trim(),
                    website: form.elements.website.value,
                    consent: panel.querySelector("#newsletter-consent").checked
                })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Subscription failed.");
            message.textContent = data.message || "Request received.";
            form.reset();
        } catch (error) {
            message.textContent = error.name === "AbortError"
                ? "The request timed out. Please try again later."
                : error instanceof TypeError
                    ? "Could not connect. Please try again later."
                    : error.message;
        } finally {
            clearTimeout(timeout);
            submit.disabled = false;
        }
    });
})();
