import os
import math
from PIL import Image, ImageDraw, ImageFont

# Output directory for brand assets
BRAND_DIR = r"d:\Support HR\Software\Android\assets\brand"
ASSETS_DIR = r"d:\Support HR\Software\Android\assets"
os.makedirs(BRAND_DIR, exist_ok=True)

# Brand Color Palette
COLOR_CYAN_BLUE = (0, 102, 255)       # #0066FF (Light facet top)
COLOR_ROYAL_BLUE = (37, 99, 235)      # #2563EB (Front main facet)
COLOR_DARK_ROYAL = (30, 58, 138)      # #1E3A8A (Bottom shadow facet)
COLOR_DEEP_NAVY = (28, 25, 77)        # #1C194D (Right V arm main face)
COLOR_DARK_INDIGO = (49, 27, 146)     # #311B92 (Right V arm bevel edge)

def generate_assets():
    # 1. Generate 1024x1024 Icon PNG
    img_size = 1024
    img = Image.new("RGBA", (img_size, img_size), (0, 0, 0, 0)) # Transparent background for icon
    draw = ImageDraw.Draw(img)

    # Scale logo mark to fit 1024x1024 with padding
    # Original SVG viewBox is 0 0 100 100
    scale = 8.0
    offset_x = (img_size - 100 * scale) / 2
    offset_y = (img_size - 100 * scale) / 2

    def S(pts):
        return [(offset_x + x * scale, offset_y + y * scale) for x, y in pts]

    # Left C-Ribbon (Top Facet - Bright Blue)
    top_facet = [(35, 12), (72, 32), (52, 44), (18, 24)]
    draw.polygon(S(top_facet), fill=COLOR_CYAN_BLUE)

    # Left C-Ribbon (Front/Side Facet - Medium Royal Blue)
    front_facet = [(18, 24), (52, 44), (35, 88), (5, 52)]
    draw.polygon(S(front_facet), fill=COLOR_ROYAL_BLUE)

    # Left C-Ribbon (Bottom Shadow Facet - Dark Royal Blue)
    bottom_facet = [(5, 52), (35, 88), (18, 88), (5, 60)]
    draw.polygon(S(bottom_facet), fill=COLOR_DARK_ROYAL)

    # Right V-Arm (Front Facet - Deep Navy)
    right_arm = [(28, 88), (48, 48), (92, 18), (68, 18)]
    draw.polygon(S(right_arm), fill=COLOR_DEEP_NAVY)

    # Right arm top bevel
    right_arm_top = [(92, 18), (68, 18), (64, 12), (88, 12)]
    draw.polygon(S(right_arm_top), fill=COLOR_DARK_INDIGO)

    # Save icon.png to brand dir & assets root
    icon_path_brand = os.path.join(BRAND_DIR, "cv-match-icon.png")
    icon_path_root = os.path.join(ASSETS_DIR, "icon.png")
    img.save(icon_path_brand, "PNG")
    img.save(icon_path_root, "PNG")

    # 2. Generate Adaptive Icon Foreground (with light background variant if needed)
    img_bg = Image.new("RGBA", (img_size, img_size), (9, 13, 22, 255)) # Dark navy background #090D16
    img_bg.paste(img, (0, 0), img)
    img_bg.save(os.path.join(BRAND_DIR, "cv-match-icon-dark-bg.png"), "PNG")

    img_light_bg = Image.new("RGBA", (img_size, img_size), (255, 255, 255, 255)) # White background
    img_light_bg.paste(img, (0, 0), img)
    img_light_bg.save(os.path.join(BRAND_DIR, "cv-match-icon-light-bg.png"), "PNG")

    # 3. Generate Splash Screen PNG (2048x2048)
    splash_size = 2048
    splash = Image.new("RGBA", (splash_size, splash_size), (0, 0, 0, 0)) # transparent splash icon
    # Scale for splash
    scale_splash = 12.0
    offset_x_s = (splash_size - 100 * scale_splash) / 2
    offset_y_s = (splash_size - 100 * scale_splash) / 2

    def S_splash(pts):
        return [(offset_x_s + x * scale_splash, offset_y_s + y * scale_splash) for x, y in pts]

    draw_splash = ImageDraw.Draw(splash)
    draw_splash.polygon(S_splash(top_facet), fill=COLOR_CYAN_BLUE)
    draw_splash.polygon(S_splash(front_facet), fill=COLOR_ROYAL_BLUE)
    draw_splash.polygon(S_splash(bottom_facet), fill=COLOR_DARK_ROYAL)
    draw_splash.polygon(S_splash(right_arm), fill=COLOR_DEEP_NAVY)
    draw_splash.polygon(S_splash(right_arm_top), fill=COLOR_DARK_INDIGO)

    splash_path_brand = os.path.join(BRAND_DIR, "cv-match-splash.png")
    splash_path_root = os.path.join(ASSETS_DIR, "splash-icon.png")
    splash.save(splash_path_brand, "PNG")
    splash.save(splash_path_root, "PNG")

    print(f"Generated brand icons and splash screens successfully in {BRAND_DIR} and {ASSETS_DIR}.")

if __name__ == "__main__":
    generate_assets()
