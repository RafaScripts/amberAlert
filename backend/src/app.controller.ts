import { Controller, All, Get, Post, Res, Body } from '@nestjs/common';
import { Response } from 'express';

@Controller()
export class AppController {
  private isAlertActive = false;
  
  // Endpoint para o Admin ligar/desligar o alerta
  @Post('admin/toggle')
  toggleAlert(@Body() body: { active: boolean }, @Res() res: Response) {
    this.isAlertActive = body.active ?? !this.isAlertActive; // Toggle if no body
    console.log(`🚨 Estado do Alerta alterado para: ${this.isAlertActive ? 'ATIVO' : 'INATIVO'}`);
    return res.json({ status: 'ok', active: this.isAlertActive });
  }

  // Endpoint para o Frontend verificar estado (Polling)
  @Get('api/status')
  checkStatus(@Res() res: Response) {
    return res.json({ active: this.isAlertActive });
  }

  // Catch-All: Serve a Página Inteligente
  @All('*')
  getAlert(@Res() res: Response) {
    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Conectividade de Rede</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            margin: 0;
            padding: 0;
            height: 100vh;
            transition: background-color 0.5s ease;
          }

          /* --- SAFE MODE STYLES --- */
          #safe-mode {
            display: ${this.isAlertActive ? 'none' : 'flex'};
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            background-color: #f0f4f8;
            color: #2c3e50;
          }
          .loader {
            border: 5px solid #bdc3c7;
            border-top: 5px solid #3498db;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
          }

          /* --- ALERT MODE STYLES --- */
          #alert-mode {
            display: ${this.isAlertActive ? 'flex' : 'none'};
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            background-color: #D32F2F; /* Emergency Red */
            color: white;
            text-align: center;
            padding: 20px;
          }

          h1 { text-transform: uppercase; margin-bottom: 0.5rem; }
          .blink { animation: blink 1s infinite; }
          .icon { font-size: 5rem; margin-bottom: 10px; }
          
          .details {
            background: white;
            color: #333;
            padding: 20px;
            border-radius: 10px;
            width: 90%;
            max-width: 400px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            text-align: left;
          }
          .details h2 { color: #D32F2F; margin-top: 0; text-align: center;}
          
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          @keyframes blink { 50% { opacity: 0.5; } }
          
          /* Footer to keep connection alive */
          .footer { margin-top: 30px; font-size: 0.8rem; opacity: 0.7; }
        </style>
      </head>
      <body>
        <!-- VIEW: SAFE MODE (Estado Inicial) -->
        <div id="safe-mode">
          <div class="loader"></div>
          <h2>Conectando à Rede...</h2>
          <p>Verificando status de segurança.</p>
          <small>Mantenha esta tela aberta.</small>
        </div>

        <!-- VIEW: ALERT MODE (Disparo) -->
        <div id="alert-mode">
          <div class="icon">⚠️</div>
          <h1 class="blink">ALERTA AMBER</h1>
          <div class="details">
            <h2>PROCURA-SE CRIANÇA</h2>
            <p><strong>Nome:</strong> Maria da Silva</p>
            <p><strong>Idade:</strong> 6 anos</p>
            <p><strong>Visto por último:</strong> Parque Central, 14:00</p>
            <p><strong>Suspeito:</strong> Homem, carro sedan preto.</p>
            <hr>
            <p style="text-align: center; font-weight: bold;">LIGUE IMEDIATAMENTE: 190</p>
          </div>
          <div class="footer">Sistema Nacional de Emergência</div>
        </div>

        <script>
          // O script roda no celular e fica perguntando pro servidor: "E aí, tá tudo bem?"
          // Se o servidor responder "true" (Alerta Ativo), o script muda a tela.
          
          let isActive = ${this.isAlertActive};

          setInterval(async () => {
            try {
              // Verifica status a cada 2 segundos
              const response = await fetch('/api/status');
              const data = await response.json();
              
              if (data.active !== isActive) {
                isActive = data.active;
                updateScreen(isActive);
              }
            } catch (e) {
              console.log('Connection check failed, retrying...');
            }
          }, 2000);

          function updateScreen(active) {
            const safe = document.getElementById('safe-mode');
            const alert = document.getElementById('alert-mode');
            
            if (active) {
              safe.style.display = 'none';
              alert.style.display = 'flex';
              // Vibrar se suportado (Android)
              if (navigator.vibrate) navigator.vibrate([500, 200, 500]);
            } else {
              alert.style.display = 'none';
              safe.style.display = 'flex';
            }
          }
        </script>
      </body>
      </html>
    `;

    res.header('Content-Type', 'text/html');
    res.send(html);
  }
}

