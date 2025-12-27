#!/bin/bash

BASE_URL="http://127.0.0.1:3001"

if [ "$1" == "on" ]; then
    echo "🚨 ATIVANDO ALERTA AMBER..."
    curl -X POST -H "Content-Type: application/json" -d '{"active": true}' $BASE_URL/admin/toggle
    echo ""
elif [ "$1" == "off" ]; then
    echo "✅ Desativando Alerta (Modo Seguro)..."
    curl -X POST -H "Content-Type: application/json" -d '{"active": false}' $BASE_URL/admin/toggle
    echo ""
else
    echo "Uso: ./trigger-alert.sh [on|off]"
fi
