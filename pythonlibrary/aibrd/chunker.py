import os
from .models.brd import RawBRD, BRDChunk

MAX_TOKENS = int(os.getenv("AIBRD_CHUNK_TOKENS", "6000"))
CHARS_PER_TOKEN = 4


def chunk_brd(brd: RawBRD, max_tokens: int = MAX_TOKENS) -> list[BRDChunk]:
    max_chars = max_tokens * CHARS_PER_TOKEN

    if len(brd.text) <= max_chars:
        return [BRDChunk(text=brd.text, index=0, total=1)]

    paragraphs = brd.text.split("\n\n")
    chunks: list[str] = []
    current = ""
    overlap = ""

    for para in paragraphs:
        candidate = f"{current}\n\n{para}" if current else para
        if len(candidate) > max_chars and current:
            chunks.append(overlap + current)
            overlap = current.split("\n\n")[-1] + "\n\n"
            current = para
        else:
            current = candidate

    if current:
        chunks.append(overlap + current)

    return [
        BRDChunk(text=text, index=i, total=len(chunks))
        for i, text in enumerate(chunks)
    ]
