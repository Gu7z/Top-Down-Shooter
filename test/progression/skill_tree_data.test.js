import test from "node:test";
import assert from "node:assert/strict";
import {
  SKILL_TREE,
  SKILL_BRANCHES,
  getSkillById,
} from "../../src/progression/skill_tree_data.js";

test("skill tree contains core plus 42 upgrade nodes", () => {
  assert.equal(SKILL_TREE.length, 43); // 1 core + 6 branches * 7 tiers
  assert.equal(SKILL_TREE.filter((skill) => skill.type === "core").length, 1);
  assert.equal(SKILL_TREE.filter((skill) => skill.type === "base").length, 42);
});

test("all skill ids are unique and prereqs point at existing skills", () => {
  const ids = new Set(SKILL_TREE.map((skill) => skill.id));
  assert.equal(ids.size, SKILL_TREE.length);

  for (const skill of SKILL_TREE) {
    for (const prereq of skill.prereqs) {
      assert.ok(ids.has(prereq), `${skill.id} missing prereq ${prereq}`);
    }
  }
});

test("six branches are in the approved order", () => {
  assert.deepEqual(SKILL_BRANCHES.map((branch) => branch.id), [
    "firepower",
    "mobility",
    "survival",
    "economy",
    "tech",
    "control",
  ]);
});

test("getSkillById returns the exact skill", () => {
  assert.equal(getSkillById("core").name, "Core");
  assert.equal(getSkillById("missing"), undefined);
});
