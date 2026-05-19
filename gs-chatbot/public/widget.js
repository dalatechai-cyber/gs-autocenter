// GS Auto Center Chatbot Widget
// Embed via: <script async src="https://gs-autocenter-chatbot.vercel.app/widget.js"></script>
//
// Architecture: mirrors dalatech.online's pattern exactly.
//  - A floating bubble button is the only thing this script injects directly.
//  - The chat panel is the standalone chatbot page loaded via <iframe>, so the
//    look, layout, animations, quick replies, and message logic always match
//    what visitors see at gs-autocenter-chatbot.vercel.app on its own.
//  - Open/close state is held in sessionStorage so it survives in-tab nav but
//    does not bleed across browser tabs.

(function () {
    const currentScript = document.currentScript;
    const scriptOrigin = currentScript
        ? new URL(currentScript.src).origin
        : window.location.origin;

    if (window.__GS_CHAT_WIDGET_INITIALIZED__) {
        console.warn("GS Auto Center chat widget already initialized");
        return;
    }
    window.__GS_CHAT_WIDGET_INITIALIZED__ = true;

    const FRAME_URL = scriptOrigin + "/";
    const STATE_KEY = "gs-chat-widget-open";

    // Brand palette — kept narrow so it's easy to retune without touching markup.
    const C = {
        red:        "#DC0D01",
        redSoft:    "rgba(220, 13, 1, 0.55)",
        redFaint:   "rgba(220, 13, 1, 0.18)",
        redCore:    "rgba(220, 13, 1, 0.32)",
        redInk:     "#1A0303",
        ink:        "#0E0E0E",
        ink2:       "#131313",
        textMain:   "#F3F3F3",
    };

    const styles = `
        #gs-chat-toggle, #gs-chat-frame {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }
        #gs-chat-toggle *, #gs-chat-frame * { box-sizing: border-box; }

        /* ============== FLOATING BUTTON ============== */

        #gs-chat-toggle {
            position: fixed;
            bottom: 22px;
            right: 22px;
            z-index: 2147483646;
            width: 58px;
            height: 58px;
            border-radius: 50%;
            border: 1px solid ${C.redCore};
            background:
                radial-gradient(60% 60%, rgba(220, 13, 1, 0.22), transparent 70%),
                linear-gradient(${C.redInk} 0%, ${C.ink} 100%);
            color: #FFFFFF;
            cursor: pointer;
            pointer-events: auto;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            box-shadow:
                0 18px 40px -14px ${C.redSoft},
                0 0 0 1px ${C.redFaint} inset,
                0 0 36px -6px ${C.redSoft};
            transition:
                transform 280ms cubic-bezier(0.16, 1, 0.3, 1),
                box-shadow 280ms cubic-bezier(0.16, 1, 0.3, 1),
                border-color 280ms cubic-bezier(0.16, 1, 0.3, 1);
            outline: none;
            isolation: isolate;
        }
        #gs-chat-toggle:hover {
            transform: translateY(-2px);
            border-color: ${C.redSoft};
            box-shadow:
                0 24px 50px -14px rgba(220, 13, 1, 0.70),
                0 0 0 1px rgba(220, 13, 1, 0.42) inset,
                0 0 48px -6px ${C.redSoft};
        }
        #gs-chat-toggle:focus-visible {
            outline: 2px solid ${C.red};
            outline-offset: 3px;
        }
        #gs-chat-toggle:active { transform: translateY(0) scale(0.96); }

        /* Orb / cross icon stack */
        #gs-chat-toggle .gs-orb,
        #gs-chat-toggle .gs-cross {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            transition:
                opacity 220ms cubic-bezier(0.16, 1, 0.3, 1),
                transform 260ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        #gs-chat-toggle .gs-cross {
            opacity: 0;
            transform: rotate(-45deg) scale(0.7);
        }
        #gs-chat-toggle.is-open .gs-orb {
            opacity: 0;
            transform: scale(0.7);
        }
        #gs-chat-toggle.is-open .gs-cross {
            opacity: 1;
            transform: rotate(0) scale(1);
        }

        /* Animated halo around the closed button — paused when open. */
        #gs-chat-toggle .gs-halo {
            position: absolute;
            inset: -4px;
            border-radius: 50%;
            border: 1px solid ${C.redFaint};
            opacity: 0.7;
            animation: gs-halo 2.6s cubic-bezier(0.16, 1, 0.3, 1) infinite;
            pointer-events: none;
        }
        #gs-chat-toggle.is-open .gs-halo { display: none; }

        @keyframes gs-halo {
            0%   { transform: scale(1);    opacity: 0.7; }
            70%  { transform: scale(1.55); opacity: 0;   }
            100% { transform: scale(1.55); opacity: 0;   }
        }

        @media (prefers-reduced-motion: reduce) {
            #gs-chat-toggle .gs-halo { animation: none; opacity: 0; }
        }

        /* ============== FRAME (iframe wrapper) ============== */

        #gs-chat-frame {
            position: fixed;
            bottom: 96px;
            right: 22px;
            z-index: 2147483645;
            width: 392px;
            height: 620px;
            max-height: calc(100dvh - 116px);
            background: ${C.ink2};
            border: 1px solid ${C.redFaint};
            border-radius: 20px;
            box-shadow:
                0 30px 80px -20px rgba(0, 0, 0, 0.85),
                0 0 0 1px rgba(220, 13, 1, 0.12);
            overflow: hidden;
            opacity: 0;
            transform: translateY(12px) scale(0.97);
            transform-origin: right bottom;
            transition:
                opacity 240ms cubic-bezier(0.16, 1, 0.3, 1),
                transform 280ms cubic-bezier(0.16, 1, 0.3, 1),
                visibility 0s linear 280ms;
            visibility: hidden;
            pointer-events: auto;
        }
        #gs-chat-frame.is-open {
            opacity: 1;
            transform: translateY(0) scale(1);
            visibility: visible;
            transition:
                opacity 280ms cubic-bezier(0.16, 1, 0.3, 1),
                transform 320ms cubic-bezier(0.16, 1, 0.3, 1),
                visibility 0s linear 0s;
        }
        #gs-chat-frame iframe {
            display: block;
            width: 100%;
            height: 100%;
            border: 0;
            border-radius: inherit;
            background: ${C.ink2};
        }

        /* ============== MOBILE ============== */

        @media (max-width: 480px) {
            #gs-chat-frame {
                width: 100%;
                height: 100dvh;
                max-height: 100dvh;
                bottom: 0;
                right: 0;
                left: 0;
                top: 0;
                border-radius: 0;
                border: none;
            }
            #gs-chat-toggle {
                bottom: 16px;
                right: 16px;
            }
        }
    `;

    // SVG mark: a glowing red orb with a rotating arc — same identity as the
    // avatar already used inside the chat panel header.
    const ORB_SVG = `
        <svg viewBox="0 0 40 40" width="30" height="30" focusable="false" aria-hidden="true">
            <defs>
                <radialGradient id="gs-toggle-core" cx="50%" cy="50%" r="50%">
                    <stop offset="0%"   stop-color="#FCA5A5" stop-opacity="1"/>
                    <stop offset="55%"  stop-color="#DC0D01" stop-opacity="0.95"/>
                    <stop offset="100%" stop-color="#5B0702" stop-opacity="0"/>
                </radialGradient>
            </defs>
            <circle cx="20" cy="20" r="9" fill="url(#gs-toggle-core)">
                <animate attributeName="r" values="8;10;8" dur="2.6s" repeatCount="indefinite"/>
            </circle>
            <g fill="none" stroke="#DC0D01" stroke-width="1" stroke-linecap="round" opacity="0.6">
                <circle cx="20" cy="20" r="14" stroke-dasharray="22 66">
                    <animateTransform attributeName="transform" type="rotate"
                                      from="0 20 20" to="360 20 20" dur="9s" repeatCount="indefinite"/>
                </circle>
            </g>
        </svg>
    `;

    const CROSS_SVG = `
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
             stroke="#FFFFFF" stroke-width="2.2"
             stroke-linecap="round" aria-hidden="true">
            <path d="M6.5 6.5 L17.5 17.5"/>
            <path d="M17.5 6.5 L6.5 17.5"/>
        </svg>
    `;

    function mount() {
        const styleEl = document.createElement("style");
        styleEl.id = "gs-chat-widget-styles";
        styleEl.textContent = styles;
        document.head.appendChild(styleEl);

        const toggle = document.createElement("button");
        toggle.id = "gs-chat-toggle";
        toggle.type = "button";
        toggle.setAttribute("aria-label", "GS Auto Center туслахыг нээх");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-controls", "gs-chat-frame");
        toggle.innerHTML = `
            <span class="gs-halo" aria-hidden="true"></span>
            <span class="gs-orb" aria-hidden="true">${ORB_SVG}</span>
            <span class="gs-cross" aria-hidden="true">${CROSS_SVG}</span>
        `;

        // Iframe is lazy: we create the wrapper now but only assign src on first
        // open so the chatbot API isn't hit on every page load.
        const frame = document.createElement("div");
        frame.id = "gs-chat-frame";
        frame.setAttribute("role", "dialog");
        frame.setAttribute("aria-label", "GS Auto Center чат");
        const iframe = document.createElement("iframe");
        iframe.title = "GS Auto Center чат";
        iframe.setAttribute("loading", "lazy");
        iframe.setAttribute("allow", "clipboard-write");
        frame.appendChild(iframe);

        document.body.appendChild(toggle);
        document.body.appendChild(frame);

        let isOpen = false;
        let iframeLoaded = false;

        function setOpen(next) {
            isOpen = !!next;
            toggle.classList.toggle("is-open", isOpen);
            frame.classList.toggle("is-open", isOpen);
            toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
            toggle.setAttribute(
                "aria-label",
                isOpen ? "GS Auto Center туслахыг хаах" : "GS Auto Center туслахыг нээх",
            );
            try { sessionStorage.setItem(STATE_KEY, isOpen ? "true" : "false"); } catch (_) {}

            if (isOpen && !iframeLoaded) {
                iframe.src = FRAME_URL;
                iframeLoaded = true;
            }
        }

        toggle.addEventListener("click", () => setOpen(!isOpen));

        try {
            if (sessionStorage.getItem(STATE_KEY) === "true") setOpen(true);
        } catch (_) {}

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && isOpen) setOpen(false);
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", mount);
    } else {
        mount();
    }
})();
