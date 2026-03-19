import { Injectable, inject, signal } from '@angular/core';
import { DataService } from './data.service';

@Injectable({ providedIn: 'root' })
export class TelegramBotService {
  dataService = inject(DataService);
  
  private token = '';
  private offset = 0;
  private isPolling = false;

  botStatus = signal<'disconnected' | 'connected' | 'error'>('disconnected');
  botName = signal<string>('');

  constructor() {
    try {
      if (typeof TELEGRAM_BOT_TOKEN !== 'undefined') {
        this.token = TELEGRAM_BOT_TOKEN;
      }
    } catch {
      // TELEGRAM_BOT_TOKEN might not be defined
    }

    if (this.token && this.token !== 'undefined' && this.token !== '') {
      this.startPolling();
    }
  }

  async startPolling() {
    if (this.isPolling) return;
    this.isPolling = true;
    
    try {
      const meRes = await fetch(`https://api.telegram.org/bot${this.token}/getMe`);
      const meData = await meRes.json();
      if (meData.ok) {
        this.botName.set(meData.result.username);
        this.botStatus.set('connected');
      } else {
        this.botStatus.set('error');
        return;
      }
    } catch {
      this.botStatus.set('error');
      return;
    }

    this.poll();
  }

  private async poll() {
    while (this.isPolling) {
      try {
        const res = await fetch(`https://api.telegram.org/bot${this.token}/getUpdates?offset=${this.offset}&timeout=30`);
        if (!res.ok) {
          await new Promise(r => setTimeout(r, 5000));
          continue;
        }
        const data = await res.json();
        
        if (data.ok && data.result.length > 0) {
          for (const update of data.result) {
            this.offset = update.update_id + 1;
            if (update.message && update.message.text) {
              await this.handleMessage(update.message);
            }
          }
        }
      } catch (e) {
        console.error('Telegram polling error:', e);
        await new Promise(r => setTimeout(r, 5000));
      }
    }
  }

  private async handleMessage(message: { chat: { id: number }, text: string }) {
    const chatId = message.chat.id;
    const text = message.text.trim();

    if (text.startsWith('/start')) {
      await this.sendMessage(chatId, `¡Hola! Soy el bot de RemesaFlow. 🚀\n\nPuedes usar los siguientes comandos:\n/wallet - Revisar tus balances\n/remesa - Registrar una nueva remesa\n/ganancias - Ver tus ganancias`);
    } else if (text.startsWith('/wallet')) {
      const balances = this.dataService.balances();
      let msg = '💰 *Tu Wallet*\n\n';
      let hasBalances = false;
      for (const [currency, amount] of Object.entries(balances)) {
        if (amount > 0) {
          msg += `${currency}: ${amount.toFixed(2)}\n`;
          hasBalances = true;
        }
      }
      if (!hasBalances) {
        msg += 'Tu wallet está vacía.';
      }
      await this.sendMessage(chatId, msg);
    } else if (text.startsWith('/ganancias')) {
      const remittances = this.dataService.remittances();
      const exchanges = this.dataService.exchanges();
      
      let totalRemittancesProfit = 0;
      remittances.forEach(r => totalRemittancesProfit += (r.profitInBase || 0));
      
      let totalExchangesProfit = 0;
      exchanges.forEach(e => totalExchangesProfit += (e.profit || 0));
      
      let msg = '📈 *Tus Ganancias*\n\n';
      msg += `Ganancias por Remesas: ${totalRemittancesProfit.toFixed(2)}\n`;
      msg += `Ganancias por Intercambios: ${totalExchangesProfit.toFixed(2)}\n`;
      
      await this.sendMessage(chatId, msg);
    } else if (text.startsWith('/remesa')) {
      const parts = text.split(' ');
      if (parts.length >= 5) {
        const amount = parseFloat(parts[1]);
        const base = parts[2].toUpperCase();
        const quote = parts[3].toUpperCase();
        const name = parts.slice(4).join(' ');
        
        const pairId = `${base}-${quote}`;
        const pair = this.dataService.pairs().find(p => p.id === pairId);
        
        if (!pair) {
          await this.sendMessage(chatId, `❌ El par ${base}/${quote} no está configurado en el sistema.`);
          return;
        }
        
        if (isNaN(amount) || amount <= 0) {
          await this.sendMessage(chatId, `❌ El monto debe ser un número mayor a cero.`);
          return;
        }
        
        const amountReceived = amount * pair.rate;
        
        this.dataService.addRemittance({
          senderFirstName: name,
          senderLastName: '',
          agentName: 'Telegram Bot',
          pairId: pairId,
          amountSent: amount,
          amountReceived: amountReceived,
          rate: pair.rate
        });
        
        await this.sendMessage(chatId, `✅ *Remesa Registrada Exitosamente*\n\nRemitente: ${name}\nEnviado: ${amount} ${base}\nRecibido: ${amountReceived.toFixed(2)} ${quote}\nTasa: ${pair.rate}`);
      } else {
        await this.sendMessage(chatId, `Para registrar una remesa usa el formato:\n\n\`/remesa [Monto] [Moneda Origen] [Moneda Destino] [Nombre del Remitente]\`\n\nEjemplo:\n\`/remesa 100 USD MXN Juan Perez\``);
      }
    } else {
      await this.sendMessage(chatId, `Comando no reconocido. Intenta con:\n/wallet\n/remesa\n/ganancias`);
    }
  }

  private async sendMessage(chatId: number, text: string) {
    try {
      await fetch(`https://api.telegram.org/bot${this.token}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'Markdown'
        })
      });
    } catch (e) {
      console.error('Error sending message:', e);
    }
  }
}
