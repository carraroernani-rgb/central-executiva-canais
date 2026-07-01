const express = require("express");
const cors    = require("cors");
const fs      = require("fs");
const path    = require("path");

const PORT    = 3000;
const DB_FILE = path.join(__dirname, "dados.json");

// ── Banco de dados (JSON em disco) ────────────────────────────────────────────
function lerDB() {
  try { return JSON.parse(fs.readFileSync(DB_FILE, "utf8")); }
  catch { return []; }
}

function salvarDB(registros) {
  fs.writeFileSync(DB_FILE, JSON.stringify(registros, null, 2), "utf8");
}

// ── Servidor ──────────────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

// POST /sync – recebe dados da extensão Chrome
app.post("/sync", (req, res) => {
  const { negocios } = req.body || {};

  if (!Array.isArray(negocios) || negocios.length === 0) {
    return res.status(400).json({ erro: "Campo 'negocios' ausente ou vazio." });
  }

  const agora    = new Date().toISOString();
  const novos    = negocios
    .filter((n) => n.id_negocio && n.nome_parceiro && n.status)
    .map((n) => ({
      id_negocio:    String(n.id_negocio).trim(),
      nome_negocio:  String(n.nome_negocio  || "").trim(),
      nome_parceiro: String(n.nome_parceiro).trim(),
      data_indicacao: parseDate(n.data_indicacao),
      status:        String(n.status).trim(),
      data_extracao: agora,
    }));

  if (novos.length === 0) {
    return res.status(422).json({ erro: "Nenhum registro válido para inserir." });
  }

  // Deduplicação: mantém sempre o mais recente por id_negocio
  const db     = lerDB();
  const mapa   = new Map(db.map((r) => [r.id_negocio, r]));
  novos.forEach((r) => mapa.set(r.id_negocio, r));
  salvarDB([...mapa.values()]);

  console.log(`[sync] ${novos.length} registro(s) | total: ${mapa.size} | ${new Date().toLocaleString("pt-BR")}`);
  res.json({ ok: true, inseridos: novos.length, total: mapa.size });
});

// ── API para o dashboard ──────────────────────────────────────────────────────

// GET /api/kpis
app.get("/api/kpis", (_req, res) => {
  const db      = lerDB();
  const anoAtual = String(new Date().getFullYear());
  const mesAtual = new Date().toISOString().slice(0, 7);

  const isGanho = (s) => s && (s.toLowerCase().includes("ganho") || s.toLowerCase().includes("won"));

  res.json({
    total_ano:   db.filter((r) => r.data_indicacao?.startsWith(anoAtual)).length,
    total_mes:   db.filter((r) => r.data_indicacao?.startsWith(mesAtual)).length,
    ganhos_ano:  db.filter((r) => r.data_indicacao?.startsWith(anoAtual) && isGanho(r.status)).length,
    ganhos_mes:  db.filter((r) => r.data_indicacao?.startsWith(mesAtual) && isGanho(r.status)).length,
  });
});

// GET /api/por-semana (últimas 20 semanas)
app.get("/api/por-semana", (_req, res) => {
  const db    = lerDB();
  const mapa  = {};
  const isGanho = (s) => s && s.toLowerCase().includes("ganho");

  db.forEach((r) => {
    if (!r.data_indicacao) return;
    const semana = getSemana(r.data_indicacao);
    if (!mapa[semana]) mapa[semana] = { semana, total: 0, ganhos: 0 };
    mapa[semana].total++;
    if (isGanho(r.status)) mapa[semana].ganhos++;
  });

  const rows = Object.values(mapa).sort((a, b) => a.semana.localeCompare(b.semana)).slice(-20);
  res.json(rows);
});

// GET /api/ranking
app.get("/api/ranking", (_req, res) => {
  const db   = lerDB();
  const mapa = {};
  const isGanho = (s) => s && s.toLowerCase().includes("ganho");

  db.forEach((r) => {
    const p = r.nome_parceiro || "Não informado";
    if (!mapa[p]) mapa[p] = { nome_parceiro: p, total_indicacoes: 0, contas_ganhas: 0, ultima_indicacao: null };
    mapa[p].total_indicacoes++;
    if (isGanho(r.status)) mapa[p].contas_ganhas++;
    if (!mapa[p].ultima_indicacao || r.data_indicacao > mapa[p].ultima_indicacao)
      mapa[p].ultima_indicacao = r.data_indicacao;
  });

  const rows = Object.values(mapa).sort((a, b) => b.total_indicacoes - a.total_indicacoes);
  res.json(rows);
});

