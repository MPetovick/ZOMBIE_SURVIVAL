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

// Añadir elementos necesarios para Telegram
const telegramElements = {
    shareButton: document.createElement('button'),
    hintDiv: document.createElement('div')
};

// Configurar elementos de Telegram
telegramElements.shareButton.innerHTML = '<i class="fas fa-share"></i> Compartir en Telegram';
telegramElements.shareButton.id = 'telegram-share';
telegramElements.shareButton.classList.add('hidden');

telegramElements.hintDiv.innerHTML = '<p>En Telegram: Mantén presionado el QR para guardar</p>';
telegramElements.hintDiv.id = 'telegram-hint';
telegramElements.hintDiv.classList.add('hidden');

elements.qrContainer.appendChild(telegramElements.shareButton);
elements.qrContainer.appendChild(telegramElements.hintDiv);

const cryptoUtils = {
    // ... (mantener igual la sección cryptoUtils)
};

const ui = {
    // ... (mantener igual displayMessage y generateQR)

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
    // ... (mantener igual handleEncrypt y handleDecrypt)

    handleDownload: async () => {
        if (window.Telegram?.WebApp) {
            try {
                // Convertir canvas a Blob
                const blob = await new Promise(resolve => {
                    elements.qrCanvas.toBlob(resolve, 'image/png');
                });
                
                const file = new File([blob], 'hushbox-qr.png', {
                    type: 'image/png',
                    lastModified: Date.now()
                });

                // Intentar guardar usando la API de Telegram
                await Telegram.WebApp.showSaveFileDialog(file);
            } catch (error) {
                // Mostrar instrucciones alternativas
                telegramElements.hintDiv.classList.remove('hidden');
                setTimeout(() => {
                    telegramElements.hintDiv.classList.add('hidden');
                }, 5000);
            }
        } else {
            // Descarga normal para navegadores
            const link = document.createElement('a');
            link.download = 'hushbox-qr.png';
            link.href = elements.qrCanvas.toDataURL('image/png', 1.0);
            link.click();
        }
    },

    handleShare: () => {
        elements.qrCanvas.toBlob(blob => {
            const file = new File([blob], 'secret.png', {type: 'image/png'});
            Telegram.WebApp.shareFile([file]);
        });
    }
};

// Modificar event listeners
elements.downloadButton.addEventListener('click', handlers.handleDownload);
telegramElements.shareButton.addEventListener('click', handlers.handleShare);

// Detección de entorno Telegram
if (window.Telegram?.WebApp) {
    // Ajustar UI para Telegram
    elements.downloadButton.classList.add('hidden');
    telegramElements.shareButton.classList.remove('hidden');
    telegramElements.hintDiv.classList.remove('hidden');
    
    // Optimizar para pantallas móviles
    elements.qrCanvas.style.maxWidth = '70vw';
    elements.qrCanvas.style.height = 'auto';
    
    // Inicializar WebApp de Telegram
    Telegram.WebApp.ready();
    Telegram.WebApp.expand();
}

elements.sendButton.addEventListener('click', handlers.handleEncrypt);
elements.decodeButton.addEventListener('click', handlers.handleDecrypt);

elements.qrContainer.classList.add('hidden');
