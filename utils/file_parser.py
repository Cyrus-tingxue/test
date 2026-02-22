"""Office AI Mate — 文件解析模块

支持 PDF, DOCX, TXT, CSV, XLSX 格式的文本提取。
"""

from __future__ import annotations

import io
from typing import IO

import pandas as pd
import pdfplumber

try:
    from docx import Document
    HAS_DOCX = True
except ImportError:
    HAS_DOCX = False


def parse_pdf(file: IO[bytes]) -> str:
    """从 PDF 文件中提取纯文本。"""
    text_content = []
    try:
        with pdfplumber.open(file) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    text_content.append(text)
    except Exception as e:
        return f"[PDF Parsing Error: {str(e)}]"
        
    return "\n\n".join(text_content)


def parse_docx(file: IO[bytes]) -> str:
    """从 Word 文档中提取纯文本。"""
    if not HAS_DOCX:
        return "[Error: python-docx not installed]"
    
    try:
        doc = Document(io.BytesIO(file.read()))
        return "\n\n".join(p.text for p in doc.paragraphs if p.text.strip())
    except Exception as e:
        return f"[DOCX Parsing Error: {str(e)}]"


def parse_txt(file: IO[bytes]) -> str:
    """读取 TXT 文件内容。"""
    try:
        raw = file.read()
        # 尝试 UTF-8，失败则回退 GBK
        for encoding in ("utf-8", "gbk", "latin-1"):
            try:
                return raw.decode(encoding)
            except UnicodeDecodeError:
                continue
        return raw.decode("utf-8", errors="replace")
    except Exception as e:
        return f"[TXT Parsing Error: {str(e)}]"


def parse_csv(file: IO[bytes]) -> str:
    """读取 CSV 文件内容。"""
    try:
        df = pd.read_csv(file)
        return df.to_string(index=False)
    except Exception as e:
        return f"[CSV Parsing Error: {str(e)}]"


def parse_xlsx(file: IO[bytes]) -> str:
    """读取 Excel 文件内容。"""
    try:
        df = pd.read_excel(file)
        return df.to_string(index=False)
    except Exception as e:
        return f"[Excel Parsing Error: {str(e)}]"


# 扩展名 → 解析函数 映射
_PARSERS: dict[str, callable] = {
    ".pdf": parse_pdf,
    ".docx": parse_docx,
    ".txt": parse_txt,
    ".csv": parse_csv,
    ".xlsx": parse_xlsx,
    ".xls": parse_xlsx,
}


def parse_file(file) -> str:
    """根据文件扩展名自动选择解析器。

    Parameters
    ----------
    file : UploadedFile or IO
        具有 `filename` 或 `name` 属性的文件对象。

    Returns
    -------
    str
        提取的文本内容。
    """
    import os

    filename = getattr(file, "filename", getattr(file, "name", ""))
    _, ext = os.path.splitext(filename)
    ext = ext.lower()

    parser = _PARSERS.get(ext)
    if parser is None:
        return f"[Unsupported file format: {ext}]"

    # Reset file pointer if possible
    if hasattr(file, "seek"):
        file.seek(0)
        
    return parser(file)
