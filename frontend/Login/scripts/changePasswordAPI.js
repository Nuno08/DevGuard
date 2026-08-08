console.log("teste");
document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const currentPassword = document.getElementById("password").value;
    const newPassword = document.getElementById("newPassword").value;
    const API_URL = "http://localhost:8088";

    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get("token");

    if (tokenFromUrl) {
        localStorage.setItem("token", tokenFromUrl);
        window.history.replaceState({}, document.title, HOME_URL);
    }
    const token = localStorage.getItem("token");

    try {
        const res = await fetch(`${API_URL}/account/change-password`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });

        const data = await res.json();

        const errorList = document.getElementById("passwordErrors");
        errorList.innerHTML = "";

        if (!res.ok) {
            if (data.errors) {
                data.errors.forEach(error => {
                    const li = document.createElement("li");
                    li.textContent = error;
                    errorList.appendChild(li);
                });
            } else {
                const li = document.createElement("li");
                li.textContent = data.message || "Failed to change password.";
                errorList.appendChild(li);
            }

            return;
        }

        alert(data.message || "Password changed successfully.");

    } catch (err) {
        console.error(err);

        const errorList = document.getElementById("passwordErrors");
        errorList.innerHTML = "<li>Network error.</li>";
    }
});
