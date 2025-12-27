#!/bin/bash

# Script de instalação do Docker (Versão Oficial Atualizada)
# Executar como root ou com sudo

echo "🐳 Iniciando instalação limpa da última versão do Docker..."

# 1. Remover versões antigas e conflitantes
echo "🧹 Removendo instalações antigas..."
# O comando abaixo tenta listar os pacotes específicos e removê-los.
# O '|| true' evita que o script pare se não houver nada para remover.
PACKAGES="docker.io docker-compose docker-compose-v2 docker-doc podman-docker containerd runc"
if dpkg --get-selections $PACKAGES 2>/dev/null | grep -q install; then
    sudo apt-get remove -y $(dpkg --get-selections $PACKAGES | cut -f1)
else
    echo "   Nenhum pacote antigo encontrado para remoção."
fi

# 2. Adicionar Chave GPG Oficial
echo "🔑 Configurando chaves de segurança..."
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# 3. Adicionar Repositório
echo "📦 Adicionando repositório oficial..."
sudo tee /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Signed-By: /etc/apt/keyrings/docker.asc
EOF

sudo apt-get update

# 4. Instalar Docker Engine
echo "⬇️ Instalando Docker CE e plugins..."
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo "✅ Instalação concluída!"
docker --version
docker compose version
echo "⚠️ Lembre-se de adicionar seu usuário ao grupo docker se ainda não fez: 'sudo usermod -aG docker \$USER'"
