// Page code for KR Encoder. All cipher and Roman numeral logic lives in krencoder-core.js.
import {
  parseIntKey, caesar, vigenere, transposition,
  aesEncrypt, aesDecrypt,
  rsaGenerate, rsaExport, rsaImport, rsaEncrypt, rsaDecrypt,
  toRoman, fromRoman, dateToRoman,
} from './krencoder-core.js';
import { renderTutorial } from './tutorial.js';

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

// ---- theme: Light / Dark / System ----
// The inline script in index.html applies the saved choice before first paint; this keeps it in sync.
const THEME_KEY = 'krencoder.theme';
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
let themePref = document.documentElement.dataset.themePref || 'system';

function applyTheme() {
  const dark = themePref === 'dark' || (themePref === 'system' && darkQuery.matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.documentElement.dataset.themePref = themePref;
}

for (const radio of document.querySelectorAll('input[name="theme"]')) {
  radio.checked = radio.value === themePref;
  radio.addEventListener('change', () => {
    themePref = radio.value;
    try { localStorage.setItem(THEME_KEY, themePref); } catch { /* storage blocked: choice lasts for this visit */ }
    applyTheme();
  });
}
// System mode follows the OS live, e.g. when it switches to dark mode at sunset.
darkQuery.addEventListener('change', () => { if (themePref === 'system') applyTheme(); });

// ---- hamburger menu ----
// Add more entries here; each renders as a button in the menu.
const MENU_ITEMS = [
  { label: 'Tutorial', action: openTutorial },
];

const menu = $('menu');
const menuButton = $('menu-button');
const menuPanel = $('app-menu');

$('menu-items').replaceChildren(...MENU_ITEMS.map(({ label, action }) => {
  const item = document.createElement('button');
  item.type = 'button';
  item.textContent = label;
  item.addEventListener('click', () => { closeMenu(false); action(); });
  const li = document.createElement('li');
  li.append(item);
  return li;
}));

function openMenu() {
  menuPanel.hidden = false;
  menuButton.setAttribute('aria-expanded', 'true');
  menuPanel.querySelector('button').focus();
}
function closeMenu(returnFocus) {
  if (menuPanel.hidden) return;
  menuPanel.hidden = true;
  menuButton.setAttribute('aria-expanded', 'false');
  if (returnFocus) menuButton.focus();
}

menuButton.addEventListener('click', () => (menuPanel.hidden ? openMenu() : closeMenu(true)));
menu.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !menuPanel.hidden) { e.preventDefault(); closeMenu(true); }
});
// Clicking anywhere outside closes the menu; so does tabbing out of it.
document.addEventListener('click', (e) => { if (!menu.contains(e.target)) closeMenu(false); });
menu.addEventListener('focusout', (e) => { if (e.relatedTarget && !menu.contains(e.relatedTarget)) closeMenu(false); });

// ---- tutorial ----
const tutorial = $('tutorial');
const tutorialView = renderTutorial($('tutorial-nav'), $('tutorial-body'));

function openTutorial() {
  tutorial.showModal();
  tutorialView.show(tutorialView.current());
  tutorialView.navButton(tutorialView.current()).focus();
}
$('tutorial-close').addEventListener('click', () => tutorial.close());
// Esc closes the dialog natively; either way, focus returns to the menu button that opened it.
tutorial.addEventListener('close', () => menuButton.focus());

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
// Placeholder examples for the Input and Key fields, per mode and cipher.
const RSA_KEY_HINT = 'Not used for RSA';
const PLACEHOLDERS = {
  Text: {
    Caesar: ['Type your message, e.g. Meet at 9pm, or paste Caesar text to decode', 'Shift as a whole number, e.g. 3'],
    Vigenere: ['Type your message, e.g. Meet at 9pm, or paste Vigenere text to decode', 'Keyword, e.g. lemon'],
    Transposition: ['Type your message, e.g. Meet at 9pm, or paste Transposition text to decode', 'Number of columns, e.g. 8'],
    AES: ['Type your message, e.g. Meet at 9pm, or paste AES ciphertext to decrypt', '16, 24 or 32 characters, e.g. sixteen byte key'],
    RSA: ['Type your message (up to 214 bytes), or paste RSA ciphertext to decrypt', RSA_KEY_HINT],
  },
  Number: {
    AES: ['Whole number, e.g. 4729, or paste AES ciphertext to decrypt', 'Exactly 32 characters, e.g. 0123456789abcdef0123456789abcdef'],
    RSA: ['Whole number, e.g. 4729, or paste RSA ciphertext to decrypt', RSA_KEY_HINT],
  },
};

