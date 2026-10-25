const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const P = require('pino');
const path = require('path');
const app = express();
app.use(require('cors')());
app.use(express.static('public'));

let count = 0;
app.get('/pair', async (req, res) => {
  const number = req.query.number?.replace(/[^0-9]/g,'');
  if(!number) return res.json({error:"Enter number bro"});
  if(count >= 50) return res.json({error:"SERVER 02 Full! Buy SERVER 03 VIP - WhatsApp 0750765838"});
  try{
    const { state, saveCreds } = await useMultiFileAuthState(`./tmp/${number}`);
    const sock = makeWASocket({
      logger: P({level:'silent'}),
      auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, P({level:'silent'})) },
      browser: ['COOLGUY-BOSS','Chrome','1.0.0']
    });
    sock.ev.on('creds.update', saveCreds);
    if(!sock.authState.creds.registered){
      await new Promise(r=>setTimeout(r,3000));
      let code = await sock.requestPairingCode(number);
      code = code.match(/.{1,4}/g).join('-');
      count++;
      res.json({code, server:"SERVER 02", online:`${count}/50`});
      setTimeout(()=>count--, 60000);
    }
  }catch(e){ res.json({error:e.message}); }
});

app.listen(3000, ()=>console.log('BOSS LIVE'));