// GET /api/status
app.get("/api/status", (_req, res) => {
  const db = lerDB();
  res.json({ ok: true, total_registros: db.length, arquivo: DB_FILE });
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseDate(raw) {
  if (!raw) return null;
  raw = String(raw).trim();
  const br = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  return null;
}

function getSemana(dateStr) {
  const d   = new Date(dateStr + "T12:00:00");
  const ano = d.getFullYear();
  const ini = new Date(ano, 0, 1);
  const sem = Math.ceil(((d - ini) / 86400000 + ini.getDay() + 1) / 7);
  return `${ano}-S${String(sem).padStart(2, "0")}`;
}

// ── Vagas & Pesquisas ─────────────────────────────────────────────────────────

// Helper: faz fetch com timeout
async function fetchWithTimeout(url, ms = 8000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "Mozilla/5.0" } });
    return r;
  } finally { clearTimeout(id); }
}

// Helper: parse RSS simples (sem dependência extra)
function parseRSS(xml) {
  const items = [];
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const block = m[1];
    const get = (tag) => {
      // Tenta CDATA primeiro, depois texto simples
      const cdata = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, "i"));
      if (cdata) return cdata[1].trim().replace(/<[^>]+>/g, "");
      const plain = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
      return plain ? plain[1].trim().replace(/<[^>]+>/g, "") : "";
    };
    const title = get("title");
    if (!title) continue;
    items.push({
      title,
      link:        get("link"),
      description: get("description").slice(0, 400),
      pubDate:     get("pubDate"),
      source:      get("source") || "",
    });
  }
  return items;
}

// Links curados de busca — foco PT-BR, sem exigência de inglês
const BUSCA_CURADA = [
  {
    titulo: "🔍 Gerente de Canais – Remoto (LinkedIn Brasil)",
    link: "https://www.linkedin.com/jobs/search/?keywords=gerente%20de%20canais&location=Brasil&f_WT=2&f_E=4%2C5&sortBy=DD",
    descricao: "Vagas de Gerente de Canais no Brasil, modelo remoto, nível gerência/diretoria – LinkedIn filtrado.",
    fonte: "LinkedIn", remoto: true, tipo: "busca",
  },
  {
    titulo: "🔍 Gerente de Parcerias / Head de Parcerias – Remoto (LinkedIn)",
    link: "https://www.linkedin.com/jobs/search/?keywords=gerente%20de%20parcerias%20OR%20head%20de%20parcerias%20OR%20diretor%20de%20canais&location=Brasil&f_WT=2&f_E=4%2C5&sortBy=DD",
    descricao: "Vagas de liderança em parcerias e canais, empresas brasileiras de tecnologia e indústria – remoto.",
    fonte: "LinkedIn", remoto: true, tipo: "busca",
  },
  {
    titulo: "🔍 Gerente de Canais / Parcerias – Remoto (Vagas.com.br)",
    link: "https://www.vagas.com.br/vagas-de-gerente-de-canais?onde=remoto",
    descricao: "Vagas de Gerente de Canais e Parcerias com trabalho remoto publicadas em português.",
    fonte: "Vagas.com.br", remoto: true, tipo: "busca",
  },
  {
    titulo: "🔍 Gerente de Parcerias – Remoto (Vagas.com.br)",
    link: "https://www.vagas.com.br/vagas-de-gerente-de-parcerias?onde=remoto",
    descricao: "Vagas de Gerente de Parcerias remotas no Brasil – empresas de tecnologia, SaaS, indústria.",
    fonte: "Vagas.com.br", remoto: true, tipo: "busca",
  },
  {
    titulo: "🔍 Gerente Canais / Parcerias – Home Office (Catho)",
    link: "https://www.catho.com.br/vagas/home-office/?q=gerente+de+canais+OR+gerente+de+parcerias+OR+diretor+de+canais",
    descricao: "Vagas home office de liderança em canais e parcerias no maior job board brasileiro.",
    fonte: "Catho", remoto: true, tipo: "busca",
  },
  {
    titulo: "🔍 Diretor / Gerente Parcerias & Canais – Gupy (tech BR)",
    link: "https://portal.gupy.io/job-search/term=gerente%20de%20canais?workplaceTypes[]=remote",
    descricao: "Vagas em empresas tech brasileiras no Gupy: gerente e diretor de canais e parcerias, remoto.",
    fonte: "Gupy", remoto: true, tipo: "busca",
  },
  {
    titulo: "🔍 Gerente de Canais – Home Office (InfoJobs)",
    link: "https://www.infojobs.com.br/empregos-em-gerente-de-canais.aspx?tipo-de-trabalho=home-office",
    descricao: "Busca no InfoJobs por vagas de Gerente de Canais em modalidade home office no Brasil.",
    fonte: "InfoJobs", remoto: true, tipo: "busca",
  },
];

