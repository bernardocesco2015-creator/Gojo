const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys')
const qrcode = require('qrcode-terminal')

async function startGojo() {
    const { state, saveCreds } = await useMultiFileAuthState('gojo_auth')
    
    const gojo = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        browser: ['Gojo', 'Chrome', '1.0.0']
    })

    gojo.ev.on('creds.update', saveCreds)

    gojo.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update
        
        if(qr) {
            console.log('ESCANEIA O QR CODE DO GOJO:')
            qrcode.generate(qr, {small: true})
        }
        
        if(connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode!== DisconnectReason.loggedOut
            console.log('Conexão fechada. Reconectando:', shouldReconnect)
            if(shouldReconnect) {
                startGojo()
            }
        } else if(connection === 'open') {
            console.log('GOJO ONLINE! CALMO E INTELIGENTE 😎')
        }
    })

    gojo.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0]
        if(!msg.message || msg.key.fromMe) return
        
        const texto = msg.message.conversation || msg.message.extendedTextMessage?.text || ''
        const sender = msg.key.remoteJid

        if(texto.toLowerCase() === 'oi' || texto.toLowerCase() === 'ola') {
            await gojo.sendMessage(sender, { 
                text: 'Olá! Eu sou o Gojo 😎\nSou gentil, calmo, inteligente, confiante e pontual.\n\nMe chama com!gojo + sua pergunta' 
            })
        }

        if(texto.startsWith('!gojo')) {
            const pergunta = texto.replace('!gojo', '').trim()
            if(pergunta) {
                await gojo.sendMessage(sender, { 
                    text: `🧠 Calma aí, processando: "${pergunta}"\n\nSou o Gojo. Ainda tô aprendendo, mas já sou confiante e pontual igual tu pediu.` 
                })
            } else {
                await gojo.sendMessage(sender, { 
                    text: 'Fala comigo! Usa:!gojo sua pergunta' 
                })
            }
        }
    })
}

startGojo()
