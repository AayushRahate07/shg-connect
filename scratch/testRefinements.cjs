const { spawn } = require('child_process');
const http = require('http');

async function main() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-sandbox',
    '--user-data-dir=C:\\projects\\shgconnect\\scratch\\edge-profile',
    'http://localhost:3000'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  http.get('http://localhost:9222/json', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', async () => {
      try {
        const targets = JSON.parse(data);
        const page = targets.find(t => t.type === 'page');
        const ws = new WebSocket(page.webSocketDebuggerUrl);

        ws.onopen = () => {
          ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
          
          setTimeout(() => {
            ws.send(JSON.stringify({
              id: 2,
              method: 'Runtime.evaluate',
              params: {
                expression: `
                  (() => {
                    const input = document.querySelector('input');
                    const tierSpans = Array.from(document.querySelectorAll('.grid-cols-4 button span')).map(s => ({
                      text: s.textContent.trim(),
                      leading: window.getComputedStyle(s).lineHeight,
                      overflow: window.getComputedStyle(s).overflow
                    }));
                    return {
                      inputType: input ? input.type : null,
                      inputValue: input ? input.value : null,
                      inputPlaceholder: input ? input.placeholder : null,
                      tierSpans
                    };
                  })()
                `,
                returnByValue: true
              }
            }));
          }, 1500);

          setTimeout(() => {
            ws.close();
            edge.kill();
            process.exit(0);
          }, 3000);
        };

        ws.onmessage = (event) => {
          const parsed = JSON.parse(event.data);
          if (parsed.id === 2) {
            console.log('DOM Details:', JSON.stringify(parsed.result?.result?.value, null, 2));
          }
        };

      } catch (e) {
        console.error(e);
        edge.kill();
      }
    });
  });
}

main();
