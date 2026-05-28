document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const username = document.getElementById("name").value;
    const password = document.getElementById("password").value;

    const res = await fetch("http://localhost:8088/auth/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, username, password })
    });

    const data = await res.json();
    if (!res.ok) {
        alert(data.message);
        return;
    }
    
    window.location.href = "http://127.0.0.1:5500/frontend/Login/Login.html";
});