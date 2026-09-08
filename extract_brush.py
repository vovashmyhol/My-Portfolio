import os
from PIL import Image, ImageFilter
import numpy as np

src_path = r'C:/Users/WellDone/.gemini/antigravity/brain/0629a328-5e84-40f3-87b2-1a3b008cf5c0/.user_uploaded/media_1788862086402.jpg'
out_path = r'assets/brush-texture.png'

if os.path.exists(src_path):
    img = Image.open(src_path).convert('RGB')
    arr = np.array(img, dtype=np.float32)
    
    # Analyze background color in the outer corners (dark background)
    bg_sample = np.concatenate([
        arr[0:20, 0:50].reshape(-1, 3),
        arr[0:20, -50:].reshape(-1, 3),
        arr[-20:, 0:50].reshape(-1, 3),
        arr[-20:, -50:].reshape(-1, 3)
    ], axis=0)
    bg_mean = bg_sample.mean(axis=0) # roughly [9, 14, 21]
    
    # The brush stroke is lighter: calculate brightness above dark background
    luminance = arr[:, :, 0] * 0.299 + arr[:, :, 1] * 0.587 + arr[:, :, 2] * 0.114
    bg_lum = bg_mean[0] * 0.299 + bg_mean[1] * 0.587 + bg_mean[2] * 0.114
    
    # Calculate brush opacity mask
    # Background has luminance ~13-18. Brush body has luminance ~90-115.
    alpha = np.clip((luminance - 20) / (70 - 20) * 255.0, 0, 255)
    
    # Inpaint the icon and text in the center
    # Icon is at approx x=180..270, text is at approx x=320..540, y=120..200
    # Between y=120 and 200, if luminance drops inside the brush, fill with sample brush color
    # Let's find brush color by sampling clean brush area around x=580..680, y=120..190
    clean_patch = arr[130:185, 580:680]
    patch_mean = clean_patch.mean(axis=(0,1))
    
    # Identify dark pixels inside the brush bounding box (icon and "ГЛАВНАЯ")
    mask_inside_brush = (luminance < 60) & (arr.shape[0] > 0)
    # restrict to center region
    h, w, _ = arr.shape
    y_min, y_max = int(h * 0.35), int(h * 0.80)
    x_min, x_max = int(w * 0.18), int(w * 0.60)
    
    for y in range(y_min, y_max):
        for x in range(x_min, x_max):
            if luminance[y, x] < 62: # inside icon or text glyph
                # Blend with vertical neighbor pixels from above and below the text
                y_top = max(y_min - 5, y - 35)
                y_bot = min(y_max + 5, y + 35)
                sample_color = (arr[y_top, x] + arr[y_bot, x]) / 2.0
                arr[y, x] = sample_color
                alpha[y, x] = 255.0
                
    # Normalize color to clean off-white chalk tone
    # Hinterland chalk tone is approx #d6dbe0
    brush_mask = alpha > 40
    arr[brush_mask, 0] = np.clip(arr[brush_mask, 0] * 1.35, 0, 255)
    arr[brush_mask, 1] = np.clip(arr[brush_mask, 1] * 1.35, 0, 255)
    arr[brush_mask, 2] = np.clip(arr[brush_mask, 2] * 1.35, 0, 255)
    
    # Crop to content
    coords = np.argwhere(alpha > 15)
    y0, x0 = coords.min(axis=0)
    y1, x1 = coords.max(axis=0)
    
    pad = 10
    y0 = max(0, y0 - pad)
    y1 = min(h, y1 + pad)
    x0 = max(0, x0 - pad)
    x1 = min(w, x1 + pad)
    
    cropped_arr = arr[y0:y1, x0:x1]
    cropped_alpha = alpha[y0:y1, x0:x1]
    
    rgba = np.zeros((cropped_arr.shape[0], cropped_arr.shape[1], 4), dtype=np.uint8)
    rgba[:, :, :3] = np.clip(cropped_arr, 0, 255).astype(np.uint8)
    rgba[:, :, 3] = np.clip(cropped_alpha, 0, 255).astype(np.uint8)
    
    out_img = Image.fromarray(rgba, 'RGBA')
    os.makedirs('assets', exist_ok=True)
    out_img.save(out_path)
    print(f'Successfully generated {out_path} with size {out_img.size}')
else:
    print('Source not found')
