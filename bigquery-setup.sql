-- ============================================================
-- ACOM Sistemas – Mini BI Canais & Parcerias
-- BigQuery Setup: tabela raw + view deduplicada + views de BI
-- ============================================================


-- ── 1. DATASET ────────────────────────────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS `SEU_PROJETO.acom_canais`
  OPTIONS (location = 'us-central1');  -- ajuste a região se necessário


-- ── 2. TABELA RAW (histórico bruto de todas as extrações) ─────────────────────
CREATE TABLE IF NOT EXISTS `SEU_PROJETO.acom_canais.indicacoes_raw` (
  id_negocio      STRING    NOT NULL,
  nome_negocio    STRING,
  nome_parceiro   STRING    NOT NULL,
  data_indicacao  DATE,
  status          STRING    NOT NULL,  -- ex: "Ganho", "Em andamento", "Perdido"
  data_extracao   TIMESTAMP NOT NULL,  -- momento em que a extensão extraiu o dado
  fonte           STRING               -- ex: "chrome-extension"
)
PARTITION BY DATE(data_extracao)       -- particiona por dia de extração (economia de custo)
CLUSTER BY nome_parceiro, status       -- acelera filtros por parceiro e status
OPTIONS (
  description = "Histórico bruto de indicações extraídas do Atendare via extensão Chrome."
);


-- ── 3. VIEW DEDUPLICADA (sempre use esta view no Looker Studio) ───────────────
-- Mantém apenas o registro mais recente de cada negócio,
-- evitando duplicatas quando a mesma página é extraída mais de uma vez.
CREATE OR REPLACE VIEW `SEU_PROJETO.acom_canais.vw_indicacoes` AS
WITH ranked AS (
  SELECT
    *,
    ROW_NUMBER() OVER (
      PARTITION BY id_negocio
      ORDER BY data_extracao DESC
    ) AS rn
  FROM `SEU_PROJETO.acom_canais.indicacoes_raw`
)
SELECT
  id_negocio,
  nome_negocio,
  nome_parceiro,
  data_indicacao,
  status,
  data_extracao,
  fonte,

  -- Campos derivados de data para facilitar os gráficos no Looker Studio
  EXTRACT(YEAR  FROM data_indicacao)                       AS ano,
  EXTRACT(MONTH FROM data_indicacao)                       AS mes_num,
  FORMAT_DATE('%Y-%m', data_indicacao)                     AS ano_mes,      -- ex: "2026-06"
  FORMAT_DATE('%B %Y', data_indicacao)                     AS mes_extenso,  -- ex: "Junho 2026"
  EXTRACT(WEEK  FROM data_indicacao)                       AS semana_num,
  FORMAT_DATE('%Y-S%V', data_indicacao)                    AS ano_semana,   -- ex: "2026-S24"
  DATE_TRUNC(data_indicacao, WEEK(MONDAY))                 AS inicio_semana, -- para gráfico de linha

  -- Flag de negócio ganho
  IF(LOWER(status) LIKE '%ganho%' OR LOWER(status) LIKE '%won%', TRUE, FALSE) AS is_ganho

FROM ranked
WHERE rn = 1;


-- ── 4. VIEW: KPIs ANUAIS E MENSAIS ───────────────────────────────────────────
-- Usada para os scorecards de "Total de indicações do ano" e "do mês atual".
CREATE OR REPLACE VIEW `SEU_PROJETO.acom_canais.vw_kpis_periodo` AS
SELECT
  EXTRACT(YEAR FROM data_indicacao)        AS ano,
  FORMAT_DATE('%Y-%m', data_indicacao)     AS ano_mes,
  COUNT(*)                                 AS total_indicacoes,
  COUNTIF(is_ganho)                        AS total_ganhos
FROM `SEU_PROJETO.acom_canais.vw_indicacoes`
WHERE data_indicacao IS NOT NULL
GROUP BY 1, 2;


-- ── 5. VIEW: INDICAÇÕES POR SEMANA ───────────────────────────────────────────
-- Alimenta o gráfico de barras/linha semanal.
CREATE OR REPLACE VIEW `SEU_PROJETO.acom_canais.vw_indicacoes_semana` AS
SELECT
  ano_semana,
  inicio_semana,
  ano,
  COUNT(*)          AS total_indicacoes,
  COUNTIF(is_ganho) AS total_ganhos
FROM `SEU_PROJETO.acom_canais.vw_indicacoes`
WHERE data_indicacao IS NOT NULL
GROUP BY 1, 2, 3
ORDER BY inicio_semana;


-- ── 6. VIEW: RANKING DE PARCEIROS ─────────────────────────────────────────────
-- Alimenta a tabela de ranking e o gráfico de pizza/barras por parceiro.
CREATE OR REPLACE VIEW `SEU_PROJETO.acom_canais.vw_ranking_parceiros` AS
SELECT
  nome_parceiro,
  COUNT(*)                                             AS total_indicacoes,
  COUNTIF(is_ganho)                                    AS contas_ganhas,
  SAFE_DIVIDE(COUNTIF(is_ganho), COUNT(*))             AS taxa_conversao,
  MAX(data_indicacao)                                  AS ultima_indicacao
FROM `SEU_PROJETO.acom_canais.vw_indicacoes`
WHERE data_indicacao IS NOT NULL
  AND nome_parceiro IS NOT NULL
  AND nome_parceiro != ''
GROUP BY 1
ORDER BY total_indicacoes DESC;


-- ── 7. QUERY DE TESTE RÁPIDO ──────────────────────────────────────────────────
-- Rode esta query para validar se os dados chegaram corretamente.
/*
SELECT
  nome_parceiro,
  total_indicacoes,
  contas_ganhas,
  ROUND(taxa_conversao * 100, 1) AS conversao_pct,
  ultima_indicacao
FROM `SEU_PROJETO.acom_canais.vw_ranking_parceiros`
LIMIT 20;
*/
