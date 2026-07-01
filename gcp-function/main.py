import json
import logging
from datetime import datetime, timezone

import functions_framework
from flask import Request, jsonify
from google.cloud import bigquery

logging.basicConfig(level=logging.INFO)

PROJECT_ID = "SEU_PROJETO"        # ← substitua pelo ID do projeto GCP
DATASET_ID = "acom_canais"
TABLE_ID   = "indicacoes_raw"

TABLE_REF  = f"{PROJECT_ID}.{DATASET_ID}.{TABLE_ID}"

CAMPOS_OBRIGATORIOS = {"id_negocio", "nome_parceiro", "status"}

bq_client = bigquery.Client(project=PROJECT_ID)


@functions_framework.http
def atendare_sync(request: Request):
    # CORS – permite chamadas da extensão Chrome
    headers = {
        "Access-Control-Allow-Origin":  "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if request.method == "OPTIONS":
        return ("", 204, headers)

    if request.method != "POST":
        return (jsonify({"erro": "Método não permitido"}), 405, headers)

    try:
        body = request.get_json(silent=True)
    except Exception:
        return (jsonify({"erro": "JSON inválido"}), 400, headers)

    if not body or "negocios" not in body:
        return (jsonify({"erro": "Campo 'negocios' ausente no payload"}), 400, headers)

    negocios = body["negocios"]
    if not isinstance(negocios, list) or len(negocios) == 0:
        return (jsonify({"erro": "'negocios' deve ser uma lista não vazia"}), 400, headers)

    ts_extracao = datetime.now(timezone.utc).isoformat()
    linhas = []

    for neg in negocios:
        # Valida campos obrigatórios
        faltando = CAMPOS_OBRIGATORIOS - set(neg.keys())
        if faltando:
            logging.warning("Negócio ignorado – campos faltando: %s | dados: %s", faltando, neg)
            continue

        # Normaliza data_indicacao para DATE (aceita dd/mm/yyyy ou yyyy-mm-dd)
        data_ind = _parse_date(neg.get("data_indicacao", ""))

        linhas.append({
            "id_negocio":     str(neg["id_negocio"]).strip(),
            "nome_negocio":   str(neg.get("nome_negocio", "")).strip(),
            "nome_parceiro":  str(neg["nome_parceiro"]).strip(),
            "data_indicacao": data_ind,
            "status":         str(neg["status"]).strip(),
            "data_extracao":  ts_extracao,
            "fonte":          str(body.get("fonte", "chrome-extension")),
        })

    if not linhas:
        return (jsonify({"erro": "Nenhum registro válido para inserir"}), 422, headers)

    erros = bq_client.insert_rows_json(TABLE_REF, linhas)
    if erros:
        logging.error("Erros BigQuery: %s", erros)
        return (jsonify({"erro": "Falha ao inserir no BigQuery", "detalhes": erros}), 500, headers)

    logging.info("Inseridos %d registros em %s", len(linhas), TABLE_REF)
    return (jsonify({"ok": True, "inseridos": len(linhas), "ts": ts_extracao}), 200, headers)


def _parse_date(raw: str) -> str | None:
    """Converte dd/mm/yyyy ou yyyy-mm-dd → yyyy-mm-dd. Retorna None se inválido."""
    raw = raw.strip()
    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y"):
        try:
            return datetime.strptime(raw, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return None
