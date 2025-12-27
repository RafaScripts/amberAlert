# Manual de Configuração e Testes - Simulação Alerta AMBER

Este documento descreve o passo-a-passo para preparar o ambiente, iniciar os serviços e validar a simulação de Alerta de Emergência.

## 📋 Pré-requisitos

*   **Sistema Operacional:** Ubuntu Linux (ou derivado Debian) rodando em máquina física ou VM com acesso direto à interface Wi-Fi (USB Passthrough se for VM).
*   **Interface de Rede:** Uma interface Wi-Fi disponível (ex: `wlan0`) que funcionará como Access Point ou conectada a um roteador "burro" (Apenas AP, sem DHCP).
    *   *Recomendação:* Use o Host Linux como um Access Point (Hotspot) ou conecte-o via cabo a um roteador Wi-Fi onde o DHCP esteja **DESATIVADO**.

---

## 🚀 Parte 1: Preparação do Host

### 1.1 Instalar Docker Atualizado
Se ainda não instalou o Docker, use o script fornecido na pasta `scripts/`:

```bash
cd /caminho/para/amberAlert
chmod +x scripts/install-docker.sh
sudo ./scripts/install-docker.sh
```

### 1.2 Limpar Serviços de Rede Conflitantes
Para que o **AdGuard Home** gerencie o DNS (porta 53) e DHCP (portas 67/68), é necessário parar os serviços nativos do Ubuntu:

```bash
# Para o resolvedor de DNS do systemd
sudo systemctl stop systemd-resolved
sudo systemctl disable systemd-resolved

# Remove qualquer configuração residual de DNS
sudo rm /etc/resolv.conf
echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf

# Se houver outros servidores DHCP (dnsmasq, isch-dhcp-server), pare-os:
sudo service dnsmasq stop
sudo service isc-dhcp-server stop
```

---

## 🛠️ Parte 2: Execução dos Serviços

### 2.1 Iniciar os Contêineres
Na raiz do projeto, execute:

```bash
docker-compose up -d --build
```

Verifique se todos estão rodando ("Up"):
```bash
docker-compose ps
```
Você deve ver:
*   `adguard` (DHCP/DNS)
*   `traefik` (Proxy Porta 80)
*   `nestjs` (Backend Alerta Porta 3000)

---

## ⚙️ Parte 3: Configuração do AdGuard Home (Crítico)

Acesse a interface de configuração. Como estamos usando `network_mode: host`, o AdGuard estará acessível diretamente no IP da máquina.

1.  Abra no navegador: `http://localhost:3000` (ou IP da máquina:3000).
    *   *Nota:* Se der conflito com o NestJS (que também usa 3000), pare o NestJS (`docker stop nestjs`), configure o AdGuard, e depois inicie o NestJS novamente.
2.  **Passos do Wizard:**
    *   **Interface Web Admin:** Mude para a porta **8080** (Fundamental para liberar a 80 para o Traefik).
    *   **Servidor DNS:** Mantenha na porta **53**.
3.  Crie login e senha.

### 3.1 Ativar DHCP (O Passo Mais Importante)
1.  Vá em **Settings** → **DHCP Settings**.
2.  Selecione a interface de rede que os celulares usarão (ex: `wlan0`, `eth0`).
3.  Clique em **Enable DHCP Server**.
4.  Preencha:
    *   **Gateway IP:** O endereço IP desta máquina Linux (ex: `192.168.10.1`).
    *   **Subnet Mask:** `255.255.255.0`.
    *   **Range:** `192.168.10.100` a `192.168.10.200`.
    *   **Lease Time:** `3600`.
5.  Salve. O AdGuard verificará se há outros servidores DHCP. Se houver erro, certifique-se de ter seguido a "Parte 1.2".

### 3.2 DNS Rewrites (O "Veneno")
Para forçar o Captive Portal, todos os domínios de teste devem apontar para o nosso Gateway.
1.  Vá em **Filters** → **DNS rewriting**.
2.  Adicione as seguintes regras (redirecionando para o IP do seu Gateway/Host):
    *   `*.apple.com` → `192.168.10.1`
    *   `*.icloud.com` → `192.168.10.1`
    *   `connectivitycheck.gstatic.com` → `192.168.10.1`
    *   `clients3.google.com` → `192.168.10.1`
    *   `cp.captive.portal` → `192.168.10.1`

---

