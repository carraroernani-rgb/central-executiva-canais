/* app.js - Lógica da Central Executiva de Canais */

// Estado global da aplicação
let state = {
  leadsIndicated: [],
  leadsPrime: [],
  travels: [],
  relationships: [],
  contacts: [],
  users: [],
  currentUserEmail: "diretor@empresa.com",
  lastUpdate: ""
};

// Instância global do gráfico Chart.js
let chartInstance = null;

// Inicializador principal
document.addEventListener("DOMContentLoaded", () => {
  initAppState();
  setupEventListeners();
  setupImportExcel();
  renderApp();
});

// 1. Inicialização do Estado (Sincronizado com localStorage)
function initAppState() {
  const savedState = localStorage.getItem("central_canais_state");
  if (savedState) {
    try {
      state = JSON.parse(savedState);
    } catch (e) {
      console.error("Erro ao analisar estado salvo, restaurando padrão.", e);
      state = { ...window.INITIAL_DATA, currentUserEmail: "diretor@empresa.com" };
    }
  } else {
    // Sementar dados fictícios
    state = { ...window.INITIAL_DATA, currentUserEmail: "diretor@empresa.com" };
  }

  // Definir data da última atualização se não houver
  if (!state.lastUpdate) {
    state.lastUpdate = formatDateTime(new Date());
    saveState();
  }

  // Aplicar tema salvo
  const savedTheme = localStorage.getItem("central_canais_theme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeToggleIcon(savedTheme);
}

// Salva o estado atual no localStorage
function saveState() {
  localStorage.setItem("central_canais_state", JSON.stringify(state));
}

// Atualiza a marcação de tempo da última alteração
function markLastUpdate() {
  state.lastUpdate = formatDateTime(new Date());
  saveState();
  renderLastUpdate();
  // Recalcula o resumo executivo e atualiza dashboard se necessário
  generateExecutiveSummary();
}

// 2. Ouvintes de Eventos (Event Listeners)
function setupEventListeners() {
  // Navegação por Abas (Tab Navigation)
  const navLinks = document.querySelectorAll(".nav-item a");
  navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetSection = link.getAttribute("href").substring(1);
      switchSection(targetSection);
    });
  });

  // Toggle do Menu Mobile
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const sidebar = document.getElementById("sidebar");
  if (mobileMenuBtn && sidebar) {
    mobileMenuBtn.addEventListener("click", () => {
      sidebar.classList.toggle("mobile-open");
    });
  }

  // Fechar sidebar mobile ao clicar em um link
  navLinks.forEach(link => {
    link.addEventListener("click", () => {
      if (sidebar) sidebar.classList.remove("mobile-open");
    });
  });

  // Alternador de Perfil (Simulação de Acesso)
  const profileSelect = document.getElementById("profileSelect");
  if (profileSelect) {
    profileSelect.addEventListener("change", (e) => {
      switchCurrentUser(e.target.value);
    });
  }

  // Alternador de Tema Escuro / Claro
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      const currentTheme = document.documentElement.getAttribute("data-theme");
      const newTheme = currentTheme === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", newTheme);
      localStorage.setItem("central_canais_theme", newTheme);
      updateThemeToggleIcon(newTheme);
      // Redesenha o gráfico para se adequar às cores do novo tema
      if (chartInstance) {
        renderLeadsChart();
      }
    });
  }

  // Modais de Criação
  setupModalEvents("addLeadModal", "btnOpenAddLead", "leadForm", saveLeadRecord);
  setupModalEvents("addPrimeModal", "btnOpenAddPrime", "primeForm", savePrimeRecord);
  setupModalEvents("addTravelModal", "btnOpenAddTravel", "travelForm", saveTravelRecord);
  setupModalEvents("addRelationshipModal", "btnOpenAddRelationship", "relationshipForm", saveRelationshipRecord);
  setupModalEvents("addContactModal", "btnOpenAddContact", "contactForm", saveContactRecord);
  setupModalEvents("inviteUserModal", "btnOpenInviteUser", "inviteUserForm", inviteNewUser);

  // Configuração especial para modal de edição do Lead PRIME
  const closeEditPrime = document.getElementById("closeEditPrimeModal");
  if (closeEditPrime) {
    closeEditPrime.addEventListener("click", () => closeModal("editPrimeModal"));
  }
  const editPrimeForm = document.getElementById("editPrimeForm");
  if (editPrimeForm) {
    editPrimeForm.addEventListener("submit", (e) => {
      e.preventDefault();
      saveEditedPrimeRecord();
    });
  }
}

// Controla abertura e fechamento de modais genéricos
function setupModalEvents(modalId, openBtnId, formId, saveCallback) {
  const modal = document.getElementById(modalId);
  const openBtn = document.getElementById(openBtnId);
  const closeBtn = modal ? modal.querySelector(".modal-close") : null;
  const cancelBtn = modal ? modal.querySelector(".btn-secondary") : null;
  const form = document.getElementById(formId);

  if (openBtn && modal) {
    openBtn.addEventListener("click", () => openModal(modalId));
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => closeModal(modalId));
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => closeModal(modalId));
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      saveCallback(form);
    });
  }
}

