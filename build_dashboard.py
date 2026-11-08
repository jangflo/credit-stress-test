"""Build the standalone, offline report from its source assets and extracted Excel values."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
data = json.loads((ROOT / "data/stress-data.json").read_text())
template = (ROOT / "src/dashboard.template.html").read_text()
result = template.replace("/*__CSS__*/", (ROOT / "src/dashboard.css").read_text())
result = result.replace("/*__DATA__*/", json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/"))
result = result.replace("/*__JS__*/", (ROOT / "src/dashboard.js").read_text())
(ROOT / "dashboard.html").write_text(result)
print(f"dashboard.html: {len(result.encode()):,} bytes, self-contained")
