// Subscribe-only modal. No admin functions or secrets.
(() => {
    "use strict";

    const endpoint = "https://lock-newsletter.gabriel-saint-gelais.workers.dev/api/subscribe";
    const nav = document.querySelector('nav[aria-label="Main navigation"]');
    if (!nav || document.getElementById("newsletter-panel")) return;

    const style = document.createElement("style");
    style.textContent = `
        .newsletter-toggle {
            margin: 0;
            padding: 10px 14px;
            border: 2px solid #fff;
            border-radius: 0;
            background: #111;
            color: #fff;
            font: inherit;
            cursor: pointer;
        }

        .newsletter-toggle:hover,
        .newsletter-panel button:hover {
            background: #fff;
            color: #111;
        }

        dialog.newsletter-panel {
            position: fixed;
            inset: 0;
            width: min(480px, calc(100vw - 32px));
            max-height: calc(100dvh - 32px);
            margin: auto;
            padding: 48px 24px 24px;
            overflow-y: auto;
            border: 3px solid #fff;
            border-radius: 0;
            background: #111;
            color: #fff;
            font: inherit;
            text-align: left;
            overflow-wrap: anywhere;
        }

        .newsletter-panel::backdrop {
            background: rgb(0 0 0 / 75%);
        }

        .newsletter-panel h2 {
            margin: 0 0 16px;
            font-size: 13px;
            font-weight: normal;
            line-height: 2;
        }

        .newsletter-panel label {
            display: block;
            margin-top: 14px;
        }

        .newsletter-panel input[type="email"] {
            box-sizing: border-box;
            width: 100%;
            min-width: 0;
            margin-top: 8px;
            padding: 12px;
            border: 2px solid #fff;
            border-radius: 0;
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
            padding: 12px;
            border: 2px solid #fff;
            border-radius: 0;
            background: #111;
            color: #fff;
            font: inherit;
            cursor: pointer;
        }

        .newsletter-panel button[type="submit"] {
            margin-top: 16px;
        }

        .newsletter-panel .newsletter-close {
            position: absolute;
            top: 10px;
            right: 10px;
            width: 32px;
            height: 32px;
            margin: 0;
            padding: 0;
            font-family: monospace;
            font-size: 24px;
            line-height: 1;
        }

        .newsletter-panel button:disabled {
            opacity: 0.6;
            cursor: wait;
        }

        .newsletter-panel .newsletter-note {
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

        @media (max-width: 560px) {
            .newsletter-toggle {
                font-size: 9px;
                padding: 9px;
            }
        }
    `;
    document.head.append(style);

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "newsletter-toggle";
    toggle.textContent = "Get updates";
    toggle.setAttribute("aria-haspopup", "dialog");
    toggle.setAttribute("aria-controls", "newsletter-panel");
    toggle.setAttribute("aria-expanded", "false");
    nav.append(toggle);

    const panel = document.createElement("dialog");
    panel.id = "newsletter-panel";
    panel.className = "newsletter-panel";
    panel.setAttribute("aria-labelledby", "newsletter-heading");
    panel.innerHTML = `
        <button class="newsletter-close" type="button" aria-label="Close">×</button>
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
                autofocus
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
    document.body.append(panel);

    const form = panel.querySelector("form");
    const email = form.elements.email;
    const submit = form.querySelector('button[type="submit"]');
    const message = panel.querySelector("#newsletter-message");

    toggle.addEventListener("click", () => {
        if (panel.open) return;
        panel.showModal();
        toggle.setAttribute("aria-expanded", "true");
    });

    panel.querySelector(".newsletter-close").addEventListener("click", () => panel.close());

    panel.addEventListener("close", () => {
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
    });

    // Escape closes the native dialog and focus remains inside while open.
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
