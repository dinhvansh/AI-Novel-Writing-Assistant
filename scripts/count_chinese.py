import os
import re
import sys

CHINESE_RE = re.compile(r"[\u4e00-\u9fff]")


def count_chinese(path: str) -> tuple[int, int]:
    total_chars = 0
    chinese_chars = 0
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as fp:
            content = fp.read()
        total_chars = len(content)
        chinese_chars = len(CHINESE_RE.findall(content))
    except Exception:
        pass
    return total_chars, chinese_chars


def walk(root: str, exts: tuple[str, ...]):
    files_total = 0
    files_with_chinese = 0
    chinese_total = 0
    samples = []
    for dirpath, dirnames, filenames in os.walk(root):
        if any(skip in dirpath for skip in ("node_modules", "dist", ".next", ".git")):
            dirnames[:] = []
            continue
        for fname in filenames:
            if not fname.endswith(exts):
                continue
            full = os.path.join(dirpath, fname)
            files_total += 1
            _, cn = count_chinese(full)
            if cn > 0:
                files_with_chinese += 1
                chinese_total += cn
                if len(samples) < 5:
                    samples.append((cn, full))
    return files_total, files_with_chinese, chinese_total, samples


if __name__ == "__main__":
    base = sys.argv[1] if len(sys.argv) > 1 else "."
    print(f"Scanning {base}")
    print()
    print("--- client/src (.tsx, .ts) ---")
    t, c, total_cn, samples = walk(os.path.join(base, "client", "src"), (".ts", ".tsx"))
    print(f"Total files: {t}")
    print(f"Files with Chinese: {c}")
    print(f"Total Chinese chars: {total_cn}")
    print("Top files:")
    samples.sort(reverse=True)
    for cn, p in sorted(samples, reverse=True)[:10]:
        print(f"  {cn:>6}  {p}")
    print()
    print("--- server/src (.ts) ---")
    t2, c2, total_cn2, samples2 = walk(os.path.join(base, "server", "src"), (".ts",))
    print(f"Total files: {t2}")
    print(f"Files with Chinese: {c2}")
    print(f"Total Chinese chars: {total_cn2}")
    print()
    print("--- prompts (md, txt, json) ---")
    t3, c3, total_cn3, _ = walk(os.path.join(base, "prompts"), (".md", ".txt", ".json"))
    print(f"Total files: {t3}")
    print(f"Files with Chinese: {c3}")
    print(f"Total Chinese chars: {total_cn3}")
    print()
    print(f"=== GRAND TOTAL Chinese chars: {total_cn + total_cn2 + total_cn3} ===")
