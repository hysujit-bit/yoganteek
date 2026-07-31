/**
 * Share text via native share sheet (mobile) or copy to clipboard (desktop).
 * @param {string} text - The text to share
 * @param {string} title - Share title (used on mobile)
 * @returns {Promise<'shared' | 'copied'>} - What happened
 */
export const shareText = async (text, title = 'Yoganteek Wellness') => {
  if (navigator.share) {
    await navigator.share({ title, text });
    return 'shared';
  }
  await navigator.clipboard.writeText(text);
  return 'copied';
};
