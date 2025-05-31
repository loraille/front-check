export type List = {
  _id: string;
  name: string;
  items: Item[];
};

export type Item = {
  _id: string;
  item: string;
  value: string;
  type: 'text' | 'toggle';
};

export type ListItem = List;

// Ajout d'un export par défaut pour supprimer le warning
const defaultExport = {
  name: 'list-types'
};

export default defaultExport; 