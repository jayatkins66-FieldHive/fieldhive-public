const API_BASE = "https://fieldhive-core.onrender.com";

/*
========================================
API HEALTH CHECK
========================================
*/
async function loadHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    const data = await res.json();

    document.getElementById("apiStatus").textContent =
      "Core API Online";
    document.getElementById("apiStatus").classList.add("online");
  } catch (err) {
    document.getElementById("apiStatus").textContent =
      "API Offline";
    document.getElementById("apiStatus").classList.add("offline");
  }
}

/*
========================================
LOAD CITIES
========================================
*/
async function loadCities() {
  try {
    const res = await fetch(`${API_BASE}/api/cities`);
    const cities = await res.json();

    const select = document.getElementById("citySelect");
    select.innerHTML = "";

    if (!cities.length) {
      select.innerHTML = `<option value="">No cities available</option>`;
      return;
    }

    cities.forEach(city => {
      const option = document.createElement("option");
      option.value = city;
      option.textContent = city;
      select.appendChild(option);
    });

  } catch {
    document.getElementById("citySelect").innerHTML =
      `<option value="">Failed to load cities</option>`;
  }
}

/*
========================================
EMAIL SUBSCRIPTION
========================================
*/
document.getElementById("subscribeForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const city = document.getElementById("citySelect").value;
  const email = document.getElementById("emailInput").value;

  const statusBox = document.getElementById("subscribeStatus");
  statusBox.textContent = "Submitting...";

  try {
    const res = await fetch(`${API_BASE}/api/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ city, email })
    });

    const data = await res.json();
    statusBox.textContent = data.message || "Subscribed successfully.";
  } catch {
    statusBox.textContent = "Subscription failed.";
  }
});

/*
========================================
PUSH NOTIFICATIONS
========================================
*/

// 🔴 PASTE YOUR REAL VAPID PUBLIC KEY BELOW
const VAPID_PUBLIC_KEY = BKIB3cGEzn2YpX1dKXQ-lsbUxpbOKFJo_nOsSs5gXUNa5XiLp1GH8tSGpLnRw6Ps7De2NAxbeMq60nV0PKz4lbA;

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

async function enablePush() {

  const city = document.getElementById("citySelect").value;
  if (!city) {
    alert("Please select a city first.");
    return;
  }

  if (!("serviceWorker" in navigator)) {
    alert("Service workers not supported in this browser.");
    return;
  }

  try {
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      alert("Notification permission denied.");
      return;
    }

    const registration = await navigator.serviceWorker.register("/sw.js");

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    await fetch(`${API_BASE}/api/push/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        city,
        subscription
      })
    });

    alert("Push notifications enabled successfully!");

  } catch (err) {
    console.error("Push setup failed:", err);
    alert("Push setup failed.");
  }
}

/*
========================================
INIT
========================================
*/
loadHealth();
loadCities();
