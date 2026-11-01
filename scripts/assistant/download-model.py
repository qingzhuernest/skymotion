"""Download the exact preview model; verify every pinned artifact."""
from pathlib import Path
import hashlib
import urllib.request
ROOT = Path(__file__).resolve().parents[2] / 'site/assistant/models/bge-small-zh-v1.5'
REVISION = '75c43b069aac4d136ba6bc1122f995fedcfd2781'
FILES = {'README.md': 'cb22054df1a98f7ee9d5b281d023e67c27cc316e1733baf03fc994d95c3048ab', 'config.json': 'd4193ead3a810fd694fa8a31d7fc72fbaebc0668b603e398734bf2f6538ff42f', 'onnx/model_int8.onnx': 'b9837c19ce154ff0726d398ee77abbc03a7faf0476c6f93016c84e531be7ebb5', 'special_tokens_map.json': 'b6d346be366a7d1d48332dbc9fdf3bf8960b5d879522b7799ddba59e76237ee3', 'tokenizer.json': '48cea5d44424912a6fd1ea647bf4fe50b55ab8b1e5879c3275f80e339e8fae26', 'tokenizer_config.json': 'e6f3b96db926a37d4039995fbf5ad17de158dfb8f6343d607e4dbaad18d75f5a', 'vocab.txt': '45bbac6b341c319adc98a532532882e91a9cefc0329aa57bac9ae761c27b291c'}
for name, checksum in FILES.items():
    target = ROOT / name
    if not target.exists():
        target.parent.mkdir(parents=True, exist_ok=True)
        url = 'https://huggingface.co/Xenova/bge-small-zh-v1.5/resolve/' + REVISION + '/' + name
        with urllib.request.urlopen(url, timeout=90) as response:
            data = response.read()
        if hashlib.sha256(data).hexdigest() != checksum:
            raise ValueError('Model checksum mismatch: ' + name)
        target.write_bytes(data)
    if hashlib.sha256(target.read_bytes()).hexdigest() != checksum:
        raise ValueError('Existing model checksum mismatch: ' + name)
    print(name, target.stat().st_size)
