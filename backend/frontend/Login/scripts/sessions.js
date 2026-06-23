const API_URL = "http://localhost:8088";
const params = new URLSearchParams(window.location.search);
const tokenFromUrl = params.get("token");


async function waitForToken() {
    return new Promise((resolve) => {
        const interval = setInterval(() => {
            const token = localStorage.getItem("token");

            if (token) {
                clearInterval(interval);
                resolve(token);
            }
        }, 50);
    });
};

const token = await waitForToken();

async function loadSessions() {
    const response = await fetch(`${API_URL}/session/getSession/active`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });

    const data = await response.json();
    const sessionsCount = data.sessions ? data.sessions.length : 0;


    document.getElementById("activeSessions").textContent =
        `\u{1F4F1} Active Sessions (${sessionsCount})`;

        const currentSession = data.sessions.find(
            session => session.isCurrent
        );

    function getDeviceIcon(session) {
        const ua = (session.user_agent || "").toLowerCase();

        if (ua.includes("iphone") || ua.includes("android")) {
            return String.fromCodePoint(0x1F4F1);
        }

        if (ua.includes("ipad") || ua.includes("tablet")) {
            return String.fromCodePoint(0x1F4F1);
        }

        return String.fromCodePoint(0x1F4BB);
    };

    if (currentSession) {
        const icon = getDeviceIcon(currentSession);

        const bullet = `<span class="bullet">&bull;</span>`;

    document.getElementById("currentSession").innerHTML = `
        ${icon}
        ${currentSession.browser || "Unknown Browser"}
        on ${currentSession.os || "Unknown OS"}
        ${bullet} ${currentSession.ip_address}
        ${bullet} <span class="high">[Current Session]</span>
    `;
    }

    const otherSession = data.otherSession;

    if (otherSession) {
        const icon = getDeviceIcon(otherSession);

        const bullet = `<span class="bullet">&bull;</span>`;

        document.getElementById("otherSession").innerHTML = `
        ${icon}
        ${otherSession.browser || "Unknown Browser"}
        on ${otherSession.os || "Unknown OS"}
        ${bullet} ${otherSession.ip_address}
        ${bullet}  <button
                class="revoke-btn"
                data-session-id="${otherSession.id}">
                [revoke]
            </button>
        `;
    }

    //If no other sessions remove element from DOM
    if(!otherSession){
        document.getElementById('otherSession').remove();
    }
    document.querySelectorAll('.revoke-btn').forEach(button => {
            button.addEventListener('click', revokeSession);
        });
};

async function revokeSession(event) {
    const sessionId = event.target.dataset.sessionId;
    try {
        const response = await fetch(
            `${API_URL}/session/${sessionId}/revoke`,
            {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            throw new Error('Failed to revoke session');
        }

        alert('Session revoked');

        // recarrega a lista
        await loadSessions();

    } catch (error) {
        console.error(error);
    }
}
;

loadSessions();