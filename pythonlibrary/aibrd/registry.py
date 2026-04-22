import json
import os
from .models.module import Registry, ModuleConfig, ModuleCounters, DetectedModule, WorkspaceMode

REGISTRY_FILE = "registry.json"


def read_registry(aibrd_dir: str) -> Registry:
    path = os.path.join(aibrd_dir, REGISTRY_FILE)
    if not os.path.exists(path):
        return Registry()
    with open(path, encoding="utf-8") as f:
        return Registry.model_validate(json.load(f))


def write_registry(aibrd_dir: str, registry: Registry) -> None:
    path = os.path.join(aibrd_dir, REGISTRY_FILE)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(registry.model_dump(), f, indent=2)


def derive_prefix(slug: str, existing: list[str]) -> str:
    words = slug.replace("-", " ").split()
    candidates = [
        words[0][:3].upper(),
        "".join(w[0] for w in words).upper(),
        words[0][:4].upper(),
    ]
    for c in candidates:
        if c not in existing:
            return c
    n = 2
    while f"{candidates[0]}{n}" in existing:
        n += 1
    return f"{candidates[0]}{n}"


def register_module(registry: Registry, module: DetectedModule) -> Registry:
    if module.slug in registry.modules:
        return registry
    existing_prefixes = [m.prefix for m in registry.modules.values()]
    prefix = derive_prefix(module.slug, existing_prefixes)
    registry.modules[module.slug] = ModuleConfig(
        display_name=module.display_name,
        prefix=prefix,
        counters=ModuleCounters(),
    )
    registry.mode = "modular"
    return registry


def next_id(registry: Registry, id_type: str, module_slug: str | None = None) -> tuple[str, Registry]:
    if module_slug:
        mod = registry.modules[module_slug]
        n = getattr(mod.counters, id_type) + 1
        setattr(mod.counters, id_type, n)
        return f"{mod.prefix}-{id_type}-{n:03d}", registry

    n = getattr(registry.shared, id_type, 0) + 1
    setattr(registry.shared, id_type, n)
    return f"{id_type}-{n:03d}", registry


def next_shared_id(registry: Registry, id_type: str) -> tuple[str, Registry]:
    n = getattr(registry.shared, id_type) + 1
    setattr(registry.shared, id_type, n)
    return f"{id_type}-{n:03d}", registry


def set_mode(registry: Registry, mode: WorkspaceMode) -> Registry:
    registry.mode = mode
    return registry
