from ..models.brd import RawBRD


def parse_markdown(file_path: str) -> RawBRD:
    with open(file_path, encoding="utf-8") as f:
        text = f.read()
    return RawBRD(text=text, source=file_path, file_type="markdown")