// GET /api/vagas – busca vagas remotas de liderança em canais/parcerias
app.get("/api/vagas", async (_req, res) => {
  const seen = new Set();

  // Todas as URLs RSS para buscar em paralelo
  const fontes = [
    { url: "https://trampos.co/oportunidades.rss?term=channel+sales",    fonte: "Trampos.co" },
    { url: "https://trampos.co/oportunidades.rss?term=partner+manager",  fonte: "Trampos.co" },
    { url: "https://trampos.co/oportunidades.rss?term=parcerias",        fonte: "Trampos.co" },
    { url: "https://www.vagas.com.br/vagas-de-gerente-de-canais.rss",    fonte: "Vagas.com.br" },
    { url: "https://www.vagas.com.br/vagas-de-gerente-de-parcerias.rss", fonte: "Vagas.com.br" },
    { url: "https://www.indeed.com/rss?q=channel+sales+manager&l=Remote&sort=date&fromage=30", fonte: "Indeed" },
    { url: "https://www.indeed.com/rss?q=head+of+partnerships&l=Remote&sort=date&fromage=30",  fonte: "Indeed" },
  ];

  // Busca em paralelo com timeout de 5s cada
  const results = await Promise.allSettled(
    fontes.map(({ url, fonte }) =>
      fetchWithTimeout(url, 5000)
        .then(r => r.ok ? r.text() : "")
        .then(xml => xml ? parseRSS(xml).map(it => ({ ...it, fonte })) : [])
        .catch(() => [])
    )
  );

  const liveJobs = [];
  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    for (const it of r.value) {
      if (!it.link || seen.has(it.link)) continue;
      seen.add(it.link);
      const desc = (it.title + it.description).toLowerCase();
      // Filtra presenciais obrigatórios
      if (desc.includes("presencial obr")) continue;
      liveJobs.push({
        titulo:    it.title,
        empresa:   it.source || extraiEmpresa(it.title),
        link:      it.link,
        descricao: it.description,
        data:      it.pubDate ? new Date(it.pubDate).toLocaleDateString("pt-BR") : "",
        fonte:     it.fonte,
        remoto:    true,
        tipo:      "vaga",
      });
    }
  }

  // Vagas reais primeiro, depois links curados de busca
  res.json([...liveJobs, ...BUSCA_CURADA]);
});

function extraiEmpresa(titulo) {
  const m = titulo.match(/-\s*(.+)$/);
  return m ? m[1].trim() : "";
}

