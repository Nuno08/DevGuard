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

const response = await fetch(`${API_URL}/auth/me`, {
    method: "GET",
    headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
    }
});

const data = await response.json();

document.getElementById('email').textContent = `${data.email}`


const auth = await fetch(`${API_URL}/account/provider`, {
    method: "GET",
    headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
    }
});

const authData = await auth.json();

const primary = authData[0];
const others = authData.slice(1);

document.getElementById('provider').textContent =
    primary
        ? `${primary.provider} (Primary)`
        : 'Local account';