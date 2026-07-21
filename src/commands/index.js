import { listCmd } from './list.js';
import { showCmd } from './show.js';
import { copyCmd } from './copy.js';
import { exportCmd } from './export.js';
import { tagsCmd } from './tags.js';
import { searchCmd } from './search.js';
import { addCmd } from './add.js';
import { editCmd } from './edit.js';
import { deleteCmd } from './delete.js';
import { renameCmd } from './rename.js';
import { validateCmd } from './validate.js';
import { importCmd } from './import.js';

export const COMMANDS = {
  list: listCmd,
  show: showCmd,
  copy: copyCmd,
  export: exportCmd,
  tags: tagsCmd,
  search: searchCmd,
  add: addCmd,
  edit: editCmd,
  delete: deleteCmd,
  rm: deleteCmd,
  rename: renameCmd,
  validate: validateCmd,
  import: importCmd,
};