// GET /api/pesquisas – fontes curadas de research sobre parcerias/canais/ELG
app.get("/api/pesquisas", async (_req, res) => {
  const FONTES_RSS = [
    { nome: "Partnership Leaders", rss: "https://partnershipleaders.com/feed/" },
    { nome: "Crossbeam Blog",      rss: "https://www.crossbeam.com/blog/rss.xml" },
    { nome: "Nearbound / Reveal",  rss: "https://www.reveal.co/blog/rss.xml" },
    { nome: "PartnerHacker",       rss: "https://www.partnerhacker.com/feed" },
    { nome: "Channel Futures",     rss: "https://www.channelfutures.com/rss.xml" },
  ];

  const FONTES_STATIC = [
    { nome: "Ecosystem-Led Growth", site: "https://www.nearbound.com/resources", descricao: "Biblioteca de recursos sobre Ecosystem-Led Growth, nearbound e parcerias estratégicas." },
    { nome: "IDC Research",         site: "https://www.idc.com/getdoc.jsp?containerId=US52655224", descricao: "Relatórios IDC sobre mercado de canais, parcerias e distribuição de TI." },
    { nome: "Bluethread Research",  site: "https://bluethread.io/research", descricao: "Pesquisas independentes sobre channel sales, enablement e estratégias de go-to-market via canais." },
    { nome: "Forrester Partnerships", site: "https://www.forrester.com/search/?N=10001+4294959388", descricao: "Análises Forrester sobre channel partners, indirect sales e ecosystem strategy." },
    { nome: "G2 Channel Report",    site: "https://www.g2.com/categories/partner-management", descricao: "Relatórios G2 sobre plataformas de gestão de parceiros e tendências do mercado de canais." },
  ];

  // Busca todos os RSS em paralelo com timeout 5s
  const rssResults = await Promise.allSettled(
    FONTES_RSS.map(({ nome, rss }) =>
      fetchWithTimeout(rss, 5000)
        .then(r => r.ok ? r.text() : "")
        .then(xml => xml ? parseRSS(xml).slice(0, 4).map(it => ({ ...it, nome })) : [])
        .catch(() => [])
    )
  );

  const artigos = [];

  for (const r of rssResults) {
    if (r.status !== "fulfilled") continue;
    for (const it of r.value) {
      artigos.push({
        titulo:    it.title,
        link:      it.link,
        descricao: it.description,
        data:      it.pubDate ? new Date(it.pubDate).toLocaleDateString("pt-BR") : "",
        fonte:     it.nome,
        tags:      ["partnerships", "channels", "ELG"],
      });
    }
  }

  // Adiciona fontes estáticas sempre
  for (const f of FONTES_STATIC) {
    artigos.push({
      titulo:    `Pesquisas & Reports – ${f.nome}`,
      link:      f.site,
      descricao: f.descricao,
      data:      "",
      fonte:     f.nome,
      tags:      ["research", "partnerships", "ELG"],
    });
  }

  res.json(artigos);
});

