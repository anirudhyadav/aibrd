from .pdf import parse_pdf
from .docx import parse_docx
from .markdown import parse_markdown
from ..models.brd import RawBRD

__all__ = ["parse_pdf", "parse_docx", "parse_markdown", "parse_file"]


def parse_file(file_path: str) -> RawBRD:
    ext = file_path.rsplit(".", 1)[-1].lower()
    if ext == "pdf":
        return parse_pdf(file_path)
    elif ext in ("docx", "doc"):
        return parse_docx(file_path)
    elif ext == "md":
        return parse_markdown(file_path)
    raise ValueError(f"Unsupported file type: .{ext}. Supported: pdf, docx, doc, md")
