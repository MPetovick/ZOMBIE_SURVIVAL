const messages = document.getElementById('messages');
const passphrase = document.getElementById('passphrase');
const message = document.getElementById('message');
const send = document.getElementById('send');
const qrCanvas = document.getElementById('qr-canvas');
const qrUpload = document.getElementById('qr-upload');
const decode = document.getElementById('decode');
const download = document.getElementById('download');

async function encrypt(message, passphrase) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(passphrase, salt);
    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        new TextEncoder().encode(message)
    );
    const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    result.set(salt, 0);
    result.set(iv, salt.length);
    result.set(new Uint8Array(encrypted), salt.length + iv.length);
    return btoa(String.fromCharCode(...result));
}

async function decrypt(encryptedBase64, passphrase) {
    const data = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
    const salt = data.slice(0, 16);
    const iv = data.slice(16, 28);
    const ciphertext = data.slice(28);
    const key = await deriveKey(passphrase, salt);
    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
    );
    return new TextDecoder().decode(decrypted);
}

async function deriveKey(passphrase, salt) {
    const keyMaterial = await crypto.subtle.importKey(
        'raw', new TextEncoder().encode(passphrase), { name: 'PBKDF2' }, false, ['deriveKey']
    );
    return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
}

function showMessage(text, isSent, encrypted = false) {
    const div = document.createElement('div');
    div.classList.add('message');
    if (isSent) div.classList.add('sent');
    div.textContent = encrypted ? `[Enc: ${text}]` : text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

async function makeQR(data) {
    await QRCode.toCanvas(qrCanvas, data, { width: 200 });
    download.disabled = false;
}

send.addEventListener('click', async () => {
    const text = message.value.trim();
    const key = passphrase.value.trim();
    if (!text || !key) return alert('Falta mensaje o clave.');
    try {
        const encrypted = await encrypt(text, key);
        showMessage(encrypted, true, true);
        await makeQR(encrypted);
        message.value = '';
    } catch (e) {
        alert('Error al encriptar.');
    }
});

decode.addEventListener('click', () => {
    const file = qrUpload.files[0];
    const key = passphrase.value.trim();
    if (!file || !key) return alert('Sube un QR y escribe la clave.');
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(data.data, data.width, data.height);
            if (code) {
                decrypt(code.data, key)
                    .then(text => showMessage(text, false))
                    .catch(() => alert('Clave incorrecta o QR inválido.'));
            } else {
                alert('No se encontró QR.');
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
});

download.addEventListener('click', () => {
    const url = qrCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hushbox_qr.png';
    a.click();
});
