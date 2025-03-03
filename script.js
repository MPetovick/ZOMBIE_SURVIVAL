const elements = {
    passphraseInput: document.getElementById('passphrase'),
    messageInput: document.getElementById('message-input'),
    sendButton: document.getElementById('send-button'),
    qrCanvas: document.getElementById('qr-canvas'),
    qrUpload: document.getElementById('qr-upload'),
    decodeButton: document.getElementById('decode-button'),
    cameraButton: document.getElementById('camera-button'),
    stopCameraButton: document.getElementById('stop-camera'),
    downloadButton: document.getElementById('download-button'),
    messagesDiv: document.getElementById('messages'),
    cameraFeed: document.getElementById('camera-feed'),
    qrContainer: document.getElementById('qr-container')
};

class CryptoHandler {
    static async encryptMessage(message, passphrase) {
        try {
            const messageBytes = new TextEncoder().encode(message);
            const salt = crypto.getRandomValues(new Uint8Array(16));
            const iv = crypto.getRandomValues(new Uint8Array(12));
            
            // Generar par de claves Kyber
            const kyberKeys = await pqcrypto.keyPair();
            const encapsulated = await pqcrypto.encapsulate(kyberKeys.publicKey);
            
            // Combinar secretos
            const combinedSecret = new TextEncoder().encode(passphrase + encapsulated.sharedSecret);
            
            // Derivar clave AES
            const aesKey = await this.deriveKey(combinedSecret, salt);
            
            // Comprimir y cifrar
            const compressed = pako.deflate(messageBytes);
            const encrypted = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv },
                aesKey,
                compressed
            );
            
            // Construir payload final
            const payload = new Uint8Array([
                ...salt,
                ...iv,
                ...kyberKeys.publicKey,
                ...encapsulated.ciphertext,
                ...new Uint8Array(encrypted)
            ]);
            
            return {
                data: btoa(String.fromCharCode(...payload)),
                privateKey: kyberKeys.privateKey
            };
        } catch (error) {
            throw new Error('Error de cifrado: ' + error.message);
        }
    }

    static async deriveKey(secret, salt) {
        const { hash } = await argon2.hash({
            pass: secret,
            salt: salt,
            time: 3,
            mem: 65536,
            hashLen: 32,
            type: argon2.ArgonType.Argon2id
        });
        return crypto.subtle.importKey('raw', hash, 'AES-GCM', false, ['encrypt', 'decrypt']);
    }
}

class QRManager {
    static async generateQR(data) {
        return new Promise((resolve, reject) => {
            const ctx = elements.qrCanvas.getContext('2d');
            ctx.clearRect(0, 0, 300, 300);
            
            QRCode.toCanvas(elements.qrCanvas, data, {
                width: 250,
                margin: 2,
                color: { dark: '#000', light: '#fff' },
                errorCorrectionLevel: 'H'
            }, (error) => {
                if (error) return reject(error);
                
                // Agregar marca de agua
                ctx.fillStyle = '#00cc99';
                ctx.beginPath();
                ctx.arc(150, 150, 40, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 18px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('HUSH', 150, 145);
                ctx.fillText('BOX', 150, 165);
                
                resolve();
            });
        });
    }
}

// Event Handlers
elements.sendButton.addEventListener('click', async () => {
    try {
        const message = elements.messageInput.value;
        const passphrase = elements.passphraseInput.value;
        
        if (!message || !passphrase) {
            throw new Error('Ingresa mensaje y contraseña');
        }
        
        elements.sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cifrando...';
        elements.sendButton.disabled = true;
        
        const { data } = await CryptoHandler.encryptMessage(message, passphrase);
        await QRManager.generateQR(data);
        
        elements.qrContainer.classList.remove('hidden');
        elements.messageInput.value = '';
    } catch (error) {
        alert(error.message);
    } finally {
        elements.sendButton.innerHTML = '<i class="fas fa-lock"></i> Cifrar y Generar QR';
        elements.sendButton.disabled = false;
    }
});

elements.downloadButton.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `hushbox-${Date.now()}.png`;
    link.href = elements.qrCanvas.toDataURL();
    link.click();
});

// Inicialización
(async () => {
    try {
        await pqcrypto.ready;
        console.log('Sistema post-cuántico listo');
    } catch (error) {
        console.error('Error inicializando Kyber:', error);
    }
})();
