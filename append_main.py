import os

source_path = r"c:\Users\57745\Desktop\web\static\js\main.js"
dest_path = r"c:\Users\57745\Desktop\web\static\js\main_new.js"

try:
    # Read original file
    with open(source_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # Get lines from 491 onwards (0-indexed: index 490 is line 491)
    # Line 490 in 1-based is '}'. We want to start after that.
    # Wait, text editor line 491 is index 490.
    # Let's use string matching to be safe.
    
    start_index = -1
    for i, line in enumerate(lines):
        if "function switchConvertTab(btn, tabId)" in line:
            # Find the closing brace for this function
            # This is risky if logic changed, but switchConvertTab is simple.
            # Let's just trust the line number from previous view_file (479 to 490)
            # So line 491 starts the next section.
            pass
            
    # Based on view_file 583:
    # 490: }
    # 491: 
    # 492: async function doPdfToExcel() {
    
    # Python list slicing:
    # lines[490] is the 491st line.
    remaining_lines = lines[490:] 

    # Read destination file
    with open(dest_path, 'r', encoding='utf-8') as f:
        dest_lines = f.readlines()

    # Remove garbage lines from dest (lines 472+)
    # In view_file 634:
    # 470: }
    # 471: 
    # 472: // ... Rest of the file content
    
    # We want to keep lines 0 to 470 (inclusive of index 470 which is line 471)
    # dest_lines[471] is line 472.
    clean_dest_lines = dest_lines[:471]

    # Append
    final_lines = clean_dest_lines + remaining_lines

    # Write back to dest
    with open(dest_path, 'w', encoding='utf-8') as f:
        f.writelines(final_lines)

    print(f"Successfully constructed main_new.js with {len(final_lines)} lines.")

except Exception as e:
    print(f"Error: {e}")
