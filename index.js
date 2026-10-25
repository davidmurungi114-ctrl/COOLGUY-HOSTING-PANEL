const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, delay } = require('@whiskeysockets/baileys');
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
    const dir = './auth_' + Date.now();
    try {
        const { state, saveCreds } = await useMultiFileAuthState(dir);
        const { version } = await fetchLatestBaileysVersion();
        const sock = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            auth: state,
            printQRInTerminal: false,
            browser: ['COOLGUY','Chrome','1.0.0']
        });
        sock.ev.on('creds.update', saveCreds);
        await delay(3000);
        let code = await sock.requestPairingCode(num);
        code = code?.match(/.{1,4}/g)?.join('-') || code;
        console.log('REAL PAIR CODE', num, code);
        res.json({ code: code });
        setTimeout(async () => {
           try { await sock.logout(); } catch {}
           try { fs.rmSync(dir, {recursive:true, force:true}); } catch {}
        }, 120000);
    } catch (e) {
        console.log('PAIR FAIL', e);
        res.json({ error: 'Failed: '+e.message });
        try { fs.rmSync(dir, {recursive:true, force:true}); } catch {}
    }
});

app.get('/', (req,res)=> res.sendFile(path.join(__dirname,'public','index.html')));
app.listen(process.env.PORT||3000, ()=>console.log('COOLGUY REAL HOST LIVE'));
