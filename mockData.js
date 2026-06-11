// Dados iniciais de simulação para a Central Executiva de Canais
const INITIAL_DATA = {
  leadsIndicated: [
    { id: "l1", date: "2026-06-02", partner: "Linx", quantity: 4 },
    { id: "l2", date: "2026-06-09", partner: "Oracle", quantity: 5 },
    { id: "l3", date: "2026-06-16", partner: "Easy Assist", quantity: 6 },
    { id: "l4", date: "2026-06-23", partner: "Linx", quantity: 6 }
  ],
  leadsPrime: [
    {
      id: "p1",
      company: "Oracle",
      status: "Primeira reunião realizada. Interesse em integração com ERP Everest.",
      nextStep: "Apresentação técnica detalhada."
    },
    {
      id: "p2",
      company: "Linx",
      status: "Proposta comercial de canais em análise pela diretoria executiva.",
      nextStep: "Reunião de alinhamento e assinatura de contrato."
    },
    {
      id: "p3",
      company: "Easy Assist",
      status: "Mapeamento inicial de escopo técnico concluído.",
      nextStep: "Envio de proposta de comissionamento de canais."
    }
  ],
  travels: [
    {
      id: "v1",
      date: "2026-06-03",
      city: "São Paulo - SP",
      partner: "Linx",
      result: "Alinhamento do plano de metas anual e validação de canais de venda regionais.",
      nextStep: "Criar material e playbook conjunto de vendas."
    },
    {
      id: "v2",
      date: "2026-06-10",
      city: "Belo Horizonte - MG",
      partner: "Oracle",
      result: "Definição de modelo de integração com ERP Everest estruturado e aceito.",
      nextStep: "Agendar demonstração técnica da API de integração."
    }
  ],
  relationships: [
    {
      id: "r1",
      partner: "Linx",
      subject: "Planejamento comercial conjunto",
      lastUpdate: "2026-06-05"
    },
    {
      id: "r2",
      partner: "Easy Assist",
      subject: "Primeira oportunidade mapeada",
      lastUpdate: "2026-06-04"
    },
    {
      id: "r3",
      partner: "Oracle",
      subject: "Definição de estratégia de mercado",
      lastUpdate: "2026-06-07"
    }
  ],
  contacts: [
    {
      id: "c1",
      partner: "Oracle",
      subject: "Estratégia comercial",
      date: "2026-06-02"
    },
    {
      id: "c2",
      partner: "Linx",
      subject: "Capacitação técnica de pré-vendas",
      date: "2026-06-03"
    },
    {
      id: "c3",
      partner: "Easy Assist",
      subject: "Oportunidade conjunta - Cliente Varejo",
      date: "2026-06-04"
    },
    {
      id: "c4",
      partner: "Oracle",
      subject: "Ajuste na proposta técnica",
      date: "2026-06-09"
    },
    {
      id: "c5",
      partner: "Linx",
      subject: "Revisão de metas do trimestre",
      date: "2026-06-15"
    }
  ],
  users: [
    {
      email: "diretor@empresa.com",
      name: "Você (Administrador Principal)",
      role: "ADMIN",
      invitedBy: "Sistema",
      lastAccess: "2026-06-08 14:07"
    },
    {
      email: "vp.vendas@empresa.com",
      name: "VP de Vendas",
      role: "VISUALIZADOR",
      invitedBy: "diretor@empresa.com",
      lastAccess: "2026-06-08 11:24"
    },
    {
      email: "gerente.parcerias@empresa.com",
      name: "Gerente de Canais",
      role: "VISUALIZADOR",
      invitedBy: "diretor@empresa.com",
      lastAccess: "2026-06-07 16:40"
    }
  ]
};

// Exportar ou disponibilizar globalmente
if (typeof window !== "undefined") {
  window.INITIAL_DATA = INITIAL_DATA;
}
