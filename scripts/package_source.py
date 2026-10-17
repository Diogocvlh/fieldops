"""Empacota somente os fontes e exemplos públicos do FieldOps, sem builds ou segredos."""

from pathlib import Path
import hashlib
import os
import zipfile


def main():
    root = Path(__file__).resolve().parent.parent
    destination = root.parent / "fieldops-portfolio.zip"
    excluded = {"node_modules", "target", "dist", ".git", ".idea", ".sites-runtime", ".openai", "__pycache__", ".pnpm-store", "coverage", ".local-tools"}
    with zipfile.ZipFile(destination, "w", zipfile.ZIP_DEFLATED) as archive:
        for directory, directories, files in os.walk(root, followlinks=False):
            directories[:] = sorted(name for name in directories if name not in excluded and not (Path(directory) / name).is_symlink())
            for name in sorted(files):
                path = Path(directory) / name
                if path.is_symlink() or name in {".npmrc", ".DS_Store"} or name.endswith((".log", ".tsbuildinfo")):
                    continue
                if name.startswith(".env") and name != ".env.example":
                    continue
                archive.write(path, Path(root.name) / path.relative_to(root))
    digest = hashlib.sha256(destination.read_bytes()).hexdigest()
    print(f"Fontes: {destination}\nSHA-256: {digest}")


if __name__ == "__main__":
    main()
