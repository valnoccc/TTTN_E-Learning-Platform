export const BAD_WORDS = [
  'đụ',
  'đù',
  'cặc',
  'lồn',
  'địt',
  'chó đẻ',
  'đĩ',
  'cút',
  'chết mẹ',
  'ngu',
  'đéo',
  'đm',
  'vkl',
  'vl',
  'đmm',
  'đcc',
  'dcm',
  'đcm',
  'cc',
  'cl',
  'đậu xanh',
  'vãi',
  'địt mẹ',
  'địt cụ',
  'phò',
  'cave',
  'bitch',
  'fuck',
  'shit',
  'asshole',
];

export function containsProfanity(text: string): boolean {
  if (!text) return false;
  
  const lowerText = text.toLowerCase();
  
  for (const word of BAD_WORDS) {
    if (word.length <= 3) {
      const regex = new RegExp(`(^|\\s|[^a-zA-Z0-9_À-ỹ])${word}($|\\s|[^a-zA-Z0-9_À-ỹ])`, 'i');
      if (regex.test(lowerText)) {
        return true;
      }
    } else {
      if (lowerText.includes(word)) {
        return true;
      }
    }
  }
  
  return false;
}
