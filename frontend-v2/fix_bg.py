import re

with open('src/app/(dashboard)/page.tsx') as f:
    content = f.read()

content_new = re.sub(
    r'(rounded-2xl )bg-card border border-border( px-5 py-6 md:px-7) shadow-sm',
    r'\1bg-transparent\2',
    content
)
content_new = content_new.replace(
    'text-muted-foreground text-sm max-w-xl',
    'text-slate-600 dark:text-white/70 text-sm max-w-xl'
)

if content_new == content:
    print('Nada mudou — confirme as classes reais com grep antes')
else:
    with open('src/app/(dashboard)/page.tsx', 'w') as f:
        f.write(content_new)
    print('OK')
