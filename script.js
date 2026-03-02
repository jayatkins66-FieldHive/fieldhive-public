const API_BASE = "https://fieldhive-core.onrender.com";

async function loadHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    const data = await res.json();

    document.getElementById("healthBox").textContent =
      JSON.stringify(data, null, 2);

    document.getElementById("apiStatus").textContent =
      "Core API Online";
    document.getElementById("apiStatus").classList.add("online");
  } catch (err) {
    document.getElementById("healthBox").textContent =
      "Unable to reach Core API.";
    document.getElementById("apiStatus").textContent =
      "API Offline";
  }
}

loadHealth();
