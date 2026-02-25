import os
import glob
from datetime import datetime

def scan_qq_logs():
    """
    Scans the local machine for QQ chat log export files (.txt).
    Returns a list of dictionaries with file info.
    """
    # Common location for QQ files on Windows
    user_docs = os.path.join(os.environ.get('USERPROFILE', ''), 'Documents')
    tencent_files = os.path.join(user_docs, 'Tencent Files')
    
    if not os.path.exists(tencent_files):
        # Try a different location or just fallback
        return []

    # Search for .txt files recursively in Tencent Files
    # Usually exports are in a specific subfolder or just wherever the user saved them.
    # We look for files that might be chat logs.
    found_files = []
    
    # Use a shallow search first to be fast, then deeper if needed
    # Usually users export to "Messages" or similar, but we search .txt in the whole Tencent Files area
    # to find any previously exported logs.
    search_pattern = os.path.join(tencent_files, '**', '*.txt')
    
    # Limit to top N files for performance
    count = 0
    for file_path in glob.iglob(search_pattern, recursive=True):
        if count > 50: break # Safety limit
        
        # Check if it looks like a chat log (basic heuristic: contains "消息记录" or size > 1KB)
        filename = os.path.basename(file_path)
        try:
            stats = os.stat(file_path)
            # Filter out very small files or very large files
            if 100 < stats.st_size < 50 * 1024 * 1024:
                found_files.append({
                    "name": filename,
                    "path": file_path,
                    "size": stats.st_size,
                    "mtime": datetime.fromtimestamp(stats.st_mtime).strftime('%Y-%m-%d %H:%M:%S')
                })
                count += 1
        except Exception:
            continue
            
    # Sort by modification time (newest first)
    found_files.sort(key=lambda x: x['mtime'], reverse=True)
    return found_files
