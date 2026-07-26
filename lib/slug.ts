const CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export function generateSlug(length = 6): string {
  let slug = '';
  for (let i = 0; i < length; i++) {
    slug += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return slug;
}
