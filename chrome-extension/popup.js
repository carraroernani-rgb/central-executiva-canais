const CLOUD_FUNCTION_URL = "http://localhost:3000/sync";

const btnSync    = document.getElementById("btn-sync");
const statusBox  = document.getElementById("status-box");
const statExtr   = document.getElementById("stat-extraidos");
const statEnv    = document.getElementById("stat-enviados");
const lastSync   = document.getElementById("last-sync");

// Restaura última sincronização salva
chrome.storage.local.get(["lastSync", "lastStats"], ({ lastSync: ls, lastStats }) => {
  if (ls) lastSync.textContent = `Última sync: ${ls}`;
  if (lastStats) {
    statExtr.textContent = lastStats.extraidos;
    statEnv.textContent  = lastStats.enviados;
  }
});

btnSync.addEventListener("click", async () => {
  setStatus("loading", "Iniciando extração na aba ativa...");
  btnSync.disabled = true;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.url?.includes("atendare.com")) {
      setStatus("error", "Abra uma página do Atendare antes de sincronizar.");
      return;
    }

    // Injeta o content script e aguarda o retorno dos dados
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractAtendareData,
    });

    if (!result || result.length === 0) {
      setStatus("error", "Nenhum negócio encontrado. Verifique os seletores em content.js.");
      return;
    }

    setStatus("loading", `${result.length} negócio(s) extraído(s). Enviando para o BigQuery...`);
    statExtr.textContent = result.length;

    // Envia para a Cloud Function
    const response = await fetch(CLOUD_FUNCTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ negocios: result, fonte: "chrome-extension", versao: "1.0" }),
    });

    const json = await response.json();

    if (!response.ok) throw new Error(json.erro || `HTTP ${response.status}`);

    const ts = new Date().toLocaleString("pt-BR");
    statEnv.textContent = json.inseridos ?? result.length;
    chrome.storage.local.set({
      lastSync: ts,
      lastStats: { extraidos: result.length, enviados: json.inseridos ?? result.length },
    });
    lastSync.textContent = `Última sync: ${ts}`;
    setStatus("success", `✓ ${json.inseridos ?? result.length} registro(s) enviados com sucesso!`);

  } catch (err) {
    setStatus("error", `Erro: ${err.message}`);
  } finally {
    btnSync.disabled = false;
  }
});

function setStatus(type, msg) {
  statusBox.className = type;
  statusBox.textContent = msg;
}

// ─── Função injetada diretamente na aba do Atendare ───────────────────────────
// Esta função roda no contexto da página, não da extensão.
function extractAtendareData() {
  const negocios = [];
  const agora = new Date().toISOString();

  // ── SELETORES ─────────────────────────────────────────────────────────────
  // Ajuste os seletores abaixo conforme a estrutura HTML do Atendare.
  // Use F12 (DevTools) na página de negócios para inspecionar os elementos.
  //
  // Estratégia 1 – Linhas de tabela (visão lista de negócios)
  const linhasTabela = document.querySelectorAll("table tbody tr, .deals-table tbody tr");

  if (linhasTabela.length > 0) {
    linhasTabela.forEach((tr) => {
      const colunas = tr.querySelectorAll("td");
      if (colunas.length < 3) return;

      negocios.push({
        id_negocio:       _texto(tr, "[data-id], .deal-id, td:nth-child(1)") || _gerarId(tr),
        nome_parceiro:    _texto(tr, "[data-partner], .partner-name, td:nth-child(3)"),
        data_indicacao:   _texto(tr, "[data-date], .deal-date, td:nth-child(4)") || "",
        status:           _texto(tr, "[data-status], .deal-status, td:nth-child(5)") || "",
        nome_negocio:     _texto(tr, "[data-title], .deal-title, td:nth-child(2)") || "",
        data_extracao:    agora,
      });
    });
    return negocios;
  }

  // Estratégia 2 – Cards kanban (visão funil/pipeline)
  const cards = document.querySelectorAll(
    ".deal-card, .kanban-card, [class*='deal-card'], [class*='negocio-card']"
  );

  cards.forEach((card) => {
    negocios.push({
      id_negocio:     card.dataset.id || card.getAttribute("data-deal-id") || _gerarId(card),
      nome_parceiro:  _texto(card, "[data-partner], .partner, .parceiro") || "Não informado",
      data_indicacao: _texto(card, "[data-date], .date, .data") || "",
      status:         card.closest("[data-column], [data-stage]")?.dataset?.column
                      || card.closest("[data-column], [data-stage]")?.dataset?.stage
                      || "Desconhecido",
      nome_negocio:   _texto(card, ".title, .deal-title, h3, h4") || "",
      data_extracao:  agora,
    });
  });

  return negocios;

  // ── Helpers locais ────────────────────────────────────────────────────────
  function _texto(el, seletores) {
    for (const sel of seletores.split(",").map((s) => s.trim())) {
      const found = el.querySelector(sel);
      if (found?.textContent?.trim()) return found.textContent.trim();
    }
    return "";
  }

  function _gerarId(el) {
    return "ext-" + Math.random().toString(36).slice(2, 9);
  }
}
