# Capítulo: Arquitetura de Simulação de Alerta de Emergência em Redes Locais

## 1. Introdução

Este projeto propõe uma arquitetura para simulação de alertas de emergência (como o Alerta AMBER) em ambientes controlados, utilizando dispositivos móveis comerciais sem a necessidade de instalação prévia de aplicativos ("Mobile-First"). A solução baseia-se na interceptação de tráfego em nível de rede e na manipulação dos mecanismos de detecção de conectividade (Captive Portal) presentes nos sistemas operacionais Android e iOS.

## 2. Desafios de Rede em Ambientes Conteinerizados

A implementação de serviços de infraestrutura de rede, especificamente DHCP (Dynamic Host Configuration Protocol), em ambientes conteinerizados (Docker) apresenta desafios técnicos significativos relacionados ao isolamento da pilha de rede.

### 2.1. O Problema do DHCP em Docker Bridges

O protocolo DHCP opera fundamentalmente na Camada 2 (Enlace) do modelo OSI, utilizando *broadcasts* para descoberta (DHCPDISCOVER). Em uma configuração padrão de Docker, os contêineres são isolados em redes *bridge* virtuais, separadas da interface física do host por NAT (Network Address Translation).

Consequentemente, pacotes de *broadcast* originados por dispositivos na rede física (Wi-Fi) não alcançam o servidor DHCP rodando dentro de um contêiner em rede *bridge*, impedindo a atribuição de endereços IP e, crucialmente, a definição dos servidores DNS autoritativos para os clientes.

### 2.2. Solução Adotada: Network Mode Host

Para superar essa limitação, optou-se pela utilização do driver de rede `host` (`network_mode: host`). Nesta configuração, o isolamento de rede do contêiner é removido, permitindo que os processos (AdGuard Home, no caso deste projeto) compartilhem diretamente as interfaces de rede e a tabela de roteamento do sistema hospedeiro.

> "A utilização de `network_mode: host` é mandatória para cenários onde o contêiner necessita manipular tráfego de broadcast L2 ou protocolos de roteamento que não atravessam NAT." (Documentação Docker)

Isso permite que o AdGuard Home receba as requisições DHCP diretamente da interface Wi-Fi (`wlan0`) e responda aos clientes, garantindo que o gateway da simulação seja configurado como o servidor DNS e Rota Padrão dos dispositivos móveis.

## 3. Mecanismo de Interceptação (Captive Portal)

A exibição do alerta baseia-se na exploração do comportamento de "Detecção de Captive Portal" dos sistemas móveis modernos.

### 3.1. DNS Spoofing e Redirecionamento

Ao conectar-se à rede, o dispositivo móvel recebe via DHCP o endereço do Gateway (ex: `192.168.10.1`) como seu servidor DNS. O Sistema Operacional realiza, então, uma requisição HTTP/HTTPS para um domínio de verificação conhecido (ex: `captive.apple.com` ou `connectivitycheck.gstatic.com`).

O serviço AdGuard Home é configurado com regras de *DNS Rewrite* para responder a estas consultas com o próprio IP do Gateway, ao invés do IP real dos servidores da Apple ou Google.

### 3.2. Proxy Reverso e MITM

O tráfego HTTP resultante (porta 80) é interceptado no nível do Kernel do Host via regras de `iptables` e redirecionado para um Proxy Reverso (Traefik) também executando em modo `host`.

```bash
# Exemplo de regra de interceptação
iptables -t nat -A PREROUTING -i wlan0 -p tcp --dport 80 -j REDIRECT --to-port 80
```

O Traefik encaminha a requisição para o backend (NestJS), que responde invariavelmente com o HTML do Alerta de Emergência. O Sistema Operacional, ao receber uma resposta válida (HTTP 200) contendo o alerta, interpreta que há um "portal" que requer interação e exibe automaticamente a interface Webview em tela cheia para o usuário — simulando a recepção de um alerta *push* nativo.

## 4. Conclusão

A arquitetura desenvolvida demonstra que é possível simular alertas de nível de operadora utilizando hardware de baixo custo e software open source, desde que respeitados os princípios fundamentais de engenharia de rede (L2 Broadcasts) através da configuração correta do runtime de contêineres. A abordagem garante compatibilidade universal com dispositivos móveis sem modificações no cliente, validando o conceito para fins de treinamento e simulação.
