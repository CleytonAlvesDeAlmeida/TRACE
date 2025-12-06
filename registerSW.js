if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/service-worker.js")
    .then(() => console.log("SW registrado"))
    .catch((e) => console.log("Erro no SW", e));
}