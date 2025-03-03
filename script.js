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

class PostQuantumCrypto {
    static async deriveKey(passphrase, salt) {
        try {
            const { hash } = await argon2.hash({
                pass: passphrase,
                salt: salt,
                time: 3,
                mem: 65536,
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
            throw new Error('Key derivation failed: ' + error.message);
        }
    }

    static async generateKeyPair() {
        return pqcrypto.keyPair();
    }

    static async hybridEncrypt(message, passphrase) {
        try {
            // Generate Kyber key pair
            const { publicKey, privateKey } = await this.generateKeyPair();
            
            // Encapsulate shared secret
            const encapsulated = await pqcrypto.encapsulate(publicKey);
            
            // Prepare encryption components
            const compressed = pako.deflate(message);
            const salt = crypto.getRandomValues(new Uint8Array(16));
            const iv = crypto.getRandomValues(new Uint8Array(12));
            
            // Combine secrets
            const combinedSecret = new TextEncoder().encode(passphrase + encapsulated.sharedSecret);
            
            // Derive AES key
            const aesKey = await this.deriveKey(combinedSecret, salt);
            
            // Encrypt data
            const encrypted = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv },
                aesKey,
                compressed
            );
            
            // Build final payload
            return {
                data: new Uint8Array([...salt, ...iv, ...publicKey, ...encapsulated.ciphertext, ...new Uint8Array(encrypted)]),
                privateKey
            };
        } catch (error) {
            throw new Error('Quantum encryption failed: ' + error.message);
        }
    }

    static async hybridDecrypt(encryptedData, passphrase, privateKey) {
        try {
            // Extract components
            const salt = encryptedData.slice(0, 16);
            const iv = encryptedData.slice(16, 28);
            const publicKey = encryptedData.slice(28, 28 + 1568);
            const ciphertext = encryptedData.slice(28 + 1568, 28 + 1568 + 1088);
            const aesCiphertext = encryptedData.slice(28 + 1568 + 1088);
            
            // Decapsulate shared secret
            const sharedSecret = await pqcrypto.decapsulate(ciphertext, privateKey);
            
            // Combine secrets
            const combinedSecret = new TextEncoder().encode(passphrase + sharedSecret);
            
            // Derive AES key
            const aesKey = await this.deriveKey(combinedSecret, salt);
            
            // Decrypt data
            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                aesKey,
                aesCiphertext
            );
            
            return pako.inflate(new Uint8Array(decrypted));
        } catch (error) {
            throw new Error('Quantum decryption failed: ' + error.message);
        }
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

    static generateQR(data) {
        return new Promise((resolve, reject) => {
            QRCode.toCanvas(elements.qrCanvas, data, {
                width: 300,
                margin: 2,
                color: { dark: '#000', light: '#fff' }
            }, (error) => {
                if (error) reject(error);
                else resolve();
            });
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
            console.error('Camera error:', error);
        }
    }

    static scanFrame() {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        const processFrame = () => {
            if (elements.cameraFeed.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA) {
                canvas.width = elements.cameraFeed.videoWidth;
                canvas.height = elements.cameraFeed.videoHeight;
                context.drawImage(elements.cameraFeed, 0, 0);
                
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
                
                if (qrCode) {
                    this.handleQR(qrCode.data);
                }
            }
            requestAnimationFrame(processFrame);
        };
        processFrame();
    }

    static handleQR(data) {
        // Handle decryption process
    }
}

// Event Handlers
elements.sendButton.addEventListener('click', async () => {
    UIHandler.showLoader(elements.sendButton, 'Quantum Encrypting...');
    
    try {
        const message = new TextEncoder().encode(elements.messageInput.value);
        const encrypted = await PostQuantumCrypto.hybridEncrypt(message, elements.passphraseInput.value);
        const base64Data = btoa(String.fromCharCode(...encrypted.data));
        
        await UIHandler.generateQR(base64Data);
        elements.qrContainer.classList.remove('hidden');
        elements.messageInput.value = '';
    } catch (error) {
        console.error('Encryption error:', error);
    }
    
    UIHandler.resetButton(elements.sendButton, '<i class="fas fa-lock"></i> Quantum Encrypt & QR');
});

elements.decodeButton.addEventListener('click', async () => {
    // Implement decryption logic
});

elements.cameraButton.addEventListener('click', () => CameraHandler.startCamera());
elements.stopCameraButton.addEventListener('click', () => {
    elements.cameraFeed.srcObject.getTracks().forEach(track => track.stop());
    elements.cameraPreview.classList.add('hidden');
});

elements.downloadButton.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'quantum-safe-qr.png';
    link.href = elements.qrCanvas.toDataURL();
    link.click();
});

// Initialize crypto validation
(async () => {
    try {
        await pqcrypto.ready;
        console.log('Post-quantum crypto ready');
    } catch (error) {
        console.error('Crypto initialization failed:', error);
    }
})();
