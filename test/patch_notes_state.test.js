import test from 'node:test';
import assert from 'node:assert/strict';
import CURRENT_PATCH_NOTES from '../src/patch_notes/current_patch_notes.js';
import {
  PATCH_NOTES_STORAGE_KEY,
  getPatchNotesHash,
  markPatchNotesSeen,
  shouldShowPatchNotes,
} from '../src/patch_notes/patch_notes_state.js';

function createStorage(initial = {}) {
  return {
    storage: { ...initial },
    getItem(key) { return this.storage[key]; },
    setItem(key, value) { this.storage[key] = value; },
  };
}

test('patch notes hash is stable for the same content', () => {
  const firstHash = getPatchNotesHash(CURRENT_PATCH_NOTES);
  const secondHash = getPatchNotesHash(CURRENT_PATCH_NOTES);

  assert.equal(firstHash, secondHash);
  assert.equal(firstHash.startsWith('pn-'), true);
});

test('markPatchNotesSeen stores the current hash and suppresses the current modal', () => {
  const storage = createStorage();

  markPatchNotesSeen(storage, CURRENT_PATCH_NOTES);

  assert.equal(storage.getItem(PATCH_NOTES_STORAGE_KEY), getPatchNotesHash(CURRENT_PATCH_NOTES));
  assert.equal(shouldShowPatchNotes(storage, CURRENT_PATCH_NOTES), false);
});

test('changing patch content produces a new hash and shows the modal again', () => {
  const storage = createStorage();
  markPatchNotesSeen(storage, CURRENT_PATCH_NOTES);

  const nextPatch = {
    ...CURRENT_PATCH_NOTES,
    items: [...CURRENT_PATCH_NOTES.items, 'Novo evento de teste.'],
  };

  assert.notEqual(getPatchNotesHash(nextPatch), getPatchNotesHash(CURRENT_PATCH_NOTES));
  assert.equal(shouldShowPatchNotes(storage, nextPatch), true);
});