// Called whenever the mode or cipher changes. The RSA section only shows for RSA;
// `hidden` removes it from the layout and the tab order, and the keys stay in memory.
function updateCipherUi() {
  const cipher = $('cipher').value;
  $('rsa-section').hidden = cipher !== 'RSA';
  [$('input').placeholder, $('key').placeholder] = PLACEHOLDERS[$('mode').value][cipher];
}

function fillCiphers() {
  $('cipher').replaceChildren(...CIPHERS[$('mode').value].map((name) => new Option(name)));
  updateCipherUi();
}
$('mode').addEventListener('change', fillCiphers);
$('cipher').addEventListener('change', updateCipherUi);
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

// Asks before replacing a loaded private key, which is gone for good unless it was exported.
// Resolves true when there is nothing to lose or the user chooses "Replace keys".
function confirmReplaceKeys(newHasPrivate) {
  if (!rsaKeys?.privateKey) return Promise.resolve(true);
  let message = 'This replaces the RSA keys in use. If you haven’t exported your private key, messages sent to your current public key can never be decrypted.';
  if ($('remember').checked) {
    message += newHasPrivate
      ? ' The key saved on this device will be replaced too.'
      : ' The key saved on this device will be deleted.';
  }
  $('confirm-text').textContent = message;
  const dialog = $('confirm');
  dialog.returnValue = '';
  dialog.showModal();
  return new Promise((resolve) => {
    dialog.addEventListener('close', () => resolve(dialog.returnValue === 'replace'), { once: true });
  });
}

$('rsa-generate').addEventListener('click', async () => {
  if (!(await confirmReplaceKeys(true))) return;
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
  downloadText('krencoder-private-key.pem', privatePem + '\n', 'application/x-pem-file');
});

$('rsa-import').addEventListener('click', async () => {
  try {
    const keys = await rsaImport($('import-pem').value);
    if (!(await confirmReplaceKeys(Boolean(keys.privateKey)))) return;
    await setKeys(keys);
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

// ---- Files: open a .txt/.md file as the input, download the result ----
// The file's exact text is kept here rather than read back from the textarea, because a textarea
// turns \r\n into \n, which would change the file (and break Transposition ciphertext that contains \r).
const FILE_MAX_BYTES = 2 * 1024 * 1024;
let loadedFile = null; // { name, text }
let lastResult = null; // { text, action, fileName } of the last successful Encrypt/Decrypt

const formatSize = (bytes) => (bytes < 1024 ? `${bytes} B`
  : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(2)} MB`);

// Size of AES output: Base64 of a 16-byte IV plus the PKCS#7-padded ciphertext.
const aesOutputBytes = (inputBytes) => 4 * Math.ceil((16 + 16 * (Math.floor(inputBytes / 16) + 1)) / 3);

function downloadText(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// notes.md + encrypt -> notes_encrypted.md; notes_encrypted.md + decrypt -> notes_decrypted.md
// (the opposite suffix is dropped, so names don't pile up). Typed input (no file) -> message_encrypted.txt
function resultFileName({ action, fileName }) {
  const [, name, ext] = /^(.*?)(\.(?:txt|md))?$/i.exec(fileName ?? 'message.txt');
  const opposite = action === 'encrypt' ? /_decrypted$/i : /_encrypted$/i;
  return `${name.replace(opposite, '')}_${action}ed${ext ?? '.txt'}`;
}

$('file-open').addEventListener('click', () => $('file-input').click());
$('file-input').addEventListener('change', async () => {
  const file = $('file-input').files[0];
  $('file-input').value = ''; // so choosing the same file again still fires change
  if (!file) return;
  if (!/\.(txt|md)$/i.test(file.name)) return popup('Please choose a .txt or .md file');
  if (file.size > FILE_MAX_BYTES) return popup(`File is too large (${formatSize(file.size)}). The limit is 2 MB.`);
  let text;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer());
  } catch {
    return popup('Could not read this file as UTF-8 text. Save it as UTF-8 and try again.');
  }
  loadedFile = { name: file.name, text };
  $('input').value = text;
  $('input').readOnly = true;
  $('file-name').textContent = file.name;
  $('file-size').textContent = `(${formatSize(file.size)})`;
  $('file-status').hidden = false;
});

$('file-clear').addEventListener('click', () => {
  loadedFile = null;
  $('input').value = '';
  $('input').readOnly = false;
  $('file-status').hidden = true;
  $('input').focus();
});

$('result-download').addEventListener('click', () => {
  if (!lastResult) return;
  const name = resultFileName(lastResult);
  downloadText(name, lastResult.text, /\.md$/i.test(name) ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8');
});

// ---- Encrypt / Decrypt ----
async function run(action) {
  const mode = $('mode').value;
  // A number saved in a file usually ends with a newline; in Number mode, ignore surrounding whitespace.
  const text = loadedFile ? (mode === 'Number' ? loadedFile.text.trim() : loadedFile.text) : $('input').value;
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

  // AES output is about a third larger than its input; refuse files whose encrypted copy
  // couldn't be opened here again for decrypting.
  if (loadedFile && cipher === 'AES' && action === 'encrypt') {
    const bytes = new TextEncoder().encode(text).length;
    if (aesOutputBytes(bytes) > FILE_MAX_BYTES) {
      return popup(`File too large for AES (${formatSize(bytes)}). Encrypted, it would be over the 2 MB limit for opening files.`);
    }
  }

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
    lastResult = { text: result, action, fileName: loadedFile?.name ?? null };
    $('result-download').disabled = false;
    $('result-download').title = `Save as ${resultFileName(lastResult)}`;
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

// Placeholder examples for the Roman Input and Result fields, per direction.
// (Browsers with a date picker don't display a placeholder; it shows where the date input falls back to text.)
const ROMAN_PLACEHOLDERS = {
  toRoman: ['1 to 3999, e.g. 2026', 'e.g. MMXXVI'],
  fromRoman: ['Roman numeral, e.g. MMXXVI', 'e.g. 2026'],
  date: ['YYYY-MM-DD, e.g. 2003-09-30', 'e.g. MMIII · IX · XXX'],
};

$('roman-dir').addEventListener('change', () => {
  const dir = $('roman-dir').value;
  const input = $('roman-input');
  input.value = '';
  input.type = dir === 'date' ? 'date' : 'text';
  input.inputMode = dir === 'toRoman' ? 'numeric' : 'text';
  [input.placeholder, $('roman-result').placeholder] = ROMAN_PLACEHOLDERS[dir];
  romanConvert();
});
$('roman-input').addEventListener('input', romanConvert);
$('roman-convert').addEventListener('click', romanConvert);

// ---- Copy buttons (Encoder Result and Roman Result) ----
// If the clipboard is blocked, the text is selected so it can be copied by hand.
async function copyField(field, button, text = field.value) {
  if (!field.value) return;
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = 'Copied';
    setTimeout(() => { button.textContent = 'Copy'; }, 1500);
  } catch {
    field.select();
    popup('Could not copy. The result is selected, so copy it with Ctrl+C or a long press.');
  }
}
$('result-copy').addEventListener('click', () => copyField($('result'), $('result-copy'), lastResult?.text));
$('roman-copy').addEventListener('click', () => copyField($('roman-result'), $('roman-copy')));
