#!/bin/bash

# Interface definitions
# Auto-detect default interface (the one with the default route)
WLAN_IFACE=$(ip route | grep default | awk '{print $5}' | head -n1)
if [ -z "$WLAN_IFACE" ]; then
    WLAN_IFACE="eth0" # Fallback
fi

echo "🔍 Interface detectada: $WLAN_IFACE"
TARGET_PORT="80"

# Check if running as root
if [ "$EUID" -ne 0 ]
  then echo "❌ Por favor, execute como root (sudo)."
  exit
fi

# Function to clear rules
cleanup() {
    echo "🧹 Limpando regras antigas..."
    # Warning: This tries to delete specific rule, if it fails that's fine
    iptables -t nat -D PREROUTING -i $WLAN_IFACE -p tcp --dport 80 -j REDIRECT --to-port $TARGET_PORT 2>/dev/null
}

# Apply cleanup first
cleanup

# Apply Rule
# Redirect all TCP traffic on port 80 arriving on wlan0 to localhost:80
echo "🚀 Aplicando redirecionamento: $WLAN_IFACE:80 -> localhost:$TARGET_PORT"
iptables -t nat -A PREROUTING -i $WLAN_IFACE -p tcp --dport 80 -j REDIRECT --to-port $TARGET_PORT

# List rules
echo "📋 Regras NAT atuais:"
iptables -t nat -vL PREROUTING -n

echo "✅ Configuração concluída."
