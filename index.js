const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, Browsers, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const path = require('path');
const fs = require('fs');
const app = express();
app.use(express.static('public')); app.use(express.json());

app.get('/pair', async (req,res)=>{
  let num=(req.query.number||'').replace(/[^0-9]/g,'');
  if(!num) return res.json({error:'Enter number'});
  const dir='/tmp/'+Date.now();
  try{
    const {state,saveCreds}=await useMultiFileAuthState(dir);
    const {version}=await fetchLatestBaileysVersion();
    const sock=makeWASocket({version,logger:pino({level:'silent'}),auth:state,browser:Browsers.ubuntu('Chrome')});
    sock.ev.on('creds.update',saveCreds);
    await new Promise(r=>setTimeout(r,6000));
    let code=await sock.requestPairingCode(num);
    code=code.match(/.{1,4}/g).join('-');
    console.log('PAIR CODE',num,code);
    res.json({code});
    setTimeout(()=>{try{fs.rmSync(dir,{recursive:true,force:true})}catch{}},180000);
  }catch(e){console.log(e); res.json({error:e.message})}
});

app.get('/',(req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
app.listen(process.env.PORT||3000,()=>console.log('LIVE'));
