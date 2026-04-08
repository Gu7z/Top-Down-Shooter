import CURRENT_PATCH_NOTES from './current_patch_notes.js';

export const PATCH_NOTES_STORAGE_KEY = 'patchNotes.lastSeenHash';

export function getPatchNotesStorage() {
  if (typeof localStorage === 'undefined') return null;
  return localStorage;
}

export function serializePatchNotes(notes = CURRENT_PATCH_NOTES) {
  return JSON.stringify({
    title: notes.title,
    date: notes.date,
    items: notes.items,
  });
}

export function getPatchNotesHash(notes = CURRENT_PATCH_NOTES) {
  const source = serializePatchNotes(notes);
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `pn-${(hash >>> 0).toString(16)}`;
}

export function shouldShowPatchNotes(storage = getPatchNotesStorage(), notes = CURRENT_PATCH_NOTES) {
  if (!storage) return false;
  return storage.getItem(PATCH_NOTES_STORAGE_KEY) !== getPatchNotesHash(notes);
}

export function markPatchNotesSeen(storage = getPatchNotesStorage(), notes = CURRENT_PATCH_NOTES) {
  if (!storage) return;
  storage.setItem(PATCH_NOTES_STORAGE_KEY, getPatchNotesHash(notes));
}