function openModal(modalId) {
  // Impede ações se for visualizador (segurança extra client-side)
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.role === "VISUALIZADOR" && modalId !== "editPrimeModal" /* Let them open but they shouldn't see edit trigger anyway */) {
    alert("Permissão negada: Visualizadores não podem criar registros.");
    return;
  }
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("active-modal");
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("active-modal");
    const form = modal.querySelector("form");
    if (form) form.reset();
  }
}

// 3. Renderização Geral e Controle de Acesso
function renderApp() {
  renderSidebarUser();
  renderSimulationSelector();
  applyPermissions();
  renderDashboardMetrics();
  generateExecutiveSummary();
  renderLeadsSection();
  renderPrimeSection();
  renderTravelsSection();
  renderRelationshipsSection();
  renderContactsSection();
  renderSharingSection();
  renderLastUpdate();
}

// Trocar Usuário Ativo
function switchCurrentUser(email) {
  state.currentUserEmail = email;
  
  // Atualizar data de último acesso do usuário selecionado
  const user = state.users.find(u => u.email === email);
  if (user) {
    user.lastAccess = formatDateTime(new Date());
  }
  
  saveState();
  renderApp();
}

// Obter dados do usuário logado no simulador
function getCurrentUser() {
  return state.users.find(u => u.email === state.currentUserEmail) || {
    name: "Administrador Principal",
    email: "diretor@empresa.com",
    role: "ADMIN"
  };
}

// Aplica visualmente as restrições baseadas no papel (Admin vs Visualizador)
function applyPermissions() {
  const user = getCurrentUser();
  const isViewer = user.role === "VISUALIZADOR";
  
  // Banner de alerta de visualizador
  const viewerBanner = document.getElementById("viewerBanner");
  if (viewerBanner) {
    if (isViewer) {
      viewerBanner.style.display = "flex";
      document.getElementById("viewerName").innerText = `${user.name} (${user.email})`;
    } else {
      viewerBanner.style.display = "none";
    }
  }

  // Ocultar ou desabilitar botões de escrita
  const writeButtons = document.querySelectorAll(".btn-write, .btn-danger-light, .btn-action-edit, .btn-action-delete");
  writeButtons.forEach(btn => {
    if (isViewer) {
      btn.style.display = "none";
    } else {
      btn.style.display = "";
    }
  });

  // Ocultar botões flutuantes ou de cabeçalho de adição
  const addButtons = document.querySelectorAll(".btn-add-record");
  addButtons.forEach(btn => {
    if (isViewer) {
      btn.style.display = "none";
    } else {
      btn.style.display = "inline-flex";
    }
  });
}

// Renderiza a caixa de identificação do usuário na barra lateral
function renderSidebarUser() {
  const user = getCurrentUser();
  const nameEl = document.getElementById("sidebarUserName");
  const roleEl = document.getElementById("sidebarUserRole");
  const avatarEl = document.getElementById("sidebarUserAvatar");

  if (nameEl) nameEl.innerText = user.name;
  if (roleEl) roleEl.innerText = user.role === "ADMIN" ? "Administrador" : "Visualizador";
  if (avatarEl) avatarEl.innerText = getInitials(user.name);
}

// Sincroniza o seletor de simulação no Header
function renderSimulationSelector() {
  const select = document.getElementById("profileSelect");
  if (!select) return;
  
  select.innerHTML = "";
  state.users.forEach(u => {
    const option = document.createElement("option");
    option.value = u.email;
    option.text = `${u.name} (${u.role})`;
    if (u.email === state.currentUserEmail) {
      option.selected = true;
    }
    select.appendChild(option);
  });
}

function renderLastUpdate() {
  const el = document.getElementById("lastUpdateText");
  if (el) {
    el.innerText = state.lastUpdate || "Não disponível";
  }
}

