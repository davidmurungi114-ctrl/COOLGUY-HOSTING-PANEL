const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.static('public'));
app.use(express.json());

app.get('/pair', async (req, res) => {
    let num = (req.query.number||'').replace(/[^0-9]/g,'');
    if(!num) return res.json({error:'Enter number'});
    const dir = './tmp_'+Date.now();
    try{
        const { state, saveCreds } = await useMultiFileAuthState(dir);
        const { version } = await fetchLatestBaileysVersion();
        const sock = makeWASocket({version, logger:pino({level:'silent'}), auth:state, browser:['Ubuntu','Chrome','20.0.04']});
        sock.ev.on('creds.update', saveCreds);
        await new Promise(r=>setTimeout(r,4000));
        let code = await sock.requestPairingCode(num);
        code = code.match(/.{1,4}/g).join('-');
        console.log('REAL CODE FOR',num,':',code);
        res.json({code:code});
    }catch(e){ console.log(e); res.json({error:e.message}); try{fs.rmSync(dir,{recursive:true,force:true})}catch{} }
});

app.get('/', (req,res)=> res.sendFile(path.join(__dirname,'public','index.html')));
const PORT = process.env.PORT||3000;
app.listen(PORT, ()=>console.log('COOLGUY REAL HOST LIVE ON '+PORT));
