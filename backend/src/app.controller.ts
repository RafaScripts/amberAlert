import { Controller, All, Get, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller()
export class AppController {
  
  @All('*')
  getAlert(@Res() res: Response) {
    // This HTML simulates the Amber Alert interface
    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ALERTA DE EMERGÊNCIA</title>
        <style>
          body {
            background-color: #D32F2F; /* Emergency Red */
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            text-align: center;
            padding: 20px;
            margin: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
          }
          h1 {
            font-size: 2.5rem;
            text-transform: uppercase;
            margin-bottom: 0.5rem;
            animation: blink 1s infinite;
          }
          .icon {
            font-size: 4rem;
            margin-bottom: 1rem;
          }
          .details {
            background: white;
            color: #333;
            padding: 20px;
            border-radius: 10px;
            width: 100%;
            max-width: 400px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
          }
          .details h2 {
            margin-top: 0;
            color: #D32F2F;
          }
          p {
            font-size: 1.1rem;
            line-height: 1.5;
          }
          @keyframes blink {
            50% { opacity: 0.5; }
          }
          /* Button to satisfy captive portal "Done" logic if needed, though usually just loading this is enough */
          .btn {
            display: inline-block;
            margin-top: 20px;
            padding: 10px 20px;
            background: #D32F2F;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="icon">⚠️</div>
        <h1>ALERTA AMBER</h1>
        <div class="details">
          <h2>PROCURA-SE CRIANÇA</h2>
          <p><strong>Nome:</strong> Maria da Silva</p>
          <p><strong>Idade:</strong> 6 anos</p>
          <p><strong>Visto por último:</strong> Parque Central, 14:00</p>
          <p><strong>Suspeito:</strong> Homem, carro sedan preto.</p>
          <p>Por favor, ligue para 190 se tiver informações.</p>
          
          <br>
          <small>Simulação de Sistema de Emergência</small>
        </div>
      </body>
      </html>
    `;

    res.header('Content-Type', 'text/html');
    res.send(html);
  }
}
