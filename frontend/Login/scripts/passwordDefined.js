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

async function loadPasswordStatus() {
    try{
         const response = await fetch(`${API_URL}/account/passwordEmpty`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if(!response.ok){
            throw new Error('Error obtaining password');
        }

        const data = await response.json();

        console.log(data);
        const passwordDefined = document.getElementById("passwordDefined");

        if (data.hasPassword) {
            passwordDefined.textContent = "Password Defined";
            passwordDefined.style.color = "#22c55e"; // verde
            passwordDefined.style.fontWeight = "600";
        } else {
            passwordDefined.textContent = "No password defined";
            passwordDefined.style.color = "#f59e0b"; // laranja
            passwordDefined.style.fontWeight = "600";
        }
    }catch(error){
        console.error(error);
    }
}

loadPasswordStatus();