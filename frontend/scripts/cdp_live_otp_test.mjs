const ws = new WebSocket('ws://127.0.0.1:9222/devtools/page/2A6BFF069FC94CB07C440192536FA196');

ws.onopen = () => {
  ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
  ws.send(JSON.stringify({ id: 2, method: 'Console.enable' }));

  // Clear storage first so we are logged out and test cleanly
  ws.send(JSON.stringify({
    id: 3,
    method: 'Runtime.evaluate',
    params: {
      expression: `(() => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = 'https://thedeepcleanerz.in/login?refresh=' + Date.now();
      })()`
    }
  }));
};

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.method === 'Runtime.consoleAPICalled') {
    console.log('[BROWSER CONSOLE]', msg.params.type, msg.params.args.map(a => a.value || a.description).join(' '));
  } else if (msg.id === 3) {
    console.log('Navigating to login... waiting 3s');
    setTimeout(() => {
      // Type 6303130025 and submit
      ws.send(JSON.stringify({
        id: 4,
        method: 'Runtime.evaluate',
        params: {
          expression: `(async () => {
            const phoneInput = document.querySelector('input[type="tel"]');
            if (!phoneInput) return 'phoneInput not found';

            const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            nativeSetter.call(phoneInput, '6303130025');
            phoneInput.dispatchEvent(new Event('input', { bubbles: true }));

            await new Promise(r => setTimeout(r, 600));

            const btn = document.querySelector('button[type="submit"]');
            console.log('[LIVE TEST] Clicking submit button:', btn ? btn.innerText : 'null');
            if (btn && !btn.disabled) {
              btn.click();
              return 'Submit clicked';
            }
            return 'Button disabled or missing';
          })()`,
          awaitPromise: true,
          returnByValue: true
        }
      }));
    }, 3500);
  } else if (msg.id === 4) {
    console.log('[EVAL RESULT 4]', msg.result);
    // Wait for OTP modal / input to appear
    setTimeout(() => {
      ws.send(JSON.stringify({
        id: 5,
        method: 'Runtime.evaluate',
        params: {
          expression: `(() => {
            const otpInput = document.querySelector('input[placeholder*="OTP"], input[placeholder*="123456"]');
            const toasts = Array.from(document.querySelectorAll('[data-sonner-toast], .sonner-toast, [role="status"]')).map(t => t.innerText);
            const body = document.body.innerText;
            return {
              hasOtpInput: !!otpInput,
              toasts,
              bodySnippet: body.slice(0, 300)
            };
          })()`,
          returnByValue: true
        }
      }));
    }, 5000);
  } else if (msg.id === 5) {
    console.log('[FINAL STATE 5]', JSON.stringify(msg.result, null, 2));
    process.exit(0);
  }
};

setTimeout(() => {
  console.log('Finished 20s wait');
  process.exit(0);
}, 22000);
