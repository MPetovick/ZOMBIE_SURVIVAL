const elements = {
    messagesDiv: document.getElementById('messages'),
    passphraseInput: document.getElementById('passphrase'),
    messageInput: document.getElementById('message-input'),
    sendButton: document.getElementById('send-button'),
    qrCanvas: document.getElementById('qr-canvas'),
    qrUpload: document.getElementById('qr-upload'),
    decodeButton: document.getElementById('decode-button'),
    downloadButton: document.getElementById('download-button'),
    cameraButton: document.getElementById('camera-button'),
    qrContainer: document.getElementById('qr-container')
};

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
        try {
            const compressed = pako.deflate(cryptoUtils.stringToArrayBuffer(message));
            const salt = crypto.getRandomValues(new Uint8Array(16));
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const key = await cryptoUtils.deriveKey(passphrase, salt);
            const encrypted = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv },
                key,
                compressed
            );
            const combined = new Uint8Array([...salt, ...iv, ...new Uint8Array(encrypted)]);
            return btoa(String.fromCharCode(...combined));
        } catch (error) {
            throw new Error('Encryption failed: ' + error.message);
        }
    },
    decryptMessage: async (encryptedBase64, passphrase) => {
        try {
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
            const decompressed = pako.inflate(new Uint8Array(decrypted));
            return cryptoUtils.arrayBufferToString(decompressed);
        } catch (error) {
            throw new Error('Decryption failed: ' + error.message);
        }
    }
};

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
                    // Añadir el sello "HUSHBOX" al QR
                    const ctx = elements.qrCanvas.getContext('2d');

                    // Configurar estilo común
                    ctx.fillStyle = '#00cc99'; // --primary-color
                    ctx.strokeStyle = '#000000'; // Contorno negro
                    ctx.lineWidth = 2;
                    ctx.shadowColor = 'rgba(0, 204, 153, 0.8)'; // --glow-color
                    ctx.shadowBlur = 15;
                    ctx.textAlign = 'center';

                    // Restaurar estilo para el texto
                    ctx.fillStyle = '#00cc99';
                    ctx.strokeStyle = '#000000';

                    // "HUSH" arriba
                    ctx.font = 'bold 21px "Segoe UI", system-ui, sans-serif'; // Reducido para caber en el círculo
                    const hushWidth = ctx.measureText('HUSH').width;
                    ctx.textBaseline = 'bottom';
                    ctx.strokeText('HUSH', 125, 115); // Ajustado para quedar dentro del círculo
                    ctx.fillText('HUSH', 125, 115);

                    // "BOX" debajo, igualando el ancho de "HUSH"
                    ctx.font = 'bold 37px "Segoe UI", system-ui, sans-serif'; // Tamaño base
                    const boxWidth = ctx.measureText('BOX').width;
                    const scaleFactor = hushWidth / boxWidth; // Escalar "BOX" al ancho de "HUSH"
                    const boxFontSize = Math.floor(48 * scaleFactor);
                    ctx.font = `bold ${boxFontSize}px "Segoe UI", system-ui, sans-serif`;
                    ctx.textBaseline = 'top';
                    ctx.strokeText('BOX', 125, 115); // Pegado a "HUSH"
                    ctx.fillText('BOX', 125, 115);

                    // Limpiar sombra
                    ctx.shadowBlur = 0;

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

    handleDecrypt: async (file) => {
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

    handleDownload: async () => {
        const qrDataURL = elements.qrCanvas.toDataURL('image/png', 1.0);
        const response = await fetch(qrDataURL);
        const blob = await response.blob();

        const isMiniApp = window.Telegram && window.Telegram.WebApp;

        if (isMiniApp) {
            if (navigator.clipboard && navigator.clipboard.write) {
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({
                            'image/png': blob
                        })
                    ]);
                    alert('QR image copied to clipboard! Paste it into Telegram (long press or Ctrl+V) or save it from your clipboard.');
                    return;
                } catch (error) {
                    console.error('Failed to copy to clipboard in MiniApp:', error);
                    const blobUrl = URL.createObjectURL(blob);
                    alert('Could not copy to clipboard. Opening image in browser instead. Save it manually (e.g., long press > "Save Image").');
                    window.Telegram.WebApp.openLink(blobUrl);
                    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
                    return;
                }
            } else {
                const blobUrl = URL.createObjectURL(blob);
                alert('Clipboard not available. Opening image in browser instead. Save it manually (e.g., long press > "Save Image").');
                window.Telegram.WebApp.openLink(blobUrl);
                setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
                return;
            }
        }

        const link = document.createElement('a');
        link.download = 'hushbox-qr.png';
        link.href = qrDataURL;
        link.click();
    },

    handleCameraScan: async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert('Your browser does not support camera access.');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });

            const video = document.createElement('video');
            video.style.position = 'fixed';
            video.style.top = '0';
            video.style.left = '0';
            video.style.width = '100%';
            video.style.height = '100%';
            video.style.zIndex = '1000';
            video.style.background = '#000';
            video.autoplay = true;
            document.body.appendChild(video);
            video.srcObject = stream;

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            const captureButton = document.createElement('button');
            captureButton.innerHTML = '<i class="fas fa-camera"></i> Capture';
            captureButton.className = 'btn-primary';
            captureButton.style.position = 'fixed';
            captureButton.style.bottom = '20px';
            captureButton.style.left = '50%';
            captureButton.style.transform = 'translateX(-50%)';
            captureButton.style.zIndex = '1001';
            document.body.appendChild(captureButton);

            const closeCamera = () => {
                stream.getTracks().forEach(track => track.stop());
                document.body.removeChild(video);
                document.body.removeChild(captureButton);
            };

            captureButton.addEventListener('click', () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const qrCode = jsQR(imageData.data, imageData.width, imageData.height);

                if (qrCode) {
                    const file = new File([canvas.toDataURL('image/png')], 'qr-captured.png', { type: 'image/png' });
                    handlers.handleDecrypt(file);
                    closeCamera();
                } else {
                    alert('No QR code detected. Try again.');
                }
            });
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Failed to access camera: ' + error.message);
        }
    }
};

// Event Listeners
elements.sendButton.addEventListener('click', handlers.handleEncrypt);
elements.decodeButton.addEventListener('click', () => handlers.handleDecrypt(elements.qrUpload.files[0]));
elements.downloadButton.addEventListener('click', handlers.handleDownload);
elements.cameraButton.addEventListener('click', handlers.handleCameraScan);

// Initialize
elements.qrContainer.classList.add('hidden');
