const API_URL = "http://localhost:8088";
const params = new URLSearchParams(window.location.search);
const tokenFromUrl = params.get("token");
function getToken() {
    return localStorage.getItem("token");
};
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

const response = await fetch(`${API_URL}/account/security`, {
    method: "GET",
    headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
    }
});

if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
}

const data = await response.json();

const el = document.getElementById('securityStatus');

const level = data.level.level.toLowerCase();

el.textContent = `[${data.level.icon} Security Status: ${data.level.level}]`;

el.className = `security ${level}`;

