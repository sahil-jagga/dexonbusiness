import zlib
import struct
import math
import os

def create_png(width, height, is_maskable=False):
    # Generates a crisp RGBA PNG with solid background (#020617) and golden sun + billing icon
    raw_data = bytearray()
    cx = width / 2
    cy = height / 2
    radius = width * (0.28 if not is_maskable else 0.22)

    for y in range(height):
        raw_data.append(0) # filter type none
        for x in range(width):
            dx = x - cx
            dy = y - cy
            dist = math.sqrt(dx * dx + dy * dy)
            
            # Default dark background #020617
            r, g, b, a = 2, 6, 23, 255
            
            # Subtle gradient towards center
            glow = max(0, 1.0 - (dist / (width * 0.7)))
            r = int(min(255, r + 10 * glow))
            g = int(min(255, g + 18 * glow))
            b = int(min(255, b + 36 * glow))

            # Golden Sun circle in center
            if dist <= radius:
                # Sun gradient amber (#f59e0b) to yellow (#fbbf24)
                factor = (y - (cy - radius)) / (2 * radius) if radius > 0 else 0
                r = int(251 * (1 - factor) + 217 * factor)
                g = int(191 * (1 - factor) + 119 * factor)
                b = int(36 * (1 - factor) + 6 * factor)
                
                # Darker panel lines inside sun
                if abs(dx) < 2 or abs(dy) < 2:
                    r, g, b = 180, 83, 9
            elif dist <= radius + 14:
                # Sun outer halo
                alpha_halo = (14 - (dist - radius)) / 14
                r = int(r * (1 - alpha_halo) + 245 * alpha_halo)
                g = int(g * (1 - alpha_halo) + 158 * alpha_halo)
                b = int(b * (1 - alpha_halo) + 11 * alpha_halo)

            # Document badge on bottom-right of sun
            bx = cx + (width * 0.05)
            by = cy + (height * 0.04)
            bw = width * 0.26
            bh = height * 0.34
            if bx <= x <= bx + bw and by <= y <= by + bh:
                # White paper
                r, g, b = 255, 255, 255
                # Header bar on doc
                if by + bh * 0.15 <= y <= by + bh * 0.28 and bx + bw * 0.15 <= x <= bx + bw * 0.85:
                    r, g, b = 245, 158, 11
                # Lines on doc
                elif by + bh * 0.38 <= y <= by + bh * 0.46 and bx + bw * 0.15 <= x <= bx + bw * 0.70:
                    r, g, b = 148, 163, 184
                elif by + bh * 0.54 <= y <= by + bh * 0.62 and bx + bw * 0.15 <= x <= bx + bw * 0.80:
                    r, g, b = 148, 163, 184
                elif by + bh * 0.72 <= y <= by + bh * 0.84 and bx + bw * 0.15 <= x <= bx + bw * 0.85:
                    r, g, b = 16, 185, 129

            raw_data.extend([r, g, b, a])

    def png_chunk(chunk_type, data):
        length = len(data)
        crc = zlib.crc32(chunk_type + data) & 0xffffffff
        return struct.pack('>I', length) + chunk_type + data + struct.pack('>I', crc)

    header = b'\x89PNG\r\n\x1a\n'
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr = png_chunk(b'IHDR', ihdr_data)
    idat = png_chunk(b'IDAT', zlib.compress(bytes(raw_data), 9))
    iend = png_chunk(b'IEND', b'')

    return header + ihdr + idat + iend

out_dir = 'public'
os.makedirs(out_dir, exist_ok=True)

icons = [
    ('pwa-192x192.png', 192, 192, False),
    ('pwa-512x512.png', 512, 512, False),
    ('pwa-maskable-512x512.png', 512, 512, True),
    ('apple-touch-icon.png', 180, 180, False),
    ('favicon.ico', 64, 64, False),
]

for filename, w, h, maskable in icons:
    path = os.path.join(out_dir, filename)
    data = create_png(w, h, maskable)
    with open(path, 'wb') as f:
        f.write(data)
    print(f"Generated {filename} ({w}x{h}, {len(data)} bytes)")
