// background.js – Service Worker (Manifest V3)
// Centraliza o envio para a Cloud Function e gerencia erros de rede.

const CLOUD_FUNCTION_URL = "http://localhost:3000/sync";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "SYNC_DATA") return false;

  sendToCloudFunction(message.payload)
    .then((result) => sendResponse({ ok: true, ...result }))
    .catch((err)  => sendResponse({ ok: false, erro: err.message }));

  return true; // mantém o canal aberto para resposta assíncrona
});

async function sendToCloudFunction(payload) {
  const response = await fetch(CLOUD_FUNCTION_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload),
  });

  const json = await response.json();
  if (!response.ok) throw new Error(json.erro || `HTTP ${response.status}`);
  return json;
}