// Alternar entre Seções (Aba ativa)
function switchSection(sectionId) {
  // Atualiza Abas no menu lateral
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach(item => {
    const link = item.querySelector("a");
    if (link.getAttribute("href") === `#${sectionId}`) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  // Atualiza Seções visíveis
  const sections = document.querySelectorAll(".app-section");
  sections.forEach(sec => {
    if (sec.id === sectionId) {
      sec.classList.add("active-section");
    } else {
      sec.classList.remove("active-section");
    }
  });

  // Inicializar ou reajustar o gráfico se a aba for indicações ou dashboard
  if (sectionId === "dashboard" || sectionId === "leads") {
    setTimeout(renderLeadsChart, 50);
  }
}

// 4. Seção Inicial / Dashboard & Métricas
function renderDashboardMetrics() {
  // Calcular métricas
  const now = new Date();
  const currentMonthStr = "2026-06"; // Forçando para Junho de 2026 para corresponder aos dados

  // 1. Leads no mês
  const leadsThisMonth = state.leadsIndicated
    .filter(l => l.date.startsWith(currentMonthStr))
    .reduce((sum, l) => sum + l.quantity, 0);

  // 2. Parceiros que indicaram no mês
  const partnersIndicating = new Set(
    state.leadsIndicated
      .filter(l => l.date.startsWith(currentMonthStr))
      .map(l => l.partner)
  ).size;

  // 3. Leads PRIME ativos
  const primeActive = state.leadsPrime.length;

  // 4. Viagens realizadas no mês
  const travelsThisMonth = state.travels.filter(t => t.date.startsWith(currentMonthStr)).length;

  // 5. Contatos na semana
  // Pegamos a semana atual baseada na data do sistema fictício (08/06/2026, Semana 24)
  const sysDate = new Date("2026-06-08");
  const targetWeekNum = getWeekNumber(sysDate);
  const contactsThisWeek = state.contacts.filter(c => {
    const d = new Date(c.date);
    return getWeekNumber(d) === targetWeekNum;
  }).length;

  // Atualizar no DOM
  document.getElementById("metricLeadsMonth").innerText = leadsThisMonth;
  document.getElementById("metricPartnersCount").innerText = partnersIndicating;
  document.getElementById("metricPrimeCount").innerText = primeActive;
  document.getElementById("metricTravelsCount").innerText = travelsThisMonth;
  document.getElementById("metricContactsWeek").innerText = contactsThisWeek;
}

// Geração automática do Resumo Executivo Semanal
function generateExecutiveSummary() {
  const now = new Date();
  const currentMonthStr = "2026-06";
  
  // Total de leads indicados
  const totalLeads = state.leadsIndicated
    .filter(l => l.date.startsWith(currentMonthStr))
    .reduce((sum, l) => sum + l.quantity, 0);

  // Parceiros ativos
  const activePartnersCount = new Set(
    state.leadsIndicated
      .filter(l => l.date.startsWith(currentMonthStr))
      .map(l => l.partner)
  ).size;

  // Ranking de parceiros para descobrir o destaque
  const partnerMap = {};
  state.leadsIndicated.forEach(l => {
    if (l.date.startsWith(currentMonthStr)) {
      partnerMap[l.partner] = (partnerMap[l.partner] || 0) + l.quantity;
    }
  });

  let partnerRanking = Object.entries(partnerMap).sort((a, b) => b[1] - a[1]);
  const topPartner = partnerRanking.length > 0 ? partnerRanking[0][0] : "Nenhum";

  // Leads PRIME
  const primeCount = state.leadsPrime.length;
  const primeCompanies = state.leadsPrime.map(p => p.company).slice(0, 2).join(" e ");

  // Viagens
  const travelCount = state.travels.filter(t => t.date.startsWith(currentMonthStr)).length;
  const travelCities = Array.from(new Set(
    state.travels.filter(t => t.date.startsWith(currentMonthStr)).map(t => t.city.split(" - ")[0])
  )).slice(0, 2).join(" e ");

  // Avanços da semana (Contatos na semana do dia 08/06/2026 - Semana 24)
  const sysDate = new Date("2026-06-08");
  const targetWeekNum = getWeekNumber(sysDate);
  const weeklyContacts = state.contacts.filter(c => {
    const d = new Date(c.date);
    return getWeekNumber(d) === targetWeekNum;
  });

  const contactsCount = weeklyContacts.length;
  const contactsPartners = Array.from(new Set(weeklyContacts.map(c => c.partner))).slice(0, 2).join(", ");

  // Montar Texto Semântico
  let summaryHtml = `
    <p>A área de <strong>Canais e Parcerias</strong> apresenta uma evolução sólida no acompanhamento executivo desta semana:</p>
    <ul>
      <li><strong>Geração de Leads</strong>: Registramos <strong>${totalLeads} leads indicados</strong> neste mês por <strong>${activePartnersCount} parceiros ativos</strong>. O grande destaque do período é o parceiro <strong>${topPartner}</strong>, liderando as indicações acumuladas.</li>
      <li><strong>Operação Prime</strong>: Mantemos <strong>${primeCount} leads PRIME ativos</strong> em andamento técnico/comercial, com alinhamento contínuo junto à <strong>${primeCompanies || 'nossos parceiros'}</strong> para integrações no ecossistema (destaque para ERP Everest).</li>
      <li><strong>Visitas a Campo</strong>: Foram realizadas <strong>${travelCount} viagens estratégicas</strong> este mês para expandir e consolidar relacionamentos, com visitas focadas em <strong>${travelCities || 'mercados-chave'}</strong>.</li>
      <li><strong>Avanço Semanal</strong>: Consolidamos <strong>${contactsCount} contatos de relacionamento</strong> nesta semana com parceiros como <strong>${contactsPartners || 'Oracle, Linx e outros'}</strong>, garantindo o engajamento e a capacitação contínua dos canais de distribuição.</li>
    </ul>
  `;

  const container = document.getElementById("executiveSummaryContent");
  if (container) {
    container.innerHTML = summaryHtml;
  }
}

// 5. Seção 1: Indicações de Leads & Gráficos
function renderLeadsSection() {
  const currentMonthStr = "2026-06";
  const tableBody = document.querySelector("#leadsTable tbody");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  // Filtra leads do mês de Junho/2026
  const monthLeads = state.leadsIndicated.filter(l => l.date.startsWith(currentMonthStr));

  monthLeads.forEach(lead => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${formatDateBR(lead.date)}</td>
      <td><strong>${lead.partner}</strong></td>
      <td><span class="badge badge-primary">${lead.quantity} leads</span></td>
      <td class="btn-write">
        <button class="btn btn-secondary btn-icon btn-action-delete" onclick="deleteLeadRecord('${lead.id}')" title="Excluir Registro">
          <i class="fas fa-trash-alt" style="color:var(--danger)"></i>
        </button>
      </td>
    `;
    tableBody.appendChild(tr);
  });

  // Totais Rápidos da Seção
  const totalLeads = monthLeads.reduce((sum, l) => sum + l.quantity, 0);
  const totalPartners = new Set(monthLeads.map(l => l.partner)).size;

  document.getElementById("secLeadsTotal").innerText = totalLeads;
  document.getElementById("secPartnersCount").innerText = totalPartners;

  // Calcular Parceiro Destaque & Ranking
  const partnerMap = {};
  monthLeads.forEach(l => {
    partnerMap[l.partner] = (partnerMap[l.partner] || 0) + l.quantity;
  });

  const partnerRanking = Object.entries(partnerMap).sort((a, b) => b[1] - a[1]);

  // Renderizar Parceiro Destaque
  const highlightNameEl = document.getElementById("partnerHighlightName");
  const highlightScoreEl = document.getElementById("partnerHighlightScore");
  if (partnerRanking.length > 0) {
    highlightNameEl.innerText = partnerRanking[0][0];
    highlightScoreEl.innerText = `${partnerRanking[0][1]} leads indicados`;
  } else {
    highlightNameEl.innerText = "Nenhum";
    highlightScoreEl.innerText = "0 leads indicados";
  }

  // Renderizar Ranking
  const rankingList = document.getElementById("partnersRankingList");
  if (rankingList) {
    rankingList.innerHTML = "";
    partnerRanking.forEach(([partner, qty], idx) => {
      const posClass = idx === 0 ? "pos-1" : idx === 1 ? "pos-2" : idx === 2 ? "pos-3" : "";
      const div = document.createElement("div");
      div.className = "ranking-item";
      div.innerHTML = `
        <div class="ranking-left">
          <span class="ranking-position ${posClass}">${idx + 1}</span>
          <span class="ranking-name">${partner}</span>
        </div>
        <span class="ranking-value">${qty} leads</span>
      `;
      rankingList.appendChild(div);
    });
  }

  // Desenhar Gráfico de Linha
  renderLeadsChart();
}

// Renderizar o gráfico dinâmico acumulado de Leads
function renderLeadsChart() {
  const ctx = document.getElementById("leadsCumulativeChart");
  if (!ctx) return;

  // Destruir instância antiga se existir
  if (chartInstance) {
    chartInstance.destroy();
  }

  // Agrupar leads do mês corrente por semanas (Dia 1-7 = Sem 1, Dia 8-14 = Sem 2, Dia 15-21 = Sem 3, Dia 22-31 = Sem 4)
  const currentMonthStr = "2026-06";
  const weeks = { w1: 0, w2: 0, w3: 0, w4: 0 };

  state.leadsIndicated.forEach(l => {
    if (l.date.startsWith(currentMonthStr)) {
      const day = parseInt(l.date.split("-")[2], 10);
      if (day <= 7) weeks.w1 += l.quantity;
      else if (day <= 14) weeks.w2 += l.quantity;
      else if (day <= 21) weeks.w3 += l.quantity;
      else weeks.w4 += l.quantity;
    }
  });

  // Calcular acumulado
  const cumulativeData = [
    weeks.w1,
    weeks.w1 + weeks.w2,
    weeks.w1 + weeks.w2 + weeks.w3,
    weeks.w1 + weeks.w2 + weeks.w3 + weeks.w4
  ];

  // Configurações visuais dinâmicas dependendo do tema ativo
  const isLight = document.documentElement.getAttribute("data-theme") === "light";
  const textColor = isLight ? "#475569" : "#94a3b8";
  const gridColor = isLight ? "rgba(15, 23, 42, 0.05)" : "rgba(255, 255, 255, 0.05)";

  // Criar gradiente para a linha
  const drawCtx = ctx.getContext("2d");
  const gradient = drawCtx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, "rgba(99, 102, 241, 0.4)");
  gradient.addColorStop(1, "rgba(99, 102, 241, 0.0)");

  // Instanciar Chart.js
  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: ["Semana 1", "Semana 2", "Semana 3", "Semana 4"],
      datasets: [
        {
          label: "Leads Acumulados",
          data: cumulativeData,
          borderColor: "#6366f1",
          borderWidth: 3,
          backgroundColor: gradient,
          fill: true,
          tension: 0.35,
          pointBackgroundColor: "#a855f7",
          pointBorderColor: "#fff",
          pointHoverRadius: 8,
          pointRadius: 5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: isLight ? "#ffffff" : "#0f172a",
          titleColor: isLight ? "#0f172a" : "#ffffff",
          bodyColor: isLight ? "#475569" : "#cbd5e1",
          borderColor: "rgba(99, 102, 241, 0.3)",
          borderWidth: 1,
          padding: 12,
          displayColors: false,
          callbacks: {
            label: function(context) {
              return `Acumulado: ${context.raw} leads`;
            }
          }
        }
      },
      scales: {
        y: {
          grid: {
            color: gridColor
          },
          ticks: {
            color: textColor,
            font: {
              family: "Outfit"
            },
            stepSize: 5
          },
          suggestedMin: 0
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: textColor,
            font: {
              family: "Outfit",
              weight: "600"
            }
          }
        }
      }
    }
  });
}

// CRUD: Salvar Indicação de Lead
function saveLeadRecord(form) {
  const date = form.leadDate.value;
  const partner = form.leadPartner.value;
  const quantity = parseInt(form.leadQty.value, 10);

  if (!date || !partner || isNaN(quantity)) {
    alert("Preencha todos os campos obrigatórios.");
    return;
  }

  const newRecord = {
    id: "lead_" + Date.now(),
    date,
    partner,
    quantity
  };

  state.leadsIndicated.push(newRecord);
  markLastUpdate();
  closeModal("addLeadModal");
  renderApp();
}

// CRUD: Excluir Indicação de Lead
function deleteLeadRecord(id) {
  if (confirm("Deseja realmente remover esta indicação de lead?")) {
    state.leadsIndicated = state.leadsIndicated.filter(l => l.id !== id);
    markLastUpdate();
    renderApp();
  }
}

// 6. Seção 2: Leads PRIME
function renderPrimeSection() {
  const tableBody = document.querySelector("#primeTable tbody");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  state.leadsPrime.forEach(prime => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${prime.company}</strong></td>
      <td>${prime.status}</td>
      <td><span class="badge badge-primary">${prime.nextStep}</span></td>
      <td class="btn-write" style="text-align:right">
        <div class="timeline-actions">
          <button class="btn btn-secondary btn-icon" onclick="openEditPrimeModal('${prime.id}')" title="Editar Registro">
            <i class="fas fa-edit" style="color:var(--accent)"></i>
          </button>
          <button class="btn btn-secondary btn-icon" onclick="deletePrimeRecord('${prime.id}')" title="Excluir Registro">
            <i class="fas fa-trash-alt" style="color:var(--danger)"></i>
          </button>
        </div>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

// CRUD: Salvar Lead PRIME Novo
function savePrimeRecord(form) {
  const company = form.primeCompany.value;
  const status = form.primeStatus.value;
  const nextStep = form.primeNextStep.value;

  if (!company || !status || !nextStep) {
    alert("Preencha todos os campos.");
    return;
  }

  const newRecord = {
    id: "prime_" + Date.now(),
    company,
    status,
    nextStep
  };

  state.leadsPrime.push(newRecord);
  markLastUpdate();
  closeModal("addPrimeModal");
  renderApp();
}

// CRUD: Abrir Modal de Edição de Prime
let editingPrimeId = null;
function openEditPrimeModal(id) {
  const prime = state.leadsPrime.find(p => p.id === id);
  if (!prime) return;

  editingPrimeId = id;
  const form = document.getElementById("editPrimeForm");
  form.editPrimeCompany.value = prime.company;
  form.editPrimeStatus.value = prime.status;
  form.editPrimeNextStep.value = prime.nextStep;

  openModal("editPrimeModal");
}

// CRUD: Salvar Alterações de Lead PRIME
function saveEditedPrimeRecord() {
  const form = document.getElementById("editPrimeForm");
  const company = form.editPrimeCompany.value;
  const status = form.editPrimeStatus.value;
  const nextStep = form.editPrimeNextStep.value;

  if (!company || !status || !nextStep) {
    alert("Preencha todos os campos.");
    return;
  }

  const primeIdx = state.leadsPrime.findIndex(p => p.id === editingPrimeId);
  if (primeIdx !== -1) {
    state.leadsPrime[primeIdx] = {
      ...state.leadsPrime[primeIdx],
      company,
      status,
      nextStep
    };
    markLastUpdate();
    closeModal("editPrimeModal");
    renderApp();
  }
}

// CRUD: Excluir Lead PRIME
function deletePrimeRecord(id) {
  if (confirm("Tem certeza que deseja remover este Lead PRIME?")) {
    state.leadsPrime = state.leadsPrime.filter(p => p.id !== id);
    markLastUpdate();
    renderApp();
  }
}

// 7. Seção 3: Viagens (Timeline)
function renderTravelsSection() {
  const timelineEl = document.getElementById("travelsTimeline");
  const counterEl = document.getElementById("secTravelsCount");
  if (!timelineEl) return;

  timelineEl.innerHTML = "";

  const currentMonthStr = "2026-06";
  const monthTravels = state.travels.filter(t => t.date.startsWith(currentMonthStr));

  // Ordenar decrescente por data para exibir primeiro as mais recentes
  const sortedTravels = [...monthTravels].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (counterEl) {
    counterEl.innerText = monthTravels.length;
  }

  if (sortedTravels.length === 0) {
    timelineEl.innerHTML = `<p style="color:var(--text-secondary); text-align:center; padding: 20px;">Nenhuma viagem registrada neste mês.</p>`;
    return;
  }

  sortedTravels.forEach(t => {
    const item = document.createElement("div");
    item.className = "timeline-item";
    item.innerHTML = `
      <div class="timeline-dot"></div>
      <div class="timeline-card">
        <div class="timeline-header">
          <div class="timeline-meta">
            <span class="timeline-date">${formatDateBR(t.date)}</span>
            <h4 class="timeline-title">${t.partner}</h4>
            <span class="timeline-city"><i class="fas fa-map-marker-alt"></i> ${t.city}</span>
          </div>
          <div class="btn-write">
            <button class="btn btn-secondary btn-icon" onclick="deleteTravelRecord('${t.id}')" title="Excluir Viagem">
              <i class="fas fa-trash-alt" style="color:var(--danger)"></i>
            </button>
          </div>
        </div>
        <div class="timeline-body">
          <p><strong>Resultado da Visita:</strong> ${t.result}</p>
        </div>
        <div class="timeline-footer">
          <div><i class="fas fa-arrow-right" style="color:var(--accent)"></i> <span>Próximo Passo:</span> ${t.nextStep}</div>
        </div>
      </div>
    `;
    timelineEl.appendChild(item);
  });
}

// CRUD: Salvar Registro de Viagem
function saveTravelRecord(form) {
  const date = form.travelDate.value;
  const city = form.travelCity.value;
  const partner = form.travelPartner.value;
  const result = form.travelResult.value;
  const nextStep = form.travelNextStep.value;

  if (!date || !city || !partner || !result || !nextStep) {
    alert("Preencha todos os campos obrigatórios.");
    return;
  }

  const newRecord = {
    id: "travel_" + Date.now(),
    date,
    city,
    partner,
    result,
    nextStep
  };

  state.travels.push(newRecord);
  markLastUpdate();
  closeModal("addTravelModal");
  renderApp();
}

// CRUD: Excluir Viagem
function deleteTravelRecord(id) {
  if (confirm("Deseja realmente remover esta viagem?")) {
    state.travels = state.travels.filter(t => t.id !== id);
    markLastUpdate();
    renderApp();
  }
}

// 8. Seção 4: Relacionamento com Parceiros
function renderRelationshipsSection() {
  const grid = document.getElementById("relationshipsGrid");
  if (!grid) return;

  grid.innerHTML = "";

  state.relationships.forEach(r => {
    const card = document.createElement("div");
    card.className = "relationship-card";
    card.innerHTML = `
      <div>
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
          <h4 class="relationship-title">${r.partner}</h4>
          <div class="btn-write">
            <button class="btn btn-secondary btn-icon" onclick="deleteRelationshipRecord('${r.id}')" title="Excluir Relacionamento">
              <i class="fas fa-trash-alt" style="color:var(--danger)"></i>
            </button>
          </div>
        </div>
        <p class="relationship-subject">${r.subject}</p>
      </div>
      <div class="relationship-footer">
        <span>Última Atualização:</span>
        <span>${formatDateBR(r.lastUpdate)}</span>
      </div>
    `;
    grid.appendChild(card);
  });
}

// CRUD: Salvar Novo Relacionamento
function saveRelationshipRecord(form) {
  const partner = form.relPartner.value;
  const subject = form.relSubject.value;
  const lastUpdate = form.relLastUpdate.value;

  if (!partner || !subject || !lastUpdate) {
    alert("Preencha todos os campos obrigatórios.");
    return;
  }

  const newRecord = {
    id: "rel_" + Date.now(),
    partner,
    subject,
    lastUpdate
  };

  state.relationships.push(newRecord);
  markLastUpdate();
  closeModal("addRelationshipModal");
  renderApp();
}

// CRUD: Excluir Relacionamento
function deleteRelationshipRecord(id) {
  if (confirm("Remover este acompanhamento de relacionamento?")) {
    state.relationships = state.relationships.filter(r => r.id !== id);
    markLastUpdate();
    renderApp();
  }
}

// 9. Seção 5: Contatos Realizados (Agrupados por Semana)
function renderContactsSection() {
  const container = document.getElementById("weeklyContactsList");
  if (!container) return;

  container.innerHTML = "";

  // Agrupar contatos por número da semana do ano
  const groups = {};
  
  state.contacts.forEach(c => {
    const dateObj = new Date(c.date);
    const weekNum = getWeekNumber(dateObj);
    if (!groups[weekNum]) {
      groups[weekNum] = [];
    }
    groups[weekNum].push(c);
  });

  // Ordenar as semanas de forma decrescente (mais recente primeiro)
  const sortedWeeks = Object.keys(groups).sort((a, b) => b - a);

  if (sortedWeeks.length === 0) {
    container.innerHTML = `<p style="color:var(--text-secondary); text-align:center; padding: 20px;">Nenhum contato registrado recentemente.</p>`;
    return;
  }

  sortedWeeks.forEach(week => {
    const weekContacts = groups[week];
    const weekBox = document.createElement("div");
    weekBox.className = "week-group";

    // Criar cabeçalho da semana
    const header = document.createElement("div");
    header.className = "week-header";
    header.innerHTML = `
      <h4 class="week-title">Semana ${week}</h4>
      <span class="week-count">${weekContacts.length} contatos</span>
    `;
    weekBox.appendChild(header);

    // Lista de contatos
    const list = document.createElement("div");
    list.className = "week-list";

    // Ordenar contatos dentro da semana por data
    const sortedContacts = [...weekContacts].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedContacts.forEach(c => {
      const item = document.createElement("div");
      item.className = "week-contact-item";
      item.innerHTML = `
        <div class="contact-info">
          <span class="contact-partner"><strong>${c.partner}</strong></span>
          <span class="contact-subject">${c.subject}</span>
        </div>
        <div style="display:flex; align-items:center; gap:16px;">
          <span class="contact-date">${formatDateBR(c.date)}</span>
          <div class="btn-write">
            <button class="btn btn-secondary btn-icon" onclick="deleteContactRecord('${c.id}')" title="Excluir Contato">
              <i class="fas fa-trash-alt" style="color:var(--danger)"></i>
            </button>
          </div>
        </div>
      `;
      list.appendChild(item);
    });

    weekBox.appendChild(list);
    container.appendChild(weekBox);
  });
}

// CRUD: Salvar Novo Contato Realizado
function saveContactRecord(form) {
  const partner = form.contactPartner.value;
  const subject = form.contactSubject.value;
  const date = form.contactDate.value;

  if (!partner || !subject || !date) {
    alert("Preencha todos os campos obrigatórios.");
    return;
  }

  const newRecord = {
    id: "contact_" + Date.now(),
    partner,
    subject,
    date
  };

  state.contacts.push(newRecord);
  markLastUpdate();
  closeModal("addContactModal");
  renderApp();
}

// CRUD: Excluir Contato
function deleteContactRecord(id) {
  if (confirm("Remover o registro deste contato realizado?")) {
    state.contacts = state.contacts.filter(c => c.id !== id);
    markLastUpdate();
    renderApp();
  }
}

// 10. Compartilhamento e Controle de Usuários (Administração)
function renderSharingSection() {
  const usersTable = document.querySelector("#sharedUsersTable tbody");
  const accessLogList = document.getElementById("accessLogsList");
  if (!usersTable) return;

  // Renderizar Lista de Usuários
  usersTable.innerHTML = "";
  state.users.forEach(u => {
    const isMe = u.email === "diretor@empresa.com";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <div style="display:flex; align-items:center; gap:10px;">
          <div class="user-avatar" style="width:30px; height:30px; font-size:0.75rem;">${getInitials(u.name)}</div>
          <div>
            <strong>${u.name}</strong><br>
            <span style="font-size:0.8rem; color:var(--text-secondary)">${u.email}</span>
          </div>
        </div>
      </td>
      <td>
        <select class="form-select" style="padding:4px 8px; font-size:0.8rem;" onchange="changeUserRole('${u.email}', this.value)" ${isMe ? 'disabled' : ''}>
          <option value="ADMIN" ${u.role === 'ADMIN' ? 'selected' : ''}>ADMIN</option>
          <option value="VISUALIZADOR" ${u.role === 'VISUALIZADOR' ? 'selected' : ''}>VISUALIZADOR</option>
        </select>
      </td>
      <td><span style="font-size:0.85rem; color:var(--text-secondary)">Convidado por: ${u.invitedBy}</span></td>
      <td style="text-align:right">
        <button class="btn btn-secondary btn-icon" onclick="removeSharedUser('${u.email}')" ${isMe ? 'disabled' : ''} title="Remover Acesso">
          <i class="fas fa-user-times" style="color:var(--danger)"></i>
        </button>
      </td>
    `;
    usersTable.appendChild(tr);
  });

  // Renderizar Logs de Acessos
  if (accessLogList) {
    accessLogList.innerHTML = "";
    // Filtramos apenas os acessos de visualizadores ou acessos registrados
    const logEntries = [...state.users]
      .filter(u => u.lastAccess)
      .sort((a, b) => new Date(b.lastAccess.replace(/\//g, "-")) - new Date(a.lastAccess.replace(/\//g, "-")));

    logEntries.forEach(log => {
      const item = document.createElement("div");
      item.className = "access-log-item";
      item.innerHTML = `
        <div>
          <span class="access-log-user">${log.name}</span> (${log.role})
          <div style="font-size:0.75rem; color:var(--text-secondary)">Acessou o sistema</div>
        </div>
        <span class="access-log-time">${log.lastAccess}</span>
      `;
      accessLogList.appendChild(item);
    });
  }
}

// Convidar Usuário por e-mail
function inviteNewUser(form) {
  const name = form.inviteName.value;
  const email = form.inviteEmail.value;
  const role = form.inviteRole.value;

  if (!name || !email || !role) {
    alert("Preencha todos os campos.");
    return;
  }

  // Verificar se o e-mail já existe
  if (state.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    alert("Este usuário já possui acesso ao sistema.");
    return;
  }

  const creator = getCurrentUser();
  const newUser = {
    email,
    name,
    role,
    invitedBy: creator.email,
    lastAccess: "" // Sem acesso inicial
  };

  state.users.push(newUser);
  saveState();
  closeModal("inviteUserModal");
  renderApp();
  alert(`Convite enviado com sucesso para ${email}! (Perfil: ${role})`);
}

// Alterar Perfil de Acesso do Usuário Convidado
function changeUserRole(email, newRole) {
  const user = state.users.find(u => u.email === email);
  if (user) {
    user.role = newRole;
    saveState();
    // Se mudamos a role do usuário corrente, re-renderizar permissões
    if (email === state.currentUserEmail) {
      renderApp();
    }
  }
}

// Remover Usuário Convidado
function removeSharedUser(email) {
  if (email === "diretor@empresa.com") {
    alert("Não é possível remover o administrador principal.");
    return;
  }
  if (confirm(`Remover o acesso do usuário ${email}?`)) {
    // Se o usuário removido for o atual logado, retornar para o principal
    if (state.currentUserEmail === email) {
      state.currentUserEmail = "diretor@empresa.com";
    }
    state.users = state.users.filter(u => u.email !== email);
    saveState();
    renderApp();
  }
}

// 11. Importação de Excel (SheetJS)
function setupImportExcel() {
  const btn = document.getElementById("btnImportExcel");
  const input = document.getElementById("excelFileInput");
  if (!btn || !input) return;

  btn.addEventListener("click", () => input.click());
  input.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        processExcelImport(evt.target.result);
      } catch (err) {
        alert("Erro ao ler o arquivo Excel: " + err.message);
      }
      input.value = "";
    };
    reader.readAsArrayBuffer(file);
  });
}

