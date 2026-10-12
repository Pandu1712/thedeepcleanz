const ws = new WebSocket('ws://127.0.0.1:9222/devtools/page/2A6BFF069FC94CB07C440192536FA196');

ws.onopen = () => {
  ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
  ws.send(JSON.stringify({ id: 2, method: 'Console.enable' }));
  ws.send(JSON.stringify({ id: 3, method: 'Network.enable' }));

  setTimeout(() => {
    ws.send(JSON.stringify({
      id: 4,
      method: 'Runtime.evaluate',
      params: {
        expression: `(async () => {
          try {
            const { initializeApp, getApps } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js');
            const { getAuth, RecaptchaVerifier, signInWithPhoneNumber } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');
            const config = {
              apiKey: 'AIzaSyCcJDJH67igoAFBsaaH1pNXQ66DRXOVLQ4',
              authDomain: 'thedeepcleanerz-81056.firebaseapp.com',
              projectId: 'thedeepcleanerz-81056',
              storageBucket: 'thedeepcleanerz-81056.firebasestorage.app',
              messagingSenderId: '797437705248',
              appId: '1:797437705248:web:b0cf723da43ba7611f1045'
            };
            const app = getApps().length === 0 ? initializeApp(config) : getApps()[0];
            const auth = getAuth(app);

            let container = document.getElementById('login-recaptcha-container');
            if (!container) {
              container = document.createElement('div');
              container.id = 'login-recaptcha-container';
              document.body.appendChild(container);
            }

            const verifier = new RecaptchaVerifier(auth, 'login-recaptcha-container', {
              size: 'invisible'
            });

            console.log('[START SIGN IN TO 6303130025]');
            const res = await signInWithPhoneNumber(auth, '+916303130025', verifier);
            console.log('[SUCCESS! VerificationId]:', res.verificationId);
            window._lastConfirmationResult = res;
            return { success: true, verificationId: res.verificationId };
          } catch (e) {
            console.error('[SIGN IN ERROR]:', e.code, e.message);
            return { error: e.message, code: e.code };
          }
        })()`,
        awaitPromise: true,
        returnByValue: true
      }
    }));
  }, 1000);
};

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.method === 'Runtime.consoleAPICalled') {
    console.log('[CONSOLE]', msg.params.type, msg.params.args.map(a => a.value || a.description).join(' '));
  } else if (msg.method === 'Network.responseReceived') {
    if (msg.params.response.url.includes('identitytoolkit') || msg.params.response.url.includes('otp')) {
      console.log('[NET RESPONSE]', msg.params.response.url, msg.params.response.status);
    }
  } else if (msg.id === 4) {
    console.log('[DIRECT CALL RESULT]', JSON.stringify(msg.result, null, 2));
    process.exit(0);
  }
};

setTimeout(() => {
  console.log('Timeout');
  process.exit(0);
}, 30000);
