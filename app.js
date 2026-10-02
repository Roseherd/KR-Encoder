// Page code for KR Encoder. All cipher and Roman numeral logic lives in krencoder-core.js.
import {
  parseIntKey, caesar, vigenere, transposition,
  aesEncrypt, aesDecrypt,
  rsaGenerate, rsaExport, rsaImport, rsaEncrypt, rsaDecrypt,
  toRoman, fromRoman, dateToRoman,
} from './krencoder-core.js';

const $ = (id) => document.getElementById(id);
const STORAGE_KEY = 'krencoder.rsaKey';

const CIPHERS = {
  Text: ['Caesar', 'Vigenere', 'Transposition', 'AES', 'RSA'],
  Number: ['AES', 'RSA'],
};

// ---- popup (errors and info) ----
function popup(message) {
  $('popup-text').textContent = message;
  $('popup').showModal();
}

// ---- tabs ----
for (const tab of document.querySelectorAll('[role="tab"]')) {
  tab.addEventListener('click', () => {
    for (const t of document.querySelectorAll('[role="tab"]')) {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      $(t.getAttribute('aria-controls')).hidden = !on;
    }
  });
}

// ---- mode, cipher, key counter ----
function fillCiphers() {
  $('cipher').replaceChildren(...CIPHERS[$('mode').value].map((name) => new Option(name)));
}
$('mode').addEventListener('change', fillCiphers);
fillCiphers();

function updateKeyCount() {
  $('key-count').textContent = `(${Array.from($('key').value).length} chars)`;
}
$('key').addEventListener('input', updateKeyCount);
updateKeyCount();

// ---- RSA keys ----
let rsaKeys = null;

function readStored() {
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}
function writeStored(pem) {
  try {
    if (pem) localStorage.setItem(STORAGE_KEY, pem);
    else localStorage.removeItem(STORAGE_KEY);
  } catch { /* storage unavailable: keys stay in memory only */ }
}

async function setKeys(keys) {
  rsaKeys = keys;
  const { publicPem, privatePem } = await rsaExport(keys);
  $('public-key').value = publicPem;
  $('rsa-status').textContent = privatePem ? 'RSA keys generated' : 'Public key imported (encrypt only)';
  $('rsa-export').disabled = !privatePem;
  $('export-box').hidden = true;
  $('private-key').value = '';
  if ($('remember').checked) writeStored(privatePem);
}

$('rsa-generate').addEventListener('click', async () => {
  const btn = $('rsa-generate');
  btn.disabled = true;
  try {
    await setKeys(await rsaGenerate());
  } catch (e) {
    popup(`Error: ${e.message}`);
  } finally {
    btn.disabled = false;
  }
});

$('rsa-export').addEventListener('click', async () => {
  if (!rsaKeys?.privateKey) return;
  const { privatePem } = await rsaExport(rsaKeys);
  $('private-key').value = privatePem;
  $('export-box').hidden = false;
  const url = URL.createObjectURL(new Blob([privatePem + '\n'], { type: 'application/x-pem-file' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'krencoder-private-key.pem';
  a.click();
  URL.revokeObjectURL(url);
});

$('rsa-import').addEventListener('click', async () => {
  try {
    await setKeys(await rsaImport($('import-pem').value));
    $('import-pem').value = '';
  } catch (e) {
    popup(`Error: ${e.message}`);
  }
});

$('remember').addEventListener('change', async () => {
  if (!$('remember').checked) return writeStored(null);
  writeStored(rsaKeys?.privateKey ? (await rsaExport(rsaKeys)).privatePem : null);
});

// Restore a remembered key.
const stored = readStored();
if (stored) {
  $('remember').checked = true;
  rsaImport(stored).then(setKeys).catch(() => writeStored(null));
}

// ---- Encrypt / Decrypt ----
async function run(action) {
  const text = $('input').value;
  const mode = $('mode').value;
  const cipher = $('cipher').value;
  const keyText = $('key').value;

  if (text === '') return popup('Please enter text/number');

  if (mode === 'Number') {
    // The plaintext must be a whole number; on decrypt the input is Base64 ciphertext.
    if (action === 'encrypt' && !/^-?[0-9]+$/.test(text)) return popup('Please enter a whole number');
    if (cipher === 'AES' && Array.from(keyText).length !== 32) return popup('AES key must be 32 characters long');
  }

  // Original app's error prefixes for AES/RSA (main.py): "AES text encryption error:" in Text mode,
  // "AES encryption error:" in Number mode, used for both encrypt and decrypt.
  const prefix = cipher === 'AES' || cipher === 'RSA'
    ? `${cipher}${mode === 'Text' ? ' text' : ''} encryption error: `
    : '';

  if (cipher === 'RSA' && !rsaKeys) {
    const msg = 'RSA keys not generated. Please generate RSA keys first.';
    return popup(mode === 'Number' ? msg : `Error: ${prefix}${msg}`);
  }

  try {
    let result;
    switch (cipher) {
      case 'Caesar': result = caesar(text, parseIntKey(keyText), action); break;
      case 'Vigenere': result = vigenere(text, keyText, action); break;
      case 'Transposition': result = transposition(text, parseIntKey(keyText), action); break;
      case 'AES': result = action === 'encrypt' ? await aesEncrypt(text, keyText) : await aesDecrypt(text, keyText); break;
      case 'RSA': result = action === 'encrypt' ? await rsaEncrypt(text, rsaKeys) : await rsaDecrypt(text, rsaKeys); break;
    }
    $('result').value = result;
  } catch (e) {
    popup(`Error: ${prefix}${e.message}`);
  }
}
$('encrypt').addEventListener('click', () => run('encrypt'));
$('decrypt').addEventListener('click', () => run('decrypt'));

// ---- Roman Numeral Converter ----
function romanConvert() {
  const dir = $('roman-dir').value;
  const value = $('roman-input').value;
  $('roman-error').textContent = '';
  $('roman-result').value = '';
  if (value.trim() === '') return;
  try {
    if (dir === 'toRoman') {
      const t = value.trim();
      $('roman-result').value = toRoman(/^[0-9]+$/.test(t) ? Number(t) : NaN);
    } else if (dir === 'fromRoman') {
      $('roman-result').value = String(fromRoman(value));
    } else {
      $('roman-result').value = dateToRoman(value);
    }
  } catch (e) {
    $('roman-error').textContent = e.message;
  }
}

$('roman-dir').addEventListener('change', () => {
  const dir = $('roman-dir').value;
  const input = $('roman-input');
  input.value = '';
  input.type = dir === 'date' ? 'date' : 'text';
  input.inputMode = dir === 'toRoman' ? 'numeric' : 'text';
  romanConvert();
});
$('roman-input').addEventListener('input', romanConvert);
$('roman-convert').addEventListener('click', romanConvert);

$('roman-copy').addEventListener('click', async () => {
  const value = $('roman-result').value;
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
    $('roman-copy').textContent = 'Copied';
    setTimeout(() => { $('roman-copy').textContent = 'Copy'; }, 1500);
  } catch {
    $('roman-result').select();
    popup('Could not copy. The result is selected, so copy it with Ctrl+C or a long press.');
  }
});