function processExcelImport(buffer) {
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });

  const imported = {
    leadsIndicated: importLeadsFromExcel(wb),
    leadsPrime: importPrimeFromExcel(wb),
    relationships: importRelationshipsFromExcel(wb),
  };

  const totalLeads = imported.leadsIndicated.length;
  const totalPrime = imported.leadsPrime.length;
  const totalRel = imported.relationships.length;

  if (totalLeads === 0 && totalPrime === 0 && totalRel === 0) {
    alert("Nenhum dado encontrado nas abas esperadas da planilha.");
    return;
  }

  if (!confirm(`Importar dados do Excel?\n\n• ${totalLeads} registros de leads\n• ${totalPrime} leads PRIME\n• ${totalRel} parceiros (relacionamentos)\n\nOs dados existentes serão substituídos.`)) return;

  if (imported.leadsIndicated.length > 0) state.leadsIndicated = imported.leadsIndicated;
  if (imported.leadsPrime.length > 0) state.leadsPrime = imported.leadsPrime;
  if (imported.relationships.length > 0) state.relationships = imported.relationships;

  markLastUpdate();
  renderApp();
  alert("Importação concluída com sucesso!");
}

function sheetToRows(wb, sheetName) {
  const ws = wb.Sheets[sheetName];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json(ws, { defval: "" });
}

