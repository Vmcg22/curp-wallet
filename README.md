# CURP Wallet

Generador de tarjeta de identificación personal lista para imprimir y enmicar — frente y reverso, con QR.

Sube tu PDF oficial de CURP (de gob.mx) para precargar los datos, o llena el formulario manualmente. Cada campo opcional tiene un ícono de ojo que decide si aparece o no en la tarjeta.

## Características

- Extracción de datos desde PDF del CURP (PyMuPDF + OCR Tesseract como respaldo).
- Tarjeta de dos caras renderizada en el navegador, descargable como PNG.
- Código QR con todos los datos visibles incluidos.
- Toggle por campo (ícono de ojo) para ocultar título y valor en la tarjeta.
- Sin almacenamiento: nada se guarda en el servidor, todo es por sesión.

## Cómo correrlo

Con Docker:

```bash
docker compose up --build
```

Abre <http://localhost:8000>.

Sin Docker:

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Requiere `tesseract-ocr` con el paquete de español (`tesseract-ocr-spa`) y `poppler-utils` instalados en el sistema para el respaldo OCR.

## Stack

- **Backend**: FastAPI · PyMuPDF · pytesseract
- **Frontend**: HTML/CSS/JS vanilla, `qrcode` y `html-to-image` desde CDN
