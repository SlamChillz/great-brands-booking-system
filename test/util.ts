const uniqueStrings = new Set();
const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function randomEventName(length = 7) {
  let result = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }

  if (uniqueStrings.has(result)) {
    return randomEventName(length); // Recursively generate a new string if it's not unique
  }

  uniqueStrings.add(result);
  return result;
}
