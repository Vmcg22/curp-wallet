import re
from io import BytesIO
from typing import Optional

import pdfplumber

from app.schemas import CurpData

CURP_REGEX = re.compile(r"\b([A-Z][AEIOUX][A-Z]{2}\d{6}[HM][A-Z]{5}[A-Z0-9]\d)\b")
DATE_REGEX = re.compile(r"\b(\d{2}[/-]\d{2}[/-]\d{4})\b")

ENTIDADES = {
    "AS": "Aguascalientes", "BC": "Baja California", "BS": "Baja California Sur",
    "CC": "Campeche", "CL": "Coahuila", "CM": "Colima", "CS": "Chiapas",
    "CH": "Chihuahua", "DF": "Ciudad de México", "DG": "Durango",
    "GT": "Guanajuato", "GR": "Guerrero", "HG": "Hidalgo", "JC": "Jalisco",
    "MC": "Estado de México", "MN": "Michoacán", "MS": "Morelos",
    "NT": "Nayarit", "NL": "Nuevo León", "OC": "Oaxaca", "PL": "Puebla",
    "QT": "Querétaro", "QR": "Quintana Roo", "SP": "San Luis Potosí",
    "SL": "Sinaloa", "SR": "Sonora", "TC": "Tabasco", "TS": "Tamaulipas",
    "TL": "Tlaxcala", "VZ": "Veracruz", "YN": "Yucatán", "ZS": "Zacatecas",
    "NE": "Nacido en el Extranjero",
}


def _extract_text_native(pdf_bytes: bytes) -> str:
    with pdfplumber.open(BytesIO(pdf_bytes)) as pdf:
        return "\n".join((page.extract_text() or "") for page in pdf.pages)


def _extract_text_ocr(pdf_bytes: bytes) -> str:
    try:
        from pdf2image import convert_from_bytes
        import pytesseract
    except ImportError:
        return ""
    try:
        images = convert_from_bytes(pdf_bytes, dpi=300)
    except Exception:
        return ""
    parts = []
    for img in images:
        parts.append(pytesseract.image_to_string(img, lang="spa"))
    return "\n".join(parts)


def _decode_curp(curp: str) -> dict:
    out = {}
    if len(curp) < 18:
        return out
    yy, mm, dd = curp[4:6], curp[6:8], curp[8:10]
    year = int(yy)
    year += 2000 if curp[16].isdigit() else 1900
    out["fecha_nacimiento"] = f"{dd}/{mm}/{year:04d}"
    out["sexo"] = "Hombre" if curp[10] == "H" else "Mujer"
    out["entidad_nacimiento"] = ENTIDADES.get(curp[11:13], curp[11:13])
    return out


def _find_field(text: str, labels: list[str]) -> Optional[str]:
    for label in labels:
        pattern = re.compile(
            rf"{re.escape(label)}\s*[:\-]?\s*(.+?)(?=\n|$)",
            re.IGNORECASE,
        )
        m = pattern.search(text)
        if m:
            value = m.group(1).strip()
            value = re.split(r"\s{2,}", value)[0].strip()
            if value:
                return value
    return None


def parse_curp_pdf(pdf_bytes: bytes) -> CurpData:
    text = _extract_text_native(pdf_bytes)
    if not text.strip() or not CURP_REGEX.search(text):
        ocr_text = _extract_text_ocr(pdf_bytes)
        if ocr_text.strip():
            text = ocr_text

    data = CurpData()

    m = CURP_REGEX.search(text)
    if m:
        data.curp = m.group(1)
        decoded = _decode_curp(data.curp)
        data.fecha_nacimiento = decoded.get("fecha_nacimiento")
        data.sexo = decoded.get("sexo")
        data.entidad_nacimiento = decoded.get("entidad_nacimiento")

    nombre = _find_field(text, ["Nombre(s)", "Nombres", "Nombre"])
    if nombre:
        data.nombre = nombre
    data.primer_apellido = _find_field(text, ["Primer apellido", "Primer Apellido"])
    data.segundo_apellido = _find_field(text, ["Segundo apellido", "Segundo Apellido"])

    fecha = _find_field(text, ["Fecha de nacimiento", "Fecha de Nacimiento"])
    if fecha:
        dm = DATE_REGEX.search(fecha)
        if dm:
            data.fecha_nacimiento = dm.group(1)

    sexo = _find_field(text, ["Sexo"])
    if sexo:
        first = sexo.split()[0].upper()
        if first.startswith("H") or first.startswith("M"):
            data.sexo = "Hombre" if first.startswith("H") else "Mujer"

    entidad = _find_field(text, ["Entidad de nacimiento", "Entidad de Nacimiento"])
    if entidad:
        data.entidad_nacimiento = entidad

    nac = _find_field(text, ["Nacionalidad"])
    if nac:
        data.nacionalidad = nac

    return data
