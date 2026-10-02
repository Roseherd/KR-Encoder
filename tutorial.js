// Tutorial content (structured data) and the one function that renders it.
// Method sections have exactly four parts: what, use, encrypt, decrypt. Other sections use generic blocks:
// { h } subheading, { p } paragraph, { ul } / { ol } lists. In text, **bold** marks a control label as it
// appears in the app and `code` marks literal text.

export const TUTORIAL = [
  {
    id: 'basics',
    title: 'Encryption 101',
    blocks: [
      { p: 'Encryption scrambles a readable message so that only someone with the right key can read it. Decryption is the reverse: it turns the scrambled message back into the original.' },
      { h: 'Plaintext and ciphertext' },
      { p: '**Plaintext** is the message you can read, like `Meet at 9pm`. **Ciphertext** is the scrambled version that encryption produces. Anyone may see the ciphertext; without the key it should be useless to them.' },
      { h: 'Keys' },
      { p: 'A key is the secret setting that controls the scrambling. The same method with a different key gives completely different ciphertext, and decrypting needs the right key. Good encryption stays safe even when everyone knows the method, as long as the key stays secret.' },
      { h: 'Symmetric and asymmetric' },
      {
        ul: [
          '**Symmetric** encryption uses one shared key to both encrypt and decrypt. Both people need the same key, so they must agree on it privately first. In KR Encoder: Caesar, Vigenere, Transposition and AES.',
          '**Asymmetric** encryption uses a pair of keys: a public key that anyone may use to encrypt, and a private key that only its owner uses to decrypt. In KR Encoder: RSA.',
        ],
      },
      { h: 'Before you start' },
      {
        ul: [
          'Caesar, Vigenere and Transposition are classic ciphers. They are fun and good for learning, but a computer breaks them in seconds, so never use them for real secrets. Use AES or RSA for anything sensitive.',
          '**Mode** chooses what you encrypt. **Text** offers all five ciphers; **Number** offers AES and RSA, and only whole numbers can be encrypted in it.',
          'Everything runs in your browser. Your messages and keys are never sent to a server.',
        ],
      },
    ],
  },
  {
    id: 'caesar',
    title: 'Caesar',
    method: {
      what: 'Caesar shifts every letter a fixed number of places along the alphabet: with a shift of 3, A becomes D and z wraps round to c. In KR Encoder only the English letters A–Z and a–z move, keeping their case; digits, spaces, punctuation and accented or non-Latin letters stay as they are. The key is any whole number: a negative key shifts backwards, and 29 works the same as 3.',
      use: 'It offers no security today: there are only 25 useful shifts, so anyone can try them all in seconds. Its realistic uses are teaching, puzzles and escape rooms, and ROT13 (a shift of 13) is still used on forums to hide spoilers and puzzle answers.',
      encrypt: [
        'Open the **Encoder/Decoder** tab and set **Mode** to **Text**.',
        'In **Cipher**, choose **Caesar**.',
        'Type your message in **Input**, e.g. `Hello, World!`.',
        'Type the shift in **Key**, e.g. `3`.',
        'Press **Encrypt**. The ciphertext appears in **Result**: `Khoor, Zruog!`.',
      ],
      decrypt: [
        'Set **Mode** to **Text** and **Cipher** to **Caesar**.',
        'Paste the ciphertext into **Input**, e.g. `Khoor, Zruog!`.',
        'Type the same shift that was used to encrypt in **Key**, e.g. `3`.',
        'Press **Decrypt**. The original message appears in **Result**.',
      ],
    },
  },
  {
    id: 'vigenere',
    title: 'Vigenere',
    method: {
      what: 'Vigenere shifts each character by a different amount, taken from the letters of a keyword that repeats along the message. KR Encoder’s version works on all 95 printable keyboard characters (letters, digits, punctuation and space), so the ciphertext can contain symbols and spaces. The keyword is lowercased and each letter sets a shift (a = 0, b = 1 … z = 25); characters outside that set, such as new lines, accented letters and emoji, are copied unchanged and don’t use up a keyword letter.',
      use: 'Once called “the indecipherable cipher”, it was broken in the 19th century by spotting how the keyword repeats, so it protects nothing today. People use it for teaching, puzzles, geocaches and beginner capture-the-flag challenges.',
      encrypt: [
        'Set **Mode** to **Text** and choose **Vigenere** in **Cipher**.',
        'Type your message in **Input**, e.g. `Attack at dawn 123!`.',
        'Type a keyword in **Key**, e.g. `LEMON`. It can’t be empty.',
        'Press **Encrypt**. **Result** shows `Lx!opv$m#-oe$|-<6?/`.',
      ],
      decrypt: [
        'Set **Mode** to **Text** and choose **Vigenere** in **Cipher**.',
        'Paste the ciphertext into **Input**. Copy it exactly: spaces and symbols are part of it.',
        'Type the same keyword in **Key**. Upper or lower case doesn’t matter, because the keyword is lowercased.',
        'Press **Decrypt**. The original message appears in **Result**.',
      ],
    },
  },
  {
    id: 'transposition',
    title: 'Transposition',
    method: {
      what: 'Transposition keeps every character but changes their order. KR Encoder writes the message in rows as wide as the key (the number of columns), then reads it out column by column, so `HELLOWORLD` with key 3 becomes `HLODEORLWL`. The key must be a whole number of 1 or more; a key of 1, or one at least as long as the message, leaves it unchanged.',
      use: 'A simple transposition is easy to break, so today it is for learning and puzzles. Armies once used transposition, often combined with substitution as in the German ADFGVX cipher of World War I, and modern ciphers such as AES still shuffle positions as one ingredient of their design.',
      encrypt: [
        'Set **Mode** to **Text** and choose **Transposition** in **Cipher**.',
        'Type your message in **Input**, e.g. `HELLOWORLD`.',
        'Type the number of columns in **Key**, e.g. `3`.',
        'Press **Encrypt**. **Result** shows `HLODEORLWL`.',
      ],
      decrypt: [
        'Set **Mode** to **Text** and choose **Transposition** in **Cipher**.',
        'Paste the ciphertext into **Input**, including any spaces.',
        'Type the same number of columns in **Key**.',
        'Press **Decrypt**. **Result** shows the characters back in their original order.',
      ],
    },
  },
  {
    id: 'aes',
    title: 'AES',
    method: {
      what: 'AES (Advanced Encryption Standard) is the modern symmetric cipher the US standardised in 2001; it is used worldwide and has no known practical attack. KR Encoder uses AES in CBC mode with a fresh random starting value (the IV) for every message, so encrypting the same text twice gives different Base64 output, and both decrypt correctly. Your key is used directly as the AES key, so it must be exactly 16, 24 or 32 bytes (AES-128, AES-192 or AES-256): plain keyboard characters count 1 byte each, while accented letters and emoji count 2 to 4.',
      use: 'AES protects much of the data you use every day: HTTPS websites, Wi-Fi (WPA2 and WPA3), disk encryption such as BitLocker and FileVault, password managers and messaging apps.',
      encrypt: [
        'Choose **Text** or **Number** in **Mode**, then **AES** in **Cipher**.',
        'Type your message in **Input**. In **Number** mode it must be a whole number, e.g. `4729`.',
        'Type your key in **Key**: 16, 24 or 32 characters in **Text** mode, exactly 32 in **Number** mode. The count next to **Key** helps. The app uses the key as it is, so make it long and random rather than a word.',
        'Press **Encrypt**, then **Copy** next to **Result** to copy all of it, including any `=` at the end.',
      ],
      decrypt: [
        'Choose **AES** in **Cipher**, in the same **Mode** you encrypted in.',
        'Paste the whole Base64 ciphertext into **Input**.',
        'Type exactly the same key in **Key**.',
        'Press **Decrypt**. A wrong key or damaged ciphertext usually shows an error ending in `Decryption failed: wrong key or corrupted ciphertext`.',
      ],
    },
  },
  {
    id: 'rsa',
    title: 'RSA',
    method: {
      what: 'RSA is an asymmetric cipher: it uses a key pair, where the public key encrypts and only the matching private key decrypts. KR Encoder makes 2048-bit keys and uses RSA-OAEP padding with SHA-1, which adds randomness so the same message encrypts differently each time. A message can be at most 214 bytes, and the ciphertext is always 344 Base64 characters.',
      use: 'RSA helps secure the web and remote logins: website certificates, SSH keys and digital signatures on software and documents. Because it is slow and limited in length, real systems use it to protect or sign a small key or fingerprint, and let a symmetric cipher such as AES encrypt the data itself.',
      encrypt: [
        'Choose **RSA** in **Cipher**, in **Text** or **Number** mode. The **RSA** key section appears.',
        'Press **Generate RSA Keys**, or paste a key into **Import key (paste a PEM)** and press **Import key**. The status line below the button confirms the key.',
        'Type your message in **Input**, up to 214 bytes. **Key** isn’t used for RSA.',
        'Press **Encrypt**. **Result** shows 344 characters of ciphertext; **Copy** next to it copies them all.',
      ],
      decrypt: [
        'Choose **RSA** in **Cipher**.',
        'Make sure the private key of the same pair is loaded: the keys you generated during this visit, a key kept with **Remember on this device**, or your private key pasted into **Import key (paste a PEM)** followed by **Import key**.',
        'Paste all 344 characters of ciphertext into **Input**.',
        'Press **Decrypt**. The original message appears in **Result**.',
      ],
    },
  },
  {
    id: 'rsa-deep-dive',
    title: 'RSA deep dive',
    blocks: [
      { p: 'How to use RSA safely, including how to send a secret message to another person.' },
      { h: 'Why RSA is asymmetric' },
      { p: 'RSA uses two different keys that are created together and mathematically linked. What the public key locks, only its private key can unlock. Working out the private key from the public key would mean splitting a 617-digit number into the two huge primes it was made from, which no one can do with today’s computers.' },
      { h: 'Public key and private key' },
      {
        ul: [
          '**Public key** (starts `-----BEGIN PUBLIC KEY-----`): share it freely, by email, chat or on a website. Anyone can use it to encrypt a message that only you can read.',
          '**Private key** (starts `-----BEGIN PRIVATE KEY-----`): never share it. It is the only thing that can decrypt messages sent to your public key, so anyone who has it can read them all.',
          'In other RSA systems the private key also creates digital signatures and the public key checks them. KR Encoder only encrypts and decrypts; it doesn’t sign.',
        ],
      },
      { h: 'Generate a key pair in KR Encoder' },
      {
        ol: [
          'On the **Encoder/Decoder** tab, choose **RSA** in **Cipher**.',
          'Press **Generate RSA Keys**. The status changes to `RSA keys generated` and your public key appears in **Public Key**.',
          'Press **Export private key**. The app shows your private key and downloads it as `krencoder-private-key.pem`. Keep that file somewhere safe and private.',
          'Optional: tick **Remember on this device** to keep the private key in this browser so it survives a reload. Only do this on a device you alone use. Untick it to delete the saved key.',
        ],
      },
      { p: 'Keys otherwise live only in the open page. If you reload without exporting the private key or ticking **Remember on this device**, the pair is gone, and so is any way to read messages sent to it.' },
      { h: 'Encrypt a message with someone’s public key' },
      {
        ol: [
          'Ask the other person to generate a key pair and send you everything in their **Public Key** box, from the BEGIN line to the END line.',
          'If you have your own keys loaded, press **Export private key** first. Importing replaces the keys in use (KR Encoder asks you to confirm), and with **Remember on this device** ticked it also deletes your saved key.',
          'Paste their public key into **Import key (paste a PEM)** and press **Import key**. The status shows `Public key imported (encrypt only)`.',
          'Type your message in **Input** and press **Encrypt**.',
          'Press **Copy** next to **Result** and send them the whole ciphertext. Only their private key can decrypt it; not even you can.',
        ],
      },
      { h: 'Decrypt a message sent to you' },
      {
        ol: [
          'Choose **RSA** in **Cipher**.',
          'Load your private key. It is already there if you generated it during this visit or ticked **Remember on this device**. Otherwise open your saved `.pem` file, paste its contents into **Import key (paste a PEM)** and press **Import key**. The status shows `RSA keys generated`.',
          'Paste the 344-character ciphertext into **Input** and press **Decrypt**.',
        ],
      },
      { h: 'Common mistakes' },
      {
        ul: [
          '**Using the wrong key.** Ciphertext only opens with the private key that matches the public key used to encrypt it. Otherwise the error ends in `Decryption failed: wrong key or corrupted ciphertext`.',
          '**Decrypting with only a public key.** After importing a public key you can encrypt but not decrypt; the error ends in `Decrypting needs the private key`.',
          '**Sharing the private key.** Send only the public key. If your private key leaks, generate a new pair and give people your new public key.',
          '**Messages that are too long.** RSA here takes at most 214 bytes: 214 plain keyboard characters, fewer with accented letters (2 bytes each) or most emoji (4 bytes each). Longer input gives `Text too long for RSA (N bytes, max 214)`. For long messages, use AES.',
          '**Losing the keys.** Generating or importing another key replaces the pair in use (KR Encoder asks you to confirm first), and reloading the page drops it unless it was remembered. Export your private key first, or messages sent to the old public key can never be decrypted.',
          '**Cutting off the ciphertext.** Use **Copy** next to **Result** so you get all 344 characters; a missing character makes decryption fail.',
        ],
      },
      { h: 'Where RSA is used today' },
      {
        ul: [
          '**HTTPS/TLS:** many website certificates hold RSA keys, and the server proves who it is with an RSA signature during the handshake. TLS 1.2 and earlier could also use RSA to exchange the session key; TLS 1.3 dropped that in favour of Diffie-Hellman key exchange.',
          '**SSH:** RSA key pairs (made with `ssh-keygen -t rsa`) log you in to servers without a password, though newer Ed25519 keys are now common.',
          '**Digital signatures:** software updates, code signing, signed PDFs and email (S/MIME and PGP) use RSA signatures to prove who made something and that it wasn’t changed.',
        ],
      },
      { p: 'About this app’s settings: 2048-bit keys are the common minimum today. SHA-1 inside OAEP is still considered safe, because SHA-1’s known weakness is collisions, which OAEP’s security doesn’t depend on; newer systems usually choose SHA-256. KR Encoder uses SHA-1 to stay compatible with the original KR Encoder app.' },
    ],
  },
];

const METHOD_PARTS = [
  ['what', 'What it is'],
  ['use', 'Real-world use case'],
  ['encrypt', 'How to encrypt in KR Encoder'],
  ['decrypt', 'How to decrypt in KR Encoder'],
];

function el(tag, props = {}, ...children) {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

// Turns **bold** and `code` into <strong> and <code>; everything else stays plain text.
function inline(text) {
  return text.split(/(\*\*.+?\*\*|`.+?`)/).filter(Boolean).map((part) => {
    if (part.startsWith('**')) return el('strong', { textContent: part.slice(2, -2) });
    if (part.startsWith('`')) return el('code', { textContent: part.slice(1, -1) });
    return part;
  });
}

function list(tag, items) {
  return el(tag, {}, ...items.map((item) => el('li', {}, ...inline(item))));
}

function renderBlock(block) {
  if (block.h) return el('h4', {}, ...inline(block.h));
  if (block.p) return el('p', {}, ...inline(block.p));
  if (block.ul) return list('ul', block.ul);
  if (block.ol) return list('ol', block.ol);
  throw new Error('Unknown tutorial block');
}

function renderMethod(method) {
  return METHOD_PARTS.flatMap(([key, heading]) => [
    el('h4', { textContent: heading }),
    Array.isArray(method[key]) ? list('ol', method[key]) : el('p', {}, ...inline(method[key])),
  ]);
}

// Renders every section into `body`, one visible at a time, with a button per section in `nav`.
// Returns { show(id, { focusHeading }), current() → visible section id, navButton(id) → its nav button }.
export function renderTutorial(nav, body, sections = TUTORIAL) {
  let currentId = sections[0].id;
  const navButtons = new Map();
  const articles = new Map();

  function show(id, { focusHeading = false } = {}) {
    currentId = id;
    for (const [sid, article] of articles) article.hidden = sid !== id;
    for (const [sid, button] of navButtons) {
      if (sid === id) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    }
    body.scrollTop = 0;
    if (focusHeading) articles.get(id).querySelector('h3').focus();
  }

  sections.forEach((section, i) => {
    const button = el('button', { type: 'button', textContent: section.title });
    button.addEventListener('click', () => show(section.id, { focusHeading: true }));
    navButtons.set(section.id, button);
    nav.append(el('li', {}, button));

    const article = el('article', { id: `tutorial-${section.id}` },
      el('h3', { id: `tutorial-${section.id}-title`, tabIndex: -1, textContent: section.title }),
      ...(section.method ? renderMethod(section.method) : section.blocks.map(renderBlock)));
    article.setAttribute('aria-labelledby', `tutorial-${section.id}-title`);

    const next = sections[i + 1];
    if (next) {
      const nextButton = el('button', { type: 'button', className: 'tutorial-next', textContent: `Next: ${next.title} →` });
      nextButton.addEventListener('click', () => show(next.id, { focusHeading: true }));
      article.append(nextButton);
    }
    articles.set(section.id, article);
    body.append(article);
  });

  show(currentId);
  return { show, current: () => currentId, navButton: (id) => navButtons.get(id) };
}
