from PIL import Image, ImageDraw

#this function generates the base image for the nft based on the data provided

def generate_base_image(data: dict) -> Image.Image:
    img = Image.new("RGB", (1024, 1024), (18, 25, 18))
    draw = ImageDraw.Draw(img)

    green = int(80 + data["ndvi_delta"] * 140)
    draw.rectangle([(120, 220), (904, 844)], fill=(25, green, 25))

    bar_width = int(600 * data["confidence"])
    draw.rectangle([(212, 870), (212 + bar_width, 910)], fill=(220, 220, 220))

    status_color = {
        "ACTIVE": (0, 200, 0),
        "DEGRADED": (255, 165, 0),
        "REVOKED": (200, 0, 0)
    }[data["status"]]

    draw.rectangle([(20, 20), (1004, 1004)], outline=status_color, width=12)

    return img
 