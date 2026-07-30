import os
import re

replacements = [
    (r'\bbg-white\b(?! dark:bg-)', r'bg-white dark:bg-gray-800'),
    (r'\btext-gray-900\b(?! dark:text-)', r'text-gray-900 dark:text-gray-100'),
    (r'\btext-gray-800\b(?! dark:text-)', r'text-gray-800 dark:text-gray-100'),
    (r'\btext-gray-700\b(?! dark:text-)', r'text-gray-700 dark:text-gray-200'),
    (r'\btext-gray-600\b(?! dark:text-)', r'text-gray-600 dark:text-gray-300'),
    (r'\bbg-gray-50\b(?! dark:bg-)', r'bg-gray-50 dark:bg-gray-900/50'),
    (r'\bbg-gray-100\b(?! dark:bg-)', r'bg-gray-100 dark:bg-gray-900'),
    (r'\bborder-gray-200\b(?! dark:border-)', r'border-gray-200 dark:border-gray-700'),
    (r'\bborder-gray-300\b(?! dark:border-)', r'border-gray-300 dark:border-gray-600'),
    (r'\bhover:bg-gray-50\b(?! dark:hover:bg-)', r'hover:bg-gray-50 dark:hover:bg-gray-700'),
    (r'\bhover:bg-gray-100\b(?! dark:hover:bg-)', r'hover:bg-gray-100 dark:hover:bg-gray-700'),
]

target_dir = r"c:\Users\Sovan Ghosh\Desktop\Arkyaprabha\Projects\bret-project\frontend\src"

def process_directory(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                original_content = content
                for search, replace in replacements:
                    content = re.sub(search, replace, content)
                
                if content != original_content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f"Updated: {filepath}")

process_directory(target_dir)
print("Done.")
