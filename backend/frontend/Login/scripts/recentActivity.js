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

async function loadSecurity() {
    try {
        const response = await fetch(
            `${API_URL}/account/security?limitEvents=3`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const security = await response.json();


        renderRecentActivity(security.recentEvents);
    } catch (error) {
        console.error('Error loading security data:', error);
    }
};

function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();

    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;

    return `${diffDays}d ago`;
}

function getEventLabel(type) {
    const labels = {
           // Auth
        REGISTER_SUCCESS: 'Account created',
        LOGIN_SUCCESS: 'Login successful',
        LOGIN_FAILED: 'Login failed',
        LOGOUT_SUCCESS: 'Logout',
        LOGOUT_FAILED: 'Logout failed',

        // Sessions
        GET_SESSION_ACTIVE_SUCCESS: 'Active session checked',
        SESSION_CREATED: 'Session created',
        SESSION_REVOKED: 'Session revoked',
        REVOKE_SESSION_ID_SUCCESS: 'Session revoked manually',
        LOGOUT_ALL_SUCCESS: 'All sessions logged out',

         // Security / tokens
        TOKEN_REFRESH: 'Token refreshed',
        LOGIN_SUSPICIOUS: 'Suspicious login detected',

        // OAuth
        OAUTH_LOGIN_SUCCESS: 'OAuth login successful',
        OAUTH_REGISTER_SUCCESS: 'OAuth registration'

    };

    return labels[type] || type;
}

function renderRecentActivity(events) {
    const elements = [
        document.getElementById('activity1'),
        document.getElementById('activity2'),
        document.getElementById('activity3')
    ];

    elements.forEach((element, index) => {
        const event = events[index];

        if (!event) {
            element.textContent = '';
            return;
        }

        element.innerHTML =
            `&bull; ${getEventLabel(event.type)} - ${formatTimeAgo(event.created_at)}`;
    });
};

loadSecurity();