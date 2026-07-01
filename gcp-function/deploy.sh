#!/usr/bin/env bash
# deploy.sh – Implanta a Cloud Function no GCP
# Pré-requisitos: gcloud CLI autenticado, projeto configurado.
#
# Uso:
#   chmod +x deploy.sh
#   ./deploy.sh

set -euo pipefail

PROJECT_ID="SEU_PROJETO"          # ← substitua pelo ID do projeto GCP
REGION="us-central1"
FUNCTION_NAME="atendare-sync"
RUNTIME="python312"
MEMORY="256MB"
TIMEOUT="60s"

echo "▶ Configurando projeto: $PROJECT_ID"
gcloud config set project "$PROJECT_ID"

echo "▶ Habilitando APIs necessárias..."
gcloud services enable cloudfunctions.googleapis.com \
                        cloudbuild.googleapis.com \
                        bigquery.googleapis.com \
                        run.googleapis.com

echo "▶ Implantando Cloud Function '$FUNCTION_NAME'..."
gcloud functions deploy "$FUNCTION_NAME" \
  --gen2 \
  --runtime="$RUNTIME" \
  --region="$REGION" \
  --source=. \
  --entry-point=atendare_sync \
  --trigger-http \
  --allow-unauthenticated \
  --memory="$MEMORY" \
  --timeout="$TIMEOUT" \
  --set-env-vars="GCP_PROJECT=$PROJECT_ID"

echo ""
echo "✅ Deploy concluído!"
echo "URL da função:"
gcloud functions describe "$FUNCTION_NAME" \
  --gen2 --region="$REGION" \
  --format="value(serviceConfig.uri)"
