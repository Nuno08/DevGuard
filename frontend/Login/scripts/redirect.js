const params = new URLSearchParams(window.location.search);

const error = params.get('error');

if (error) {
    alert(decodeURIComponent(error));
}

document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const API_URL = "http://localhost:8088";

    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.message || "Login failed");
            return;
        }

        // 🔐 store tokens (rotation ready)
        localStorage.setItem("token", data.token);
        localStorage.setItem("refreshToken", data.refreshToken);

        // optional: store user to avoid /me call
        localStorage.setItem("user", JSON.stringify(data.user));

        // redirect
        window.location.href = "/frontend/Login/Home.html";

    } catch (err) {
        console.error(err);
        alert("Network error");
    }
});