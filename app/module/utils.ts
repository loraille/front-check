// Export de la fonction pour qu'elle soit utilisable dans d'autres fichiers
export function capitalizeFirstLetter(str: string): string {
  if (typeof str !== 'string' || str.length === 0) {
    return str; // Retourne la chaîne telle quelle si elle est vide ou non valide
  }
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

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