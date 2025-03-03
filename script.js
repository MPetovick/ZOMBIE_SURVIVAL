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
    qrContainer: document.getElementById('qr-container'),
    cameraPreview: document.getElementById('camera-preview')
};

class PostQuantumCrypto {
    static async deriveKey(passphrase, salt) {
        try {
            const { hash } = await argon2.hash({
                pass: passphrase,
                salt,
                time: 3,
                mem: 64 * 1024,
                hashLen: 32,
                parallelism: 2,
                type: argon2.ArgonType.Argon2id
            });
            
            return await crypto.subtle.importKey(
                'raw',
                hash,
                { name: 'AES-GCM' },
                false,
                ['encrypt', 'decrypt']
            );
        } catch (error) {
            throw new Error(`Key derivation failed: ${error.message}`);
        }
    }

    static async generateKeyPair() {
        return await pqcrypto.keyPair();
    }

    static async hybridEncrypt(message, passphrase) {
        try {
            const { publicKey, privateKey } = await this.generateKeyPair();
            const { ciphertext, sharedSecret } = await pqcrypto.encapsulate(publicKey);
            const compressed = pako.deflate(message);
            const salt = crypto.getRandomValues(new Uint8Array(16));
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const combinedSecret = new TextEncoder().encode(`${passphrase}${sharedSecret}`);
            const aesKey = await this.deriveKey(combinedSecret, salt);
            
            const encrypted = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv },
                aesKey,
                compressed
            );
            
            return {
                data: Uint8Array.from([...salt, ...iv, ...publicKey, ...ciphertext, ...new Uint8Array(encrypted)]),
                privateKey
            };
        } catch (error) {
            throw new Error(`Quantum encryption failed: ${error.message}`);
        }
    }

    static async hybridDecrypt(encryptedData, passphrase, privateKey) {
        try {
            const salt = encryptedData.slice(0, 16);
            const iv = encryptedData.slice(16, 28);
            const publicKey = encryptedData.slice(28, 1596);
            const ciphertext = encryptedData.slice(1596, 2684);
            const aesCiphertext = encryptedData.slice(2684);
            
            const sharedSecret = await pqcrypto.decapsulate(ciphertext, privateKey);
            const combinedSecret = new TextEncoder().encode(`${passphrase}${sharedSecret}`);
            const aesKey = await this.deriveKey(combinedSecret, salt);
            
            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                aesKey,
                aesCiphertext
            );
            
            return pako.inflate(new Uint8Array(decrypted), { to: 'string' });
        } catch (error) {
            throw new Error(`Quantum decryption failed: ${error.message}`);
        }
    }
}

class UIHandler {
    static showLoader(button, text) {
        button.disabled = true;
        button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${text}`;
    }

    static resetButton(button, originalHTML) {
        button.innerHTML = originalHTML;
        button.disabled = false;
    }

    static displayMessage(content, isError = false) {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${isError ? 'error' : ''}`;
        messageEl.innerHTML = `
            <div class="message-content">${content}</div>
            <div class="message-time">${new Date().toLocaleTimeString()}</div>
        `;
        elements.messagesDiv.innerHTML = '';
        elements.messagesDiv.appendChild(messageEl);
        elements.messagesDiv.scrollTop = elements.messagesDiv.scrollHeight;
    }

    static async generateQR(data) {
        try {
            await QRCode.toCanvas(elements.qrCanvas, data, {
                width: 300,
                margin: 2,
                color: { dark: '#000000', light: '#ffffff' }
            });
        } catch (error) {
            throw new Error(`QR generation failed: ${error.message}`);
        }
    }
}

class CameraHandler {
    static stream = null;

    static async startCamera() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment', width: 640, height: 480 }
            });
            elements.cameraFeed.srcObject = this.stream;
            elements.cameraPreview.classList.remove('hidden');
            this.scanFrame();
        } catch (error) {
            UIHandler.displayMessage(`Camera error: ${error.message}`, true);
        }
    }

    static scanFrame() {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        let animationId;

        const processFrame = () => {
            if (!elements.cameraFeed.srcObject) return;
            
            if (elements.cameraFeed.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA) {
                canvas.width = elements.cameraFeed.videoWidth;
                canvas.height = elements.cameraFeed.videoHeight;
                context.drawImage(elements.cameraFeed, 0, 0);
                
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
                
                if (qrCode) {
                    this.handleQR(qrCode.data);
                    return;
                }
            }
            animationId = requestAnimationFrame(processFrame);
        };

        processFrame();
        return () => cancelAnimationFrame(animationId);
    }

    static async handleQR(data) {
        try {
            const encryptedData = Uint8Array.from(atob(data), c => c.charCodeAt(0));
            const decrypted = await PostQuantumCrypto.hybridDecrypt(
                encryptedData,
                elements.passphraseInput.value,
                null // Note: Private key handling needs to be implemented
            );
            UIHandler.displayMessage(decrypted);
            this.stopCamera();
        } catch (error) {
            UIHandler.displayMessage(`Decryption failed: ${error.message}`, true);
        }
    }

    static stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
            elements.cameraPreview.classList.add('hidden');
        }
    }
}

// Event Handlers with Debouncing
const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

elements.sendButton.addEventListener('click', async () => {
    if (!elements.messageInput.value || !elements.passphraseInput.value) {
        UIHandler.displayMessage('Please enter both passphrase and message', true);
        return;
    }

    const originalHTML = elements.sendButton.innerHTML;
    UIHandler.showLoader(elements.sendButton, 'Quantum Encrypting...');
    
    try {
        const message = new TextEncoder().encode(elements.messageInput.value);
        const { data } = await PostQuantumCrypto.hybridEncrypt(message, elements.passphraseInput.value);
        const base64Data = btoa(String.fromCharCode(...data));
        
        await UIHandler.generateQR(base64Data);
        elements.qrContainer.classList.remove('hidden');
        elements.messageInput.value = '';
    } catch (error) {
        UIHandler.displayMessage(`Encryption error: ${error.message}`, true);
    } finally {
        UIHandler.resetButton(elements.sendButton, originalHTML);
    }
});

elements.decodeButton.addEventListener('click', debounce(async () => {
    const file = elements.qrUpload.files[0];
    if (!file) {
        UIHandler.displayMessage('Please upload a QR code image', true);
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        const img = new Image();
        img.onload = async () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
            
            if (qrCode) {
                await CameraHandler.handleQR(qrCode.data);
            } else {
                UIHandler.displayMessage('No valid QR code found', true);
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}, 300));

elements.cameraButton.addEventListener('click', () => CameraHandler.startCamera());
elements.stopCameraButton.addEventListener('click', () => CameraHandler.stopCamera());

elements.downloadButton.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `quantum-safe-qr-${Date.now()}.png`;
    link.href = elements.qrCanvas.toDataURL('image/png', 1.0);
    link.click();
});

// Initialize
(async () => {
    try {
        await pqcrypto.ready;
        console.log('Post-quantum crypto initialized');
    } catch (error) {
        UIHandler.displayMessage(`Crypto initialization failed: ${error.message}`, true);
    }
})();
