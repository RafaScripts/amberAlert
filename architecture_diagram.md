# Diagrama de Arquitetura - Simulação Alerta AMBER

```mermaid
graph TD
    subgraph LAN ["Rede Local (Laboratório)"]
        Smartphone["📱 Smartphone<br>(Vítima/Alvo)"]
        AP["📡 Access Point"]
    end

    subgraph Host ["Gateway Linux (HOST)"]
        eth0["Interface Física (wlan0/eth0)"]
        IPTables["🔥 firewall / iptables<br>(PREROUTING Redirect :80)"]
        
        subgraph Docker ["Docker Engine (network_mode: host)"]
            direction TB
            AdGuard["🛡️ AdGuard Home<br>(DHCP :67/68 + DNS :53)"]
            Traefik["🚦 Traefik Proxy<br>(Listen :80)"]
            NestJS["⚙️ NestJS Backend<br>(Captive Logic :3000)"]
        end
    end

    %% Conexões Físicas
    Smartphone <-->|Wi-Fi L2 Broadcast| AP
    AP <-->|Cabo/Wi-Fi| eth0
    
    %% Fluxos Lógicos
    eth0 <-->|"1. DHCP Request (Broadcast)"| AdGuard
    AdGuard -->|"2. DHCP Offer (IP + DNS=Gateway)"| eth0
    
    Smartphone -->|"3. DNS Query (captive.apple.com?)"| eth0
    eth0 --> AdGuard
    AdGuard -->|"4. DNS A Record (Gateway IP)"| eth0
    
    Smartphone -->|"5. HTTP Get (captive...)"| eth0
    eth0 -->|"6. Redirect TCP 80 -> 80"| IPTables
    IPTables --> Traefik
    
    Traefik -->|"7. Proxy Request"| NestJS
    NestJS -->|"8. Return Alert HTML"| Traefik
    Traefik -->|"9. Response"| eth0
    eth0 --> Smartphone

    %% Estilização
    classDef hardware fill:#f96,stroke:#333,stroke-width:2px;
    classDef software fill:#9cf,stroke:#333,stroke-width:2px;
    classDef docker fill:#cfc,stroke:#333,stroke-width:2px;
    
    class Smartphone,AP,eth0 hardware;
    class IPTables software;
    class AdGuard,Traefik,NestJS docker;
```

## Descrição do Fluxo

1.  **Associação L2**: O Smartphone se conecta ao AP.
2.  **DHCP (Crítico)**: O AdGuard (rodando em mode:host) detecta o *DHCP Discover* e atribui um IP, definindo o **DNS Server** como o próprio Gateway IP.
3.  **Captive Check**: O SO do smartphone tenta acessar uma URL de verificação (ex: `captive.apple.com`).
4.  **DNS Poisoning**: O AdGuard responde com o IP do Gateway para qualquer domínio de teste.
5.  **Intercepção**: O tráfego HTTP porta 80 é capturado pelo `iptables` no Host e redirecionado para o Traefik.
6.  **Entrega do Alerta**: O NestJS responde com o HTML do Alerta para *qualquer* caminho solicitado, enganando o Captive Portal Helper do celular, que exibe a página como uma tela de login/sistema.
