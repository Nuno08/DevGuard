document.addEventListener("DOMContentLoaded", async () => {
    const API_URL = "http://localhost:8088";
    const LOGIN_URL = "http://127.0.0.1:5500/frontend/Login/Login.html";
    const HOME_URL = "http://127.0.0.1:5500/frontend/Login/Home.html";
    // =========================
    // OAuth token support
    // =========================
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get("token");

    if (tokenFromUrl) {
        localStorage.setItem("token", tokenFromUrl);
        window.history.replaceState({}, document.title, HOME_URL);
    }

    const welcomeEl = document.getElementById("welcome");
    const avatar = document.getElementById("avatar");

    if (welcomeEl) welcomeEl.textContent = "Loading...";

    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = LOGIN_URL;
        return;
    }

    // =========================
    // Refresh token rotation
    // =========================
    async function refreshToken() {
        try {
            const refreshToken = localStorage.getItem("refreshToken");

            const res = await fetch(`${API_URL}/auth/refresh`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ refreshToken })
            });

            if (!res.ok) return false;

            const data = await res.json();

            localStorage.setItem("token", data.token);
            localStorage.setItem("refreshToken", data.refreshToken);

            return true;

        } catch (err) {
            console.error("Refresh error:", err);
            return false;
        }
    }

    // =========================
    // Auth fetch wrapper
    // =========================
    async function authFetch(url, options = {}) {
        let token = localStorage.getItem("token");

        let res = await fetch(`${API_URL}${url}`, {
            ...options,
            headers: {
                ...options.headers,
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (res.status === 401) {
            const ok = await refreshToken();

            if (!ok) {
                localStorage.clear();
                window.location.href = LOGIN_URL;
                return;
            }

            token = localStorage.getItem("token");

            res = await fetch(`${API_URL}${url}`, {
                ...options,
                headers: {
                    ...options.headers,
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
        }

        return res;
    }

    // =========================
    // Load user
    // =========================
    try {
        const res = await authFetch("/auth/me");

        if (!res || !res.ok) {
            localStorage.clear();
            window.location.href = LOGIN_URL;
            return;
        }

        const user = await res.json();

        if (welcomeEl) {
            welcomeEl.textContent = `Welcome ${user.username || user.email}`;
        }

        if (avatar) {
            avatar.src =
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=fff&color=000`;
        }

    } catch (err) {
        console.error("Auth error:", err);
        localStorage.clear();
        window.location.href = LOGIN_URL;
    }
});