const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');
const path = require('path');
const fs = require('fs');
const app = express();
app.use(express.static('public'));
app.use(express.json());

app.get('/pair', async (req, res) => {
    let num = (req.query.number||'').replace(/[^0-9]/g,'');
    if(!num) return res.json({error:'Enter number'});
    const dir = '/tmp/auth_'+Date.now();
    try{
        if(!fs.existsSync('/tmp')) fs.mkdirSync('/tmp');
        const { state, saveCreds } = await useMultiFileAuthState(dir);
        const { version } = await fetchLatestBaileysVersion();
        const sock = makeWASocket({
            version,
            logger: pino({level:'silent'}),
            auth: state,
            browser: Browsers.ubuntu('Chrome'),
            syncFullHistory: false
        });
        sock.ev.on('creds.update', saveCreds);
        // Keep connection alive
        sock.ev.on('connection.update', async (u)=>{
            if(u.connection==='open') console.log('LINKED SUCCESS',num);
        });
        await new Promise(r=>setTimeout(r,5000));
        let code = await sock.requestPairingCode(num);
        code = code.match(/.{1,4}/g).join('-');
        console.log('CODE',num,code);
        res.json({code:code});
        // DON'T delete or logout for 3 minutes - let WhatsApp link!
        setTimeout(()=>{ try{fs.rmSync(dir,{recursive:true,force:true})}catch{} }, 180000);
    }catch(e){
        console.log('FAIL',e);
        res.json({error:e.message});
        try{fs.rmSync(dir,{recursive:true,force:true})}catch{}
    }
});
app.get('/', (req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
app.listen(process.env.PORT||3000, ()=>console.log('COOLGUY LIVE'));
