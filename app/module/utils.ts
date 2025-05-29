// Export de la fonction pour qu'elle soit utilisable dans d'autres fichiers
export const capitalizeFirstLetter = (string: string) => {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
};

// majuscule sur plsusieurs mots
export function capitalizeWords(str: string): string {
  if (typeof str !== 'string' || str.length === 0) {
    return str;
  }
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const utils = {
  capitalizeFirstLetter
};

export default utils;