const encoder = new TextEncoder();

export async function sha256Hex(value: string) {
  const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  const bytes = Array.from(new Uint8Array(buffer));
  return bytes.map((item) => item.toString(16).padStart(2, '0')).join('');
}
