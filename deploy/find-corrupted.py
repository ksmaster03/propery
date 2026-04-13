import sys, os
for root, dirs, files in os.walk('D:/propre/doa-lease-system/packages/web/src'):
    for f in files:
        if f.endswith(('.ts', '.tsx')):
            path = os.path.join(root, f)
            with open(path, 'rb') as fp:
                data = fp.read()
            text = data.decode('utf-8', errors='replace')
            for i, line in enumerate(text.split('\n'), 1):
                if '\uFFFD' in line:
                    rel = os.path.relpath(path, 'D:/propre/doa-lease-system')
                    sys.stdout.buffer.write(f'{rel}:{i}: '.encode('utf-8'))
                    sys.stdout.buffer.write(line.encode('utf-8'))
                    sys.stdout.buffer.write(b'\n')
