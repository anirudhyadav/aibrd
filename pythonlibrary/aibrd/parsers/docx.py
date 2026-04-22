from ..models.brd import RawBRD


def parse_docx(file_path: str) -> RawBRD:
    from docx import Document
    doc = Document(file_path)
    text = "\n\n".join(p.text for p in doc.paragraphs if p.text.strip())
    return RawBRD(text=text, source=file_path, file_type="docx")
