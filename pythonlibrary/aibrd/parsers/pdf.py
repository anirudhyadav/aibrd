from ..models.brd import RawBRD


def parse_pdf(file_path: str) -> RawBRD:
    import fitz  # pymupdf
    doc = fitz.open(file_path)
    text = "\n\n".join(page.get_text() for page in doc)
    doc.close()
    return RawBRD(text=text, source=file_path, file_type="pdf")