// GET /api/noticias – RSS de notícias sobre channel sales, partnerships, canais
app.get("/api/noticias", async (_req, res) => {
  const FONTES = [
    // ── Global – Partnerships & Channel Sales ─────────────────────────────
    { nome: "Partnership Leaders",   url: "https://partnershipleaders.com/feed/",           cat: "Partnerships" },
    { nome: "Crossbeam Blog",        url: "https://www.crossbeam.com/blog/rss.xml",          cat: "ELG" },
    { nome: "PartnerHacker",         url: "https://www.partnerhacker.com/feed",              cat: "Partnerships" },
    { nome: "Channel Futures",       url: "https://www.channelfutures.com/rss.xml",          cat: "Channel Sales" },
    { nome: "Channel Partners",      url: "https://www.channelpartnersonline.com/feed/",     cat: "Channel Sales" },
    { nome: "Channelnomics",         url: "https://channelnomics.com/feed/",                 cat: "Channel Sales" },
    { nome: "CRN",                   url: "https://www.crn.com/rss/all-news.xml",            cat: "Channel Sales" },
    { nome: "Nearbound",             url: "https://www.nearbound.com/rss.xml",               cat: "ELG" },
    { nome: "Alliances Digest",      url: "https://www.alliancesdigest.com/feed/",           cat: "Partnerships" },
    // ── Brasil ────────────────────────────────────────────────────────────
    { nome: "TI Inside",             url: "https://tiinside.com.br/feed/",                   cat: "Brasil" },
    { nome: "IT Forum",              url: "https://itforum.com.br/feed/",                    cat: "Brasil" },
    { nome: "Canaltech",             url: "https://canaltech.com.br/rss/",                   cat: "Brasil" },
    { nome: "Computerworld BR",      url: "https://computerworld.com.br/feed/",              cat: "Brasil" },
  ];

  // Palavras-chave para filtrar notícias relevantes
  const KEYWORDS = [
    "channel", "partner", "parceria", "canal", "ecosystem", "alliance",
    "distribuidor", "reseller", "indirect", "go-to-market", "gtm",
    "elg", "nearbound", "isvs", "mssp", "var ", "distribuição",
  ];

  const isRelevante = (txt) => {
    const t = txt.toLowerCase();
    return KEYWORDS.some(k => t.includes(k));
  };

  // Busca todas as fontes em paralelo (timeout 5s cada)
  const results = await Promise.allSettled(
    FONTES.map(({ nome, url, cat }) =>
      fetchWithTimeout(url, 5000)
        .then(r => r.ok ? r.text() : "")
        .then(xml => {
          if (!xml) return [];
          const items = parseRSS(xml).slice(0, 8);
          return items.map(it => ({ ...it, nome, cat }));
        })
        .catch(() => [])
    )
  );

  const noticias = [];
  const seen = new Set();

  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    for (const it of r.value) {
      if (!it.title || !it.link || seen.has(it.link)) continue;
      seen.add(it.link);

      // Para fontes BR, filtra por relevância; globais já são todas relevantes
      if (it.cat === "Brasil" && !isRelevante(it.title + " " + it.description)) continue;

      noticias.push({
        titulo:    it.title,
        link:      it.link,
        descricao: it.description || "",
        data:      it.pubDate || "",
        dataISO:   it.pubDate ? new Date(it.pubDate).toISOString() : "",
        dataBR:    it.pubDate ? new Date(it.pubDate).toLocaleDateString("pt-BR") : "",
        fonte:     it.nome,
        cat:       it.cat,
      });
    }
  }

  // Ordena por data mais recente
  noticias.sort((a, b) => {
    if (!a.dataISO) return 1;
    if (!b.dataISO) return -1;
    return b.dataISO.localeCompare(a.dataISO);
  });

  res.json(noticias);
});

// POST /api/gerar-conteudo – gera post LinkedIn + roteiro Reels via Gemini (grátis)
app.post("/api/gerar-conteudo", async (req, res) => {
  const { titulo, descricao, link, fonte, geminiKey } = req.body || {};
  if (!titulo) return res.status(400).json({ erro: "titulo é obrigatório" });

  const chave = geminiKey || process.env.GEMINI_API_KEY;
  if (!chave) return res.status(400).json({ erro: "Informe sua Gemini API Key nas configurações (grátis em aistudio.google.com)" });

  const prompt = `Você é um especialista em canais, parcerias, channel sales e ELG (Ecosystem-Led Growth) com forte presença no LinkedIn brasileiro.

Com base nesta pesquisa/artigo:
Título: ${titulo}
Fonte: ${fonte || ""}
Resumo: ${descricao || ""}
Link: ${link || ""}

Crie DOIS conteúdos em português (pt-BR):

---POST LINKEDIN---
Post engajador com 150-200 palavras. Use dados ou insights do artigo. Inclua chamada para ação. Use emojis com moderação. Termine com 5 hashtags: #parcerias #canaisdevendas #ELG #partnerships #channelsales

---ROTEIRO REELS---
Roteiro de vídeo curto de 30-45 segundos para Instagram Reels. Formato: cena por cena, com texto na tela e narração. Tom dinâmico e direto. Tema: o insight principal da pesquisa aplicado à realidade de quem trabalha com canais no Brasil.`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${chave}`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });

    const data = await r.json();
    if (!r.ok) throw new Error(data.error?.message || `Gemini erro ${r.status}`);

    const texto = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const partes = texto.split(/---(?:POST LINKEDIN|ROTEIRO REELS)---/);
    const linkedin = (partes[1] || "").trim();
    const reels    = (partes[2] || "").trim();

    res.json({ linkedin, reels });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅ ACOM Mini BI rodando em http://localhost:${PORT}`);
  console.log(`   Dashboard → http://localhost:${PORT}`);
  console.log(`   Dados     → ${DB_FILE}\n`);
});
