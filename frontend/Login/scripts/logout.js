const logoutBtn = document.getElementById("logoutBtn");
const logoutA = document.getElementById("logoutA");
const API_URL = "http://localhost:8088";
const LOGIN_URL = "http://127.0.0.1:5500/frontend/Login/Login.html";

const params = new URLSearchParams(window.location.search);

    const token = params.get("token");
    const refreshToken = params.get("refreshToken");
    const username = params.get("username");

    console.log("OAUTH PARAMS:", { token, refreshToken, username });
    console.log("Logout script");

    if (token) {
        localStorage.setItem("token", token);
    }

    if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
    }

async function logout(e) {
    e.preventDefault();

    const token = localStorage.getItem("token");
    const refreshToken = localStorage.getItem("refreshToken");
    
    try {
        const response = await fetch(`${API_URL}/auth/logout`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                refreshToken
            })
        });

        if (!response.ok) {
            throw new Error("Erro no logout do servidor");
        }

    } catch (error) {
        console.error("Erro ao fazer logout:", error);

    } finally {
        localStorage.clear();

        window.location.href = LOGIN_URL;
    }
}

if (logoutA) {
    logoutA.addEventListener("click", logout);
}