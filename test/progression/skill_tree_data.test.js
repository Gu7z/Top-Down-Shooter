import test from "node:test";
import assert from "node:assert/strict";
import {
  SKILL_TREE,
  SKILL_BRANCHES,
  getSkillById,
} from "../../src/progression/skill_tree_data.js";

test("skill tree contains core plus thirty-nine upgrade nodes", () => {
  assert.equal(SKILL_TREE.length, 40);
  assert.equal(SKILL_TREE.filter((skill) => skill.type === "core").length, 1);
  assert.equal(SKILL_TREE.filter((skill) => skill.type === "base").length, 30);
  assert.equal(SKILL_TREE.filter((skill) => skill.type === "fusion").length, 6);
  assert.equal(SKILL_TREE.filter((skill) => skill.type === "capstone").length, 3);
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

test("node positions follow the approved compact Gem Socket Tree v3 layout", () => {
  assert.deepEqual(getSkillById("fire_rate_1").position, { x: 0, y: -100 });
  assert.deepEqual(getSkillById("multishot_1").position, { x: -35, y: -188 });
  assert.deepEqual(getSkillById("overheat_1").position, { x: 35, y: -188 });
  assert.deepEqual(getSkillById("fusion_control_firepower").position, { x: -125, y: -158 });
  assert.deepEqual(getSkillById("fusion_firepower_mobility").position, { x: 125, y: -158 });
  assert.deepEqual(getSkillById("capstone_overdrive_matrix").position, { x: 0, y: -228 });
});

test("node positions keep enough gap for socket rings and hover glow", () => {
  for (let i = 0; i < SKILL_TREE.length; i++) {
    for (let j = i + 1; j < SKILL_TREE.length; j++) {
      const a = SKILL_TREE[i];
      const b = SKILL_TREE[j];
      const dx = a.position.x - b.position.x;
      const dy = a.position.y - b.position.y;
      const distance = Math.hypot(dx, dy);
      assert.ok(
        distance >= 52,
        `${a.id} and ${b.id} are too close: ${distance}`
      );
    }
  }
});

test("getSkillById returns the exact skill", () => {
  assert.equal(getSkillById("core").name, "Core");
  assert.equal(getSkillById("missing"), undefined);
});
