const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.static('public'));
app.use(express.json());

app.get('/pair', async (req, res) => {
    let num = req.query.number;
    if (!num) return res.json({ error: 'Enter number' });
    
    num = num.replace(/[^0-9]/g, '');
    if (!num.startsWith('256')) {
        // keep as is if not UG, but try
    }

    try {
        const dir = './auth_' + num;
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        
        const { state, saveCreds } = await useMultiFileAuthState(dir);
        const { version } = await fetchLatestBaileysVersion();
        
        const sock = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            auth: state,
            printQRInTerminal: false,
            browser: ['COOLGUY-HOST', 'Chrome', '1.0']
        });

        sock.ev.on('creds.update', saveCreds);

        // wait 3 sec then request code
        await new Promise(r => setTimeout(r, 2000));
        
        if (!sock.authState.creds.registered) {
            let code = await sock.requestPairingCode(num);
            code = code.match(/.{1,4}/g).join('-');
            console.log('PAIR CODE for', num, ':', code);
            res.json({ code: code });
            
            // auto clean after 60 sec
            setTimeout(() => {
                try { fs.rmSync(dir, { recursive: true, force: true }); } catch(e) {}
            }, 60000);
        } else {
            res.json({ error: 'Already registered' });
        }
    } catch (e) {
        console.log(e);
        res.json({ error: 'Failed: ' + e.message + ' - Try again' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('COOLGUY HOSTING LIVE ON ' + PORT));
