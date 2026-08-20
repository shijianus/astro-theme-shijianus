import re
import sys

def remove_blocks(css_file):
    with open(css_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We want to remove CSS rules that start with `:is(#recent-posts, .taxonomy-post-list) > .recent-post-item`
    # Also `#recent-posts > .recent-post-item:not(:first-child)`
    # This regex matches the selector, then the block in curly braces { ... }
    
    # A robust way is to just find all the selectors we want to remove and their { ... }
    pattern = r"(?s)(?:(?:\:is\(\#recent\-posts\,\s*\.taxonomy\-post\-list\)\s*\>\s*\.recent\-post\-item[^{]*)|(?:\#recent\-posts\s*\>\s*\.recent\-post\-item[^{]*)|(?:\:root\[data\-theme\='dark'\]\[data\-background\='starfield'\] body:is\(\[data\-type\='home'\], \[data\-type\='category\-detail'\], \[data\-type\='tag\-detail'\]\)\s*:is\(\#recent\-posts\,\s*\.taxonomy\-post\-list\)\s*\>\s*\.recent\-post\-item[^{]*))\{[^{}]*\}"
    
    new_content = re.sub(pattern, "", content)
    
    # Run it multiple times in case of nested media queries or multiple matches
    new_content = re.sub(pattern, "", new_content)
    
    with open(css_file, 'w', encoding='utf-8') as f:
        f.write(new_content)

if __name__ == '__main__':
    remove_blocks('src/styles/global.css')
