const LOGIN_URL = "http://127.0.0.1:5500/frontend/Login/Login.html";
const API_URL = "http://localhost:8088";

document.getElementById('logoutAllBtn').addEventListener('click', async () => {
    try {

        const token = localStorage.getItem('token');

        const response = await fetch(
            `${API_URL}/auth/logout-all`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message);
        }

        localStorage.clear();

        alert(data.message);

        window.location.href = LOGIN_URL;

    } catch (error) {

        console.error(error);
        alert(error.message);

    }
});