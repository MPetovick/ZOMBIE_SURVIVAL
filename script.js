const elements = {
    messagesDiv: document.getElementById('messages'),
    passphraseInput: document.getElementById('passphrase'),
    messageInput: document.getElementById('message-input'),
    sendButton: document.getElementById('send-button'),
    qrCanvas: document.getElementById('qr-canvas'),
    qrUpload: document.getElementById('qr-upload'),
    decodeButton: document.getElementById('decode-button'),
    downloadButton: document.getElementById('download-button'),
    qrContainer: document.getElementById('qr-container'),
    cameraButton: document.getElementById('camera-button'),
    cameraFeed: document.getElementById('camera-feed'),
    stopCameraButton: document.getElementById('stop-camera-button'),
    cameraPreview: document.getElementById('camera-preview')
};

let stream = null;

// Añadir estas dependencias en tu HTML:
// <script src="https://cdn.jsdelivr.net/npm/argon2-browser@1.18.0/dist/argon2-bundle.min.js"></script>
// <script src="https://cdn.jsdelivr.net/npm/pqcrypto.js@0.8.0/dist/kyber.js"></script>

const cryptoUtils = {
    stringToArrayBuffer: str => new TextEncoder().encode(str),

    arrayBufferToString: buffer => new TextDecoder().decode(buffer),

    deriveKey: async (passphrase, salt) => {
        try {
            const { hash } = await argon2.hash({
                pass: passphrase,
                salt: salt,
                time: 3,       // Iteraciones
                mem: 65536,    // 64MB de memoria
                hashLen: 32,   // Longitud de clave AES-256
                parallelism: 4,
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
    },

    generatePostQuantumKeyPair: async () => {
        const keyPair = await pqcrypto.keyPair();
        return {
            publicKey: keyPair.publicKey,
            privateKey: keyPair.privateKey
        };
    },

    encryptMessage: async (message, passphrase) => {
        try {
            // Generar parámetros de encapsulamiento cuántico
            const kyberKeys = await pqcrypto.keyPair();
            const encapsulated = await pqcrypto.encapsulate(kyberKeys.publicKey);

            // Combinar claves cuánticas con derivación Argon2
            const compressed = pako.deflate(cryptoUtils.stringToArrayBuffer(message));
            const salt = crypto.getRandomValues(new Uint8Array(16));
            const iv = crypto.getRandomValues(new Uint8Array(12));
            
            // Mezcla de claves híbrida (cuántica + clásica)
            const combinedSecret = new Uint8Array([
                ...new TextEncoder().encode(passphrase),
                ...encapsulated.sharedSecret
            ]);
            
            const key = await cryptoUtils.deriveKey(combinedSecret, salt);
            
            const encrypted = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv },
                key,
                compressed
            );

            // Incluir parámetros cuánticos en el payload
            const combined = new Uint8Array([
                ...salt,
                ...iv,
                ...kyberKeys.publicKey,
                ...encapsulated.ciphertext,
                ...new Uint8Array(encrypted)
            ]);

            return btoa(String.fromCharCode(...combined));
        } catch (error) {
            throw new Error('Encryption failed: ' + error.message);
        }
    },

    decryptMessage: async (encryptedBase64, passphrase) => {
        try {
            const encryptedData = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
            
            // Extraer componentes del payload
            const salt = encryptedData.slice(0, 16);
            const iv = encryptedData.slice(16, 28);
            const publicKey = encryptedData.slice(28, 28 + 1568); // Tamaño clave pública Kyber-768
            const ciphertext = encryptedData.slice(28 + 1568, 28 + 1568 + 1088); // Ciphertext Kyber
            const aesCiphertext = encryptedData.slice(28 + 1568 + 1088);

            // Desencapsular clave cuántica
            const sharedSecret = await pqcrypto.decapsulate(ciphertext, privateKey);
            
            // Combinar secretos
            const combinedSecret = new Uint8Array([
                ...new TextEncoder().encode(passphrase),
                ...sharedSecret
            ]);

            const key = await cryptoUtils.deriveKey(combinedSecret, salt);

            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                key,
                aesCiphertext
            );

            const decompressed = pako.inflate(new Uint8Array(decrypted));
            return cryptoUtils.arrayBufferToString(decompressed);
        } catch (error) {
            throw new Error('Decryption failed: ' + error.message);
        }
    }
};

// El resto del código permanece similar con ajustes menores en los handlers
const ui = {
    displayMessage: (content, isSent = false) => {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${isSent ? 'sent' : ''}`;
        messageEl.innerHTML = `
            <div class="message-content">${content}</div>
            <div class="message-time">${new Date().toLocaleTimeString()}</div>
        `;

        if (!isSent) {
            elements.messagesDiv.querySelector('.message-placeholder')?.remove();
        }

        elements.messagesDiv.appendChild(messageEl);
        elements.messagesDiv.scrollTop = elements.messagesDiv.scrollHeight;
    },

    generateQR: async (data) => {
        return new Promise((resolve, reject) => {
            QRCode.toCanvas(elements.qrCanvas, data, {
                width: 250,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                }
            }, (error) => {
                if (error) {
                    reject(error);
                } else {
                    const ctx = elements.qrCanvas.getContext('2d');
                    const circleRadius = 40;
                    const circleX = 125;
                    const circleY = 125;

                    ctx.beginPath();
                    ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2);
                    ctx.fillStyle = 'var(--primary-color)';
                    ctx.fill();

                    ctx.fillStyle = '#00cc99';
                    ctx.font = 'bold 18px "Segoe UI", system-ui, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('HUSH', circleX, circleY - 10);
                    ctx.fillText('BOX', circleX, circleY + 15);

                    elements.qrContainer.classList.remove('hidden');
                    resolve();
                }
            });
        });
    },

    showLoader: (button, text = 'Processing...') => {
        button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${text}`;
        button.disabled = true;
    },

    resetButton: (button, originalHTML) => {
        button.innerHTML = originalHTML;
        button.disabled = false;
    }
};

const cameraUtils = {
    startCamera: async () => {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            elements.cameraFeed.srcObject = stream;
            elements.cameraPreview.classList.remove('hidden');
            elements.cameraButton.disabled = true;
            cameraUtils.scanQRFromCamera();
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Unable to access camera. Please ensure you have granted permission.');
        }
    },

    stopCamera: () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            elements.cameraFeed.srcObject = null;
            elements.cameraPreview.classList.add('hidden');
            elements.cameraButton.disabled = false;
        }
    },

    scanQRFromCamera: () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        const scanFrame = () => {
            if (elements.cameraFeed.readyState === elements.cameraFeed.HAVE_ENOUGH_DATA) {
                canvas.width = elements.cameraFeed.videoWidth;
                canvas.height = elements.cameraFeed.videoHeight;
                context.drawImage(elements.cameraFeed, 0, 0, canvas.width, canvas.height);

                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                const qrCode = jsQR(imageData.data, imageData.width, imageData.height);

                if (qrCode) {
                    cameraUtils.stopCamera(); // Cerrar la cámara automáticamente
                    handlers.handleDecryptFromQR(qrCode.data);
                } else {
                    requestAnimationFrame(scanFrame);
                }
            } else {
                requestAnimationFrame(scanFrame);
            }
        };

        scanFrame();
    }
};

const handlers = {
    handleEncrypt: async () => {
        const message = elements.messageInput.value.trim();
        const passphrase = elements.passphraseInput.value.trim();

        if (!message || !passphrase) {
            alert('Please enter both a message and passphrase');
            return;
        }

        ui.showLoader(elements.sendButton, 'Encrypting...');

        try {
            const encrypted = await cryptoUtils.encryptMessage(message, passphrase);
            await ui.generateQR(encrypted);
            ui.displayMessage(`Encrypted: ${encrypted.slice(0, 40)}...`, true);
            elements.messageInput.value = '';
        } catch (error) {
            console.error('Encryption error:', error);
            alert(error.message);
        }

        ui.resetButton(elements.sendButton, `<i class="fas fa-lock"></i> Encrypt & Generate QR`);
    },

    handleDecrypt: async () => {
        const file = elements.qrUpload.files[0];
        const passphrase = elements.passphraseInput.value.trim();

        if (!file || !passphrase) {
            alert('Please select a QR file and enter passphrase');
            return;
        }

        ui.showLoader(elements.decodeButton, 'Decrypting...');

        try {
            const imageData = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = e => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0);
                        resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
                    };
                    img.onerror = reject;
                    img.src = e.target.result;
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            const qrCode = jsQR(imageData.data, imageData.width, imageData.height);

            if (!qrCode) {
                throw new Error('No QR code detected in the image');
            }

            const decrypted = await cryptoUtils.decryptMessage(qrCode.data, passphrase);
            ui.displayMessage(decrypted);
        } catch (error) {
            console.error('Decryption error:', error);
            alert(error.message.includes('decrypt') ? 
                'Decryption failed. Wrong passphrase?' : 
                error.message);
        }

        ui.resetButton(elements.decodeButton, `<i class="fas fa-unlock"></i> Decrypt Message`);
    },

    handleDecryptFromQR: async (qrData) => {
        const passphrase = elements.passphraseInput.value.trim();

        if (!passphrase) {
            alert('Please enter passphrase');
            return;
        }

        ui.showLoader(elements.decodeButton, 'Decrypting...');

        try {
            const decrypted = await cryptoUtils.decryptMessage(qrData, passphrase);
            ui.displayMessage(decrypted);
        } catch (error) {
            console.error('Decryption error:', error);
            alert(error.message.includes('decrypt') ? 
                'Decryption failed. Wrong passphrase?' : 
                error.message);
        }

        ui.resetButton(elements.decodeButton, `<i class="fas fa-unlock"></i> Decrypt Message`);
    },

    handleDownload: () => {
        const link = document.createElement('a');
        link.download = 'hushbox-qr.png';
        link.href = elements.qrCanvas.toDataURL('image/png', 1.0);
        link.click();
    }
};

elements.sendButton.addEventListener('click', handlers.handleEncrypt);
elements.decodeButton.addEventListener('click', handlers.handleDecrypt);
elements.downloadButton.addEventListener('click', handlers.handleDownload);
elements.cameraButton.addEventListener('click', cameraUtils.startCamera);
elements.stopCameraButton.addEventListener('click', cameraUtils.stopCamera);

elements.qrContainer.classList.add('hidden');
elements.cameraPreview.classList.add('hidden');
