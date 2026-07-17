const base64ToFile = async (base64String: string, fileName: string): Promise<File | null> => {
  const [mimePart, base64Content] = base64String.split(',');
  const mimeMatch = mimePart?.match(/:(.*?);/);
  const mimeType = mimeMatch ? mimeMatch[1] : '';

  if (!mimeType || !base64Content) return null;

  const ext = mimeType.split('/').pop() ?? 'png';
  const binaryString = atob(base64Content);
  const length = binaryString.length;
  const byteArray = new Uint8Array(length);

  for (let i = 0; i < length; i++) {
    byteArray[i] = binaryString.charCodeAt(i);
  }

  return new File([byteArray], `${fileName}.${ext}`, { type: mimeType });
};

export async function getImagesFromHtmlAndNewHtml(
  html: string,
  fileName: string
): Promise<{ images: File[]; newHtml: string }> {
  const images: File[] = [];
  let newHtml = html;
  const imageUrls = [...html.matchAll(/<img[^>]*src="([^"]*)"/g)].map((match) => match[1]);

  for (let index = 0; index < imageUrls.length; index++) {
    const src = imageUrls[index];
    const file = await base64ToFile(src, `${fileName}${index + 1}`);
    if (file) {
      images.push(file);
      newHtml = newHtml.replace(src, file.name);
    }
  }

  return { images, newHtml };
}

export function extractFirstImageSrc(html: string): string | null {
  const match = html.match(/<img[^>]*src="([^"]*)"/);
  return match?.[1] ?? null;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)));
}

export function htmlToPlainExcerpt(html: string, maxLength = 160): string {
  let text: string;

  if (typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    text = doc.body.textContent ?? '';
  } else {
    text = decodeHtmlEntities(html.replace(/<[^>]+>/g, ' '));
  }

  text = text.replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}
