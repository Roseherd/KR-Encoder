# KR Encoder (web)

Encrypt and decrypt text or numbers in the browser (Caesar, Vigenere, Transposition, AES, RSA), and convert Roman numerals. Everything runs locally with the Web Crypto API; nothing is sent to a server.

## Run locally

ES modules don't load from `file://`, so serve the folder over HTTP:

```
python3 -m http.server 8000
```

Then open http://localhost:8000/.

## Files

- `index.html`, `styles.css`, `app.js`: the page.
- `krencoder-core.js`: all cipher and Roman numeral logic (pure ES module, works in browsers and Node 20+).
- `tutorial.js`: the in-app tutorial content and its renderer.
- `fonts/`: self-hosted JetBrains Mono NL (SIL Open Font License, see `fonts/OFL.txt`).
- `.nojekyll`: lets GitHub Pages serve the files as-is.
