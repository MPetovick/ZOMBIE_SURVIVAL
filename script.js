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

class QuantumSafeCrypto {
    static async deriveKey(passphrase, salt) {
        try {
            // Hash SHA3-512 de la contraseña
            const hashedPass = sha3_512(passphrase);
            
            // Derive key con Argon2id
            const { hash } = await argon2.hash({
                pass: hashedPass,
                salt: salt,
                time: 4,
                mem: 65536,  // 64MB
                hashLen: 32,
                type: argon2.ArgonType.Argon2id
            });
            
            return crypto.subtle.importKey(
                'raw',
                hash,
                { name: 'AES-GCM' },
                false,
                ['encrypt', 'decrypt']
            );
        } catch (error) {
            throw new Error('Error derivando clave: ' + error.message);
        }
    }

    static async encrypt(message) {
        try {
            const salt = crypto.getRandomValues(new Uint8Array(16));
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const passphrase = elements.passphraseInput.value;
            
            if (!passphrase) throw new Error('Se requiere una contraseña');
            
            const key = await this.deriveKey(passphrase, salt);
            const compressed = pako.deflate(new TextEncoder().encode(message));
            
            const encrypted = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv },
                key,
                compressed
            );
            
            const combined = new Uint8Array([
                ...salt,
                ...iv,
                ...new Uint8Array(encrypted)
            ]);
            
            return btoa(String.fromCharCode(...combined));
        } catch (error) {
            throw new Error('Error en cifrado: ' + error.message);
        }
    }

    static async decrypt(encryptedBase64) {
        try {
            const passphrase = elements.passphraseInput.value;
            const encryptedData = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
            
            const salt = encryptedData.slice(0, 16);
            const iv = encryptedData.slice(16, 28);
            const ciphertext = encryptedData.slice(28);
            
            const key = await this.deriveKey(passphrase, salt);
            
            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                key,
                ciphertext
            );
            
            return pako.inflate(new Uint8Array(decrypted), { to: 'string' });
        } catch (error) {
            throw new Error('Error en descifrado: ' + error.message);
        }
    }
}

class QRManager {
    static generateQR(data) {
        return new Promise((resolve, reject) => {
            const ctx = elements.qrCanvas.getContext('2d');
            ctx.clearRect(0, 0, 300, 300);
            
            QRCode.toCanvas(elements.qrCanvas, data, {
                width: 300,
                margin: 2,
                color: { dark: '#000000', light: '#ffffff' },
                errorCorrectionLevel: 'H'
            }, (error) => {
                if (error) return reject(error);
                
                // Agregar marca de agua
                ctx.fillStyle = '#00cc99';
                ctx.beginPath();
                ctx.arc(150, 150, 40, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 18px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('HUSH', 150, 145);
                ctx.fillText('BOX', 150, 165);
                
                resolve();
            });
        });
    }

    static async decodeQR(imageData) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
                
                qrCode ? resolve(qrCode.data) : reject('No se detectó QR');
            };
            img.onerror = reject;
            img.src = imageData;
        });
    }
}

class UIHandler {
    static showLoader(button, text) {
        button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${text}`;
        button.disabled = true;
    }

    static resetButton(button, originalHTML) {
        button.innerHTML = originalHTML;
        button.disabled = false;
    }

    static displayMessage(content, isSent = false) {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${isSent ? 'sent' : ''}`;
        messageEl.innerHTML = `
            <div class="message-content">${content}</div>
            <div class="message-time">${new Date().toLocaleTimeString()}</div>
        `;
        elements.messagesDiv.appendChild(messageEl);
        elements.messagesDiv.scrollTop = elements.messagesDiv.scrollHeight;
    }

    static handleFileUpload(event) {
        return new Promise((resolve, reject) => {
            const file = event.target.files[0];
            if (!file) return reject('No se seleccionó archivo');
            
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
}

class CameraHandler {
    static async startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: "environment" } 
            });
            elements.cameraFeed.srcObject = stream;
            elements.cameraPreview.classList.remove('hidden');
            this.scanFrame();
        } catch (error) {
            throw new Error('Error al acceder a la cámara: ' + error.message);
        }
    }

    static scanFrame() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const processFrame = () => {
            if (elements.cameraFeed.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA) {
                canvas.width = elements.cameraFeed.videoWidth;
                canvas.height = elements.cameraFeed.videoHeight;
                ctx.drawImage(elements.cameraFeed, 0, 0);
                
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
                
                if (qrCode) {
                    this.handleQR(qrCode.data);
                }
            }
            requestAnimationFrame(processFrame);
        };
        processFrame();
    }

    static async handleQR(data) {
        try {
            const decrypted = await QuantumSafeCrypto.decrypt(data);
            UIHandler.displayMessage(decrypted);
            elements.cameraFeed.srcObject.getTracks().forEach(track => track.stop());
            elements.cameraPreview.classList.add('hidden');
        } catch (error) {
            console.error('Error procesando QR:', error);
        }
    }
}

// Event Listeners
elements.sendButton.addEventListener('click', async () => {
    try {
        const message = elements.messageInput.value;
        if (!message) throw new Error('Ingresa un mensaje');
        
        UIHandler.showLoader(elements.sendButton, 'Cifrando...');
        const encrypted = await QuantumSafeCrypto.encrypt(message);
        await QRManager.generateQR(encrypted);
        elements.qrContainer.classList.remove('hidden');
        elements.messageInput.value = '';
        
    } catch (error) {
        alert(error.message);
    } finally {
        UIHandler.resetButton(elements.sendButton, '<i class="fas fa-lock"></i> Cifrar y Generar QR');
    }
});

elements.decodeButton.addEventListener('click', async () => {
    try {
        UIHandler.showLoader(elements.decodeButton, 'Descifrando...');
        const imageData = await UIHandler.handleFileUpload(elements.qrUpload);
        const encryptedData = await QRManager.decodeQR(imageData);
        const decrypted = await QuantumSafeCrypto.decrypt(encryptedData);
        UIHandler.displayMessage(decrypted);
        
    } catch (error) {
        alert(error.message);
    } finally {
        UIHandler.resetButton(elements.decodeButton, '<i class="fas fa-unlock"></i> Descifrar');
    }
});

elements.cameraButton.addEventListener('click', () => CameraHandler.startCamera());
elements.stopCameraButton.addEventListener('click', () => {
    elements.cameraFeed.srcObject?.getTracks().forEach(track => track.stop());
    elements.cameraPreview.classList.add('hidden');
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
        await argon2.hash({ pass: 'init' }); // Warmup Argon2
        console.log('Sistema de cifrado listo');
    } catch (error) {
        console.error('Error inicializando:', error);
    }
})();
