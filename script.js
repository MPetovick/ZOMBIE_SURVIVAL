const elements = {
    messagesDiv: document.getElementById('messages'),
    passphraseInput: document.getElementById('passphrase'),
    messageInput: document.getElementById('message-input'),
    sendButton: document.getElementById('send-button'),
    qrCanvas: document.getElementById('qr-canvas'),
    qrUpload: document.getElementById('qr-upload'),
    decodeButton: document.getElementById('decode-button'),
    downloadButton: document.getElementById('download-button'),
    qrContainer: document.getElementById('qr-container')
};

// Crypto Functions
const cryptoUtils = {
    stringToArrayBuffer: str => new TextEncoder().encode(str),
    
    arrayBufferToString: buffer => new TextDecoder().decode(buffer),
    
    deriveKey: async (passphrase, salt) => {
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            cryptoUtils.stringToArrayBuffer(passphrase),
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );
        return crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
        );
    },
    
    encryptMessage: async (message, passphrase) => {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const key = await cryptoUtils.deriveKey(passphrase, salt);
        
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            cryptoUtils.stringToArrayBuffer(message)
        );
        
        const combined = new Uint8Array([
            ...salt,
            ...iv,
            ...new Uint8Array(encrypted)
        ]);
        
        return btoa(String.fromCharCode(...combined));
    },
    
    decryptMessage: async (encryptedBase64, passphrase) => {
        const encryptedData = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
        const salt = encryptedData.slice(0, 16);
        const iv = encryptedData.slice(16, 28);
        const ciphertext = encryptedData.slice(28);
        
        const key = await cryptoUtils.deriveKey(passphrase, salt);
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            ciphertext
        );
        
        return cryptoUtils.arrayBufferToString(decrypted);
    }
};

// UI Functions
const ui = {
    displayMessage: (message, isSent) => {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${isSent ? 'sent' : ''}`;
        messageElement.innerHTML = `
            <div class="message-content">${message}</div>
            <div class="message-time">${new Date().toLocaleTimeString()}</div>
        `;
        elements.messagesDiv.appendChild(messageElement);
        elements.messagesDiv.scrollTop = elements.messagesDiv.scrollHeight;
    },
    
    generateQR: async (data) => {
        elements.qrContainer.classList.remove('hidden');
        await new Promise((resolve, reject) => {
            QRCode.toCanvas(elements.qrCanvas, data, { width: 200 }, error => {
                if (error) reject(error);
                else resolve();
            });
        });
    },
    
    downloadQR: () => {
        const link = document.createElement('a');
        link.href = elements.qrCanvas.toDataURL('image/png');
        link.download = 'hushbox-qr.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },
    
    showLoader: (element) => {
        element.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        element.disabled = true;
    },
    
    resetButton: (element, originalText) => {
        element.innerHTML = originalText;
        element.disabled = false;
    }
};

// Event Handlers
const handlers = {
    sendMessage: async () => {
        const message = elements.messageInput.value.trim();
        const passphrase = elements.passphraseInput.value.trim();
        
        if (!message || !passphrase) {
            alert('Please enter both message and passphrase');
            return;
        }
        
        ui.showLoader(elements.sendButton);
        try {
            const encrypted = await cryptoUtils.encryptMessage(message, passphrase);
            ui.displayMessage(`Encrypted message: ${encrypted.slice(0, 30)}...`, true);
            await ui.generateQR(encrypted);
            elements.messageInput.value = '';
        } catch (error) {
            console.error('Encryption error:', error);
            alert('Error encrypting message');
        }
        ui.resetButton(elements.sendButton, '<i class="fas fa-paper-plane"></i> Send and Generate QR');
    },
    
    decodeQR: async () => {
        const file = elements.qrUpload.files[0];
        const passphrase = elements.passphraseInput.value.trim();
        
        if (!file || !passphrase) {
            alert('Please select a QR file and enter passphrase');
            return;
        }
        
        ui.showLoader(elements.decodeButton);
        try {
            const data = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
            
            const img = await new Promise((resolve, reject) => {
                const image = new Image();
                image.onload = () => resolve(image);
                image.onerror = reject;
                image.src = data;
            });
            
            const canvas = document.createElement('canvas');
            [canvas.width, canvas.height] = [img.width, img.height];
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            const { data: qrData } = jsQR(
                ctx.getImageData(0, 0, canvas.width, canvas.height).data,
                canvas.width,
                canvas.height
            );
            
            if (!qrData) throw new Error('No QR detected');
            
            const decrypted = await cryptoUtils.decryptMessage(qrData, passphrase);
            ui.displayMessage(decrypted, false);
        } catch (error) {
            console.error('Decryption error:', error);
            alert(error.message.includes('decrypt') ? 
                'Decryption failed - wrong passphrase?' : 
                'Invalid QR file');
        }
        ui.resetButton(elements.decodeButton, '<i class="fas fa-unlock"></i> Decrypt QR');
    }
};

// Event Listeners
elements.sendButton.addEventListener('click', handlers.sendMessage);
elements.decodeButton.addEventListener('click', handlers.decodeQR);
elements.downloadButton.addEventListener('click', ui.downloadQR);
elements.qrUpload.addEventListener('change', e => {
    document.querySelector('.file-upload i').className = 
        `fas fa-file-upload ${e.target.files.length ? 'success' : ''}`;
});

// Initialize
elements.qrContainer.classList.add('hidden');