function importLeadsFromExcel(wb) {
  // Tenta ler de "Planilha2" que tem Ano, Mês, Parceiro, Qde
  const rows = sheetToRows(wb, "Planilha2");
  const leads = [];
  const monthMap = { Janeiro:1, Fevereiro:2, Março:3, Abril:4, Maio:5, Junho:6, Julho:7, Agosto:8, Setembro:9, Outubro:10, Novembro:11, Dezembro:12 };

  rows.forEach((row, i) => {
    const ano = row["Ano"] || row["ano"];
    const mes = row["Mês"] || row["Mes"] || row["mês"];
    const parceiro = row["Parceiro"] || row["parceiro"] || row["PARCEIRO"];
    const qde = parseInt(row["Qde"] || row["QDE"] || row["qde"] || 0, 10);

    if (!ano || !mes || !parceiro || isNaN(qde) || qde <= 0) return;
    if (typeof ano !== "number") return;

    const mesNum = monthMap[mes] || parseInt(mes, 10);
    if (!mesNum) return;

    const dateStr = `${ano}-${String(mesNum).padStart(2, "0")}-01`;
    leads.push({ id: "xl_lead_" + i, date: dateStr, partner: String(parceiro).trim(), quantity: qde });
  });

  return leads;
}

function importPrimeFromExcel(wb) {
  // Aba "Lista Parceiros e canais": NOME, PRIME (=1 significa PRIME)
  const rows = sheetToRows(wb, "Lista Parceiros e canais");
  const prime = [];

  rows.forEach((row, i) => {
    const nome = row["NOME"] || row["Nome"] || row["nome"];
    const isPrime = row["PRIME"];
    if (!nome || !isPrime || isPrime === "") return;

    prime.push({
      id: "xl_prime_" + i,
      company: String(nome).trim(),
      status: "Importado da planilha de parceiros.",
      nextStep: "Verificar e atualizar status manualmente."
    });
  });

  return prime;
}

