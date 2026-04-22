import os


def ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def write_file(path: str, content: str) -> None:
    ensure_dir(os.path.dirname(path))
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)


def append_file(path: str, content: str) -> None:
    ensure_dir(os.path.dirname(path))
    with open(path, "a", encoding="utf-8") as f:
        f.write(content)


def init_structure(aibrd_dir: str, modular: bool) -> None:
    ensure_dir(aibrd_dir)
    ensure_dir(os.path.join(aibrd_dir, "shared"))
    ensure_dir(os.path.join(aibrd_dir, "releases"))
    if modular:
        ensure_dir(os.path.join(aibrd_dir, "modules"))


def init_module(aibrd_dir: str, slug: str) -> None:
    ensure_dir(os.path.join(aibrd_dir, "modules", slug))
    ensure_dir(os.path.join(aibrd_dir, "modules", slug, "tests"))


def write_context(aibrd_dir: str, content: str, module_slug: str | None = None) -> None:
    path = (
        os.path.join(aibrd_dir, "modules", module_slug, "CONTEXT.md")
        if module_slug
        else os.path.join(aibrd_dir, "CONTEXT.md")
    )
    write_file(path, content)


def write_tests(aibrd_dir: str, content: str, module_slug: str | None = None) -> None:
    path = (
        os.path.join(aibrd_dir, "modules", module_slug, "tests", "test-cases.md")
        if module_slug
        else os.path.join(aibrd_dir, "tests", "test-cases.md")
    )
    write_file(path, content)


def write_release(aibrd_dir: str, version: str, content: str) -> None:
    write_file(os.path.join(aibrd_dir, "releases", f"{version}.md"), content)