## 🔥 Parte 4: Ativar Interceptação (MITM)

Agora que o celular recebe o IP e o DNS aponta para nós, precisamos interceptar o tráfego HTTP (Porta 80) e enviar para o Traefik.

Execute o script de `iptables`:

```bash
sudo ./scripts/setup-iptables.sh
```

**O que isso faz?**
Toda conexão TCP porta 80 que chega na interface Wi-Fi é redirecionada para `localhost:80` (onde o Traefik está ouvindo).

---

## 📱 Parte 5: Teste e Validação

### 5.1 Conectar a Vítima (Simulação)
1.  Pegue um celular (Android ou iPhone).
2.  "Esqueça" a rede Wi-Fi se já estiver salva.
3.  Conecte na rede Wi-Fi do laboratório.

### 5.2 O que deve acontecer (Automático)
1.  O celular recebe IP via DHCP do AdGuard.
2.  O sistema operacional tenta verificar conectividade (ex: `captive.apple.com`).
3.  O AdGuard mente o IP (diz que é o Gateway).
4.  O celular faz um `GET /` na porta 80 do Gateway.
5.  O `iptables` joga para o Traefik → NestJS.
6.  O NestJS devolve o HTML do `ALERTA AMBER`.
7.  **SUCESSO:** O celular abre automaticamente uma tela de sistema ("Log In to Network") exibindo o Alerta, antes mesmo de liberar o uso da internet.

### 5.3 Troubleshooting / Erros Comuns

| Sintoma | Causa Provável | Solução |
| :--- | :--- | :--- |
| **Erro "Bind address already in use" no AdGuard** | Porta 80 ocupada pelo Traefik ou Apache/Nginx. | No setup inicial do AdGuard, mude a porta da **Interface Web** para **8080**. |
| **Celular não conecta / Falha ao obter IP** | DHCP não está ativo ou porta 67 bloquada. | Verifique logs do AdGuard; pare `dnsmasq` no host. |
| **Celular conecta mas navega na internet normal** | DNS Rewrite não funcionou ou Celular usou 4G. | Desative Dados Móveis; verifique regras de DNS Rewrite. |
| **Celular carrega e fica branco / Timeout** | Firewall mal configurado ou Traefik parado. | Rode `./setup-iptables.sh`; verifique `docker ps`. |
| **Erro "Connection Refused"** | Backend não está rodando. | Verifique logs: `docker logs nestjs`. |

### 5.4 Teste Manual (Fallback / Debug)

Se o DHCP não funcionar ou você quiser "apontar manualmente" o celular para o servidor para testes:

### 5.4 Teste Manual (Simulação de DNS/Gateway)

Caso o DHCP falhe (ex: roteador da casa interferindo), configure o IP estático manualmente no celular para forçar o tráfego a passar pela nossa VM.

#### 🤖 Android
1.  Vá em **Configurações** → **Wi-Fi**.
2.  Toque e segure no nome da rede Wi-Fi (ou clique na engrenagem/seta ao lado).
3.  Selecione **Modificar Rede** (ou Configurações Avançadas).
4.  Procure por **Configurações de IP** e mude de `DHCP` para **`Estático`**.
5.  Preencha:
    *   **Endereço IP:** `192.168.1.200` (IP livre na sua rede).
    *   **Gateway:** `192.168.1.109` (IP da VM Amber).
    *   **DNS 1:** `192.168.1.109` (IP da VM Amber).
    *   **DNS 2:** (Deixar vazio ou 8.8.8.8 se quiser testar internet real, mas para o alerta use o da VM).
6.  Salvar.
7.  Desligue e ligue o Wi-Fi.

#### 🍎 iOS (iPhone/iPad)
1.  Vá em **Ajustes** → **Wi-Fi**.
2.  Toque no ícone **(i)** azul ao lado da rede conectada.
3.  Role até **Configurar IP** e mude para **`Manual`**.
    *   **Endereço:** `192.168.1.200`
    *   **Máscara de Sub-rede:** `255.255.255.0`
    *   **Roteador:** `192.168.1.109`
4.  Volte, toque em **Configurar DNS** e mude para **`Manual`**.
    *   Apague os servidores existentes.
    *   Adicione servidor: `192.168.1.109`.
5.  Toque em **Salvar**.

**Teste Final:**
Abra o navegador e acesse `http://captive.apple.com`. Deve aparecer o Alerta.