function importRelationshipsFromExcel(wb) {
  // Aba "Lista Parceiros e canais": todos os parceiros ativos
  const rows = sheetToRows(wb, "Lista Parceiros e canais");
  const rels = [];

  rows.forEach((row, i) => {
    const nome = row["NOME"] || row["Nome"] || row["nome"];
    if (!nome || String(nome).trim() === "") return;

    const tipo = row["Parceiro"] ? "Parceiro" : row["Canal"] ? "Canal" : row["Indicador"] ? "Indicador" : "Parceiro";
    rels.push({
      id: "xl_rel_" + i,
      partner: String(nome).trim(),
      subject: `Tipo: ${tipo}`,
      lastUpdate: new Date().toISOString().split("T")[0]
    });
  });

  return rels;
}

// 12. Helpers de Formatação e Utilitários
function formatDateTime(date) {
  const pad = (num) => String(num).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDateBR(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function getInitials(name) {
  if (!name) return "U";
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function getWeekNumber(d) {
  // Cópia para não alterar a data original
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  // Segunda-feira é o dia 1
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}

function updateThemeToggleIcon(theme) {
  const btn = document.getElementById("themeToggleBtn");
  if (!btn) return;
  
  if (theme === "light") {
    btn.innerHTML = `<i class="fas fa-moon"></i>`;
    btn.title = "Ativar Modo Escuro";
  } else {
    btn.innerHTML = `<i class="fas fa-sun"></i>`;
    btn.title = "Ativar Modo Claro";
  }
}
