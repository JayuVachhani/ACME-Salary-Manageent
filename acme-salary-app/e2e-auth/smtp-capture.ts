import { createServer } from 'node:net';

/** Loopback-only synthetic SMTP capture; messages never leave this isolated test process. */
export async function smtpCapture(port: number) {
  const messages: string[] = [];
  const sockets = new Set<import('node:net').Socket>();
  const server = createServer(socket => {
    sockets.add(socket); socket.on('close', () => sockets.delete(socket));
    socket.setEncoding('utf8'); socket.write('220 synthetic.acme.test ESMTP\r\n');
    let pending = ''; let data = false; let message = '';
    socket.on('data', chunk => {
      pending += chunk;
      while (pending.includes('\r\n')) {
        const end = pending.indexOf('\r\n'); const line = pending.slice(0, end); pending = pending.slice(end + 2);
        if (data) {
          if (line === '.') { messages.push(message); message = ''; data = false; socket.write('250 received\r\n'); }
          else message += `${line}\n`;
        } else if (/^EHLO|^HELO/i.test(line)) socket.write('250 synthetic.acme.test\r\n');
        else if (line === 'DATA') { data = true; socket.write('354 send message\r\n'); }
        else if (line === 'QUIT') socket.end('221 bye\r\n');
        else socket.write('250 OK\r\n');
      }
    });
  });
  await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
  return { messages, close: async () => { if (!server.listening) return; for (const socket of sockets) socket.destroy(); await new Promise<void>(resolve => server.close(() => resolve())); } };
}
