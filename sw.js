self.addEventListener("push", function (event) {
  const data = event.data ? event.data.json() : {};

  const title = data.title || "FieldHive Alert";
  const options = {
    body: data.message || "New civic alert",
    icon: "/logo.svg",
    badge: "/logo.svg",
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});
