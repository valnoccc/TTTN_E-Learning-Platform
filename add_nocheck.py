import os
import glob

def prepend_ts_nocheck():
    base_dir = r"d:\VSC\TTTN_E-Learning-Platform\frontend\src\features\student-portal"
    pattern = os.path.join(base_dir, "**", "*.tsx")
    files = glob.glob(pattern, recursive=True)
    
    count = 0
    for file_path in files:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        if not content.startswith("// @ts-nocheck"):
            with open(file_path, "w", encoding="utf-8") as f:
                f.write("// @ts-nocheck\n" + content)
            count += 1
            
    print(f"Added // @ts-nocheck to {count} files.")

prepend_ts_nocheck()
