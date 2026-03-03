const API_BASE = "https://fieldhive-core.onrender.com";

/*
========================================
API STATUS CHECK
========================================
*/
async function checkAPI() {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    if (res.ok) {
      document.getElementById("apiStatus").textContent = "System Online";
      document.getElementById("apiStatus").classList.add("online");
    } else {
      throw new Error();
    }
  } catch {
    document.getElementById("apiStatus").textContent = "API Offline";
    document.getElementById("apiStatus").classList.add("offline");
  }
}

/*
========================================
LOAD CITIES (FROM YOUR LIVE DB)
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
SUBSCRIBE TO ALERTS (USES YOUR /api/subscribe)
========================================
*/
document.getElementById("subscribeForm").addEventListener("submit", async (e) => {
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
SUBMIT RESIDENT REPORT (YOUR /api/reports)
========================================
*/
document.getElementById("reportForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("reportTitle").value;
  const description = document.getElementById("reportDescription").value;
  const department = document.getElementById("departmentSelect").value;

  const statusBox = document.getElementById("reportStatus");
  statusBox.textContent = "Submitting report...";

  try {
    const res = await fetch(`${API_BASE}/api/reports`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ title, description, department })
    });

    const data = await res.json();
    statusBox.textContent = "Report submitted successfully.";
  } catch {
    statusBox.textContent = "Failed to submit report.";
  }
});

/*
========================================
SUBMIT ANONYMOUS TIP (YOUR /api/tips)
========================================
*/
document.getElementById("tipForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const message = document.getElementById("tipMessage").value;
  const statusBox = document.getElementById("tipStatus");
  statusBox.textContent = "Submitting tip...";

  try {
    const res = await fetch(`${API_BASE}/api/tips`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message,
        is_anonymous: true
      })
    });

    const data = await res.json();
    statusBox.textContent = "Tip submitted successfully.";
  } catch {
    statusBox.textContent = "Failed to submit tip.";
  }
});

/*
========================================
LOAD BULLETINS (LIVE CIVIC ALERTS)
========================================
*/
async function loadBulletins() {
  try {
    const res = await fetch(`${API_BASE}/api/bulletins`);
    const bulletins = await res.json();

    const container = document.getElementById("bulletinsContainer");

    if (!bulletins.length) {
      container.innerHTML = "<p>No active bulletins.</p>";
      return;
    }

    container.innerHTML = bulletins.map(b => `
      <div class="item">
        <h3>${b.title}</h3>
        <p>${b.content}</p>
        <small>Posted: ${new Date(b.created_at).toLocaleString()}</small>
      </div>
    `).join("");
  } catch {
    document.getElementById("bulletinsContainer").textContent =
      "Failed to load bulletins.";
  }
}

/*
========================================
INIT
========================================
*/
checkAPI();
loadCities();
loadBulletins();

/*
========================================
PUSH NOTIFICATION SUBSCRIPTION
========================================
*/

const VAPID_PUBLIC_KEY = "BKIB3cGEzn2YpX1dKXQ-lsbUxpbOKFJo_nOsSs5gXUNa5XiLp1GH8tSGpLnRw6Ps7De2NAxbeMq60nV0PKz4lbA";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function enablePush() {
  if (!("serviceWorker" in navigator)) {
    alert("Service workers not supported.");
    return;
  }

  if (!("PushManager" in window)) {
    alert("Push messaging not supported.");
    return;
  }

  const city = document.getElementById("citySelect").value;
  if (!city) {
    alert("Please select a city first.");
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    alert("Notification permission denied.");
    return;
  }

  const registration = await navigator.serviceWorker.register("/sw.js");

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  await fetch(`${API_BASE}/api/push/subscribe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      city,
      subscription,
    }),
  });

  alert("Push notifications enabled successfully!");
}

window.enablePush = enablePush;
