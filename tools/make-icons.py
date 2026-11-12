"""Own symbols for the six hero types of ML Helper, made with the OpenAI image API (a few cents per run).
One picture with all six in a 3 x 2 grid keeps them in one style; it is cut into cells, the green background is keyed
out, each symbol is trimmed, squared and saved as img/role-<type>.png (160 px).
The key is read from the environment (OPENAI_API_KEY) or from a gitignored .env; it is never printed or stored here.
usage: python -I tools/make-icons.py [--keep-sheet]
"""
import os, sys, json, base64, io, urllib.request
from PIL import Image

here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out_dir = os.path.join(here, 'img')
ENV_PATHS = [os.path.join(here, '.env'), os.path.expandvars(r'%USERPROFILE%\Desktop\Projects\Brave Frontier\.env')]
ROLES = ['tank', 'fighter', 'assassin', 'mage', 'marksman', 'support']     # reading order of the grid

PROMPT = ('Six flat game class emblems on one sheet, arranged in a strict grid of 3 columns and 2 rows with wide empty gaps '
          'between them, each emblem centred in its own cell and filling about 60% of the cell. '
          'Top row, left to right: a sturdy kite shield (tank); two crossed swords (fighter); a curved dagger crossed with a '
          'four-point throwing star (assassin). Bottom row, left to right: a wizard staff topped with a faceted crystal and two '
          'small sparkles (mage); a recurve bow with a nocked arrow (marksman); a rounded healing cross with a small pair of '
          'wings (support). Style: bold, modern esports emblem, solid antique gold (#e9b949) shapes with a slightly darker '
          'gold inner line and one lighter highlight, thick simple forms that stay readable at 32 pixels, the same line weight '
          'and level of detail in all six, perfectly flat, no shadows, no frames around the cells, no text, no letters. '
          'Background: completely flat, uniform, pure bright green (#00FF00) everywhere, nothing else on it.')

def load_key():
    k = os.environ.get('OPENAI_API_KEY')
    if k: return k
    for p in ENV_PATHS:
        if os.path.exists(p):
            for line in open(p, encoding='utf-8'):
                if line.strip().startswith('OPENAI_API_KEY='): return line.split('=', 1)[1].strip()
    raise SystemExit('no OPENAI_API_KEY')

def key_green(im):
    px = im.load(); w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]; gr = g - max(r, b)
            if gr > 90: px[x, y] = (r, g, b, 0)
            elif gr > 30: px[x, y] = (r, max(r, b), b, int(255 * (90 - gr) / 60))
    return im

def main():
    body = {'model': 'gpt-image-2', 'prompt': PROMPT, 'size': '1536x1024', 'quality': 'medium', 'n': 1}
    req = urllib.request.Request('https://api.openai.com/v1/images/generations', data=json.dumps(body).encode('utf-8'),
                                 headers={'Authorization': f'Bearer {load_key()}', 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=300) as r: data = json.loads(r.read().decode('utf-8'))
    sheet = Image.open(io.BytesIO(base64.b64decode(data['data'][0]['b64_json']))).convert('RGBA')
    os.makedirs(out_dir, exist_ok=True)
    if '--keep-sheet' in sys.argv: sheet.convert('RGB').save(os.path.join(out_dir, '_role-sheet.png'))
    cw, ch = sheet.width // 3, sheet.height // 2
    for i, name in enumerate(ROLES):
        cell = key_green(sheet.crop(((i % 3) * cw, (i // 3) * ch, (i % 3 + 1) * cw, (i // 3 + 1) * ch)))
        box = cell.getbbox()
        if not box: print(name, 'EMPTY'); continue
        cell = cell.crop(box); side = int(max(cell.size) * 1.12)
        sq = Image.new('RGBA', (side, side), (0, 0, 0, 0)); sq.paste(cell, ((side - cell.width) // 2, (side - cell.height) // 2), cell)
        sq.resize((160, 160), Image.LANCZOS).save(os.path.join(out_dir, f'role-{name}.png'), optimize=True)
        print(name, box)

if __name__ == '__main__':
    main()
