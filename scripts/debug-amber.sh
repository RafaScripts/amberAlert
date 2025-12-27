#!/bin/bash
echo "🔍 DIAGNÓSTICO AMBER ALERT"
echo "==============================================="

echo "1. 🐳 Checando Containers..."
docker compose ps
echo ""

echo "2. 👂 Checando Portas (80, 53, 3001)..."
# Tenta netstat, fallback para ss
if command -v netstat >/dev/null; then
    sudo netstat -tulpn | grep -E ':(80|53|3001|3000)\b'
else
    sudo ss -tulpn | grep -E ':(80|53|3001|3000)\b'
fi
echo ""

echo "3. 🧪 Teste Interno NestJS (Porta 3001)..."
curl -I -m 2 http://127.0.0.1:3001 2>/dev/null | head -n 1
if [ $? -eq 0 ]; then echo "   ✅ Backend respondendo."; else echo "   ❌ Falha ao acessar Backend."; fi
echo ""

echo "4. 🚦 Teste Traefik (Porta 80)..."
curl -I -m 2 -H "Host: captive.apple.com" http://127.0.0.1:80 2>/dev/null | head -n 1
if [ $? -eq 0 ]; then echo "   ✅ Proxy respondendo."; else echo "   ❌ Falha ao acessar Proxy."; fi
echo ""

echo "5. 🔥 Regras de IPTables (NAT)..."
sudo iptables -t nat -L PREROUTING -n -v
echo ""

echo "6. 🌐 IP Forwarding..."
cat /proc/sys/net/ipv4/ip_forward
echo "==============================================="
