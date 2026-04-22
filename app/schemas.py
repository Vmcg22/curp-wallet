from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class CurpData(BaseModel):
    curp: Optional[str] = None
    nombre: Optional[str] = None
    primer_apellido: Optional[str] = None
    segundo_apellido: Optional[str] = None
    fecha_nacimiento: Optional[str] = None
    sexo: Optional[str] = None
    entidad_nacimiento: Optional[str] = None
    nacionalidad: Optional[str] = None


class WalletCardData(BaseModel):
    nombre_completo: str = Field(..., min_length=1, max_length=120)
    curp: Optional[str] = Field(None, max_length=18)
    rfc: Optional[str] = Field(None, max_length=13)
    fecha_nacimiento: Optional[str] = None
    sexo: Optional[str] = None
    tipo_sangre: Optional[str] = None
    correo: Optional[str] = None
    telefono: Optional[str] = None
    licencia: Optional[str] = None
    nss: Optional[str] = None
    alergias: Optional[str] = None
    padecimientos: Optional[str] = None
    contacto_emergencia_nombre: Optional[str] = None
    contacto_emergencia_telefono: Optional[str] = None
    direccion: Optional[str] = None
    notas: Optional[str] = None
