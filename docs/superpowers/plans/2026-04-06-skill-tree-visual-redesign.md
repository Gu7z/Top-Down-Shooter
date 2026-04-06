# Skill Tree Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current rejected skill-tree visual treatment with the approved Gem Socket Tree / Compact Constellation Tree direction.

**Architecture:** Keep the existing Pixi skill-tree screen and state logic. Change the skill-tree data coordinates plus visual layout constants/rendering helpers so nodes render as socket tokens with branch colors, fusion diamonds, capstone diamonds, and wider top-fusion spacing matching the approved v3 mockup.

**Tech Stack:** JavaScript, PixiJS, existing Vitest test suite, Playwright screenshot QA.

---

### Task 1: Map Current Skill Tree Rendering

**Files:**
- Inspect: `src/skill_tree.js`
- Inspect: `src/progression/skill_tree_data.js`
- Inspect: `test/skill_tree.test.js`

- [ ] **Step 1: Identify the layout and visual helper functions**

Run: `rg -n "layout|node|fusion|capstone|Graphics|line|circle|polygon|draw" src/skill_tree.js test/skill_tree.test.js`

Expected: Locate the node-positioning constants, node drawing helper, connection drawing helper, and tests that assert visual structure.

### Task 2: Lock The Visual Contract With Tests

**Files:**
- Modify: `test/skill_tree.test.js`
- Modify: `test/progression/skill_tree_data.test.js`

- [ ] **Step 1: Add failing tests for Gem Socket visual layers**

Add tests that assert the tree exposes socket/ring visual metadata or layer names for base nodes, fusion diamonds, capstone diamonds, and spaced top fusion positions.

- [ ] **Step 2: Run targeted tests to verify RED**

Run: `npm test -- skill_tree`

Expected: FAIL because the approved socket metadata or spacing is not implemented yet.

### Task 3: Implement Gem Socket Rendering

**Files:**
- Modify: `src/skill_tree.js`
- Modify: `src/progression/skill_tree_data.js`

- [ ] **Step 1: Update layout constants**

Implement the v3 spacing from the companion mockup: wider branch radius, top fusion nodes offset outward from Firepower, capstones further from the core, and no overlapping sockets.

- [ ] **Step 2: Update render helpers**

Render base upgrades as socket rings with colored inner gems, fusion upgrades as magenta diamonds, capstones as gold diamonds, and core as a larger green socket reactor.

- [ ] **Step 3: Preserve existing interaction behavior**

Keep pan/zoom, tooltip, left-click unlock, right-click refund cascade, progressive reveal, state save/load, and camera framing unchanged except where visual bounds require recalculation.

- [ ] **Step 4: Run targeted tests to verify GREEN**

Run: `npm test -- skill_tree`

Expected: PASS.

### Task 4: Verify Full Feature And Visual QA

**Files:**
- Inspect: runtime through local dev server

- [ ] **Step 1: Run the full automated suite**

Run: `npm test`

Expected: PASS.

- [ ] **Step 2: Run build**

Run: `npm run build`

Expected: PASS, allowing the existing Snowpack/esbuild `import.meta` warning if it still appears.

- [ ] **Step 3: Capture Playwright screenshots**

Run the app, open the skill tree at 1280x720 or 1280x900, capture the default/core view and a purchased/progressed view.

Expected: No visible node overlap, top pink fusion diamonds have clear spacing from Firepower sockets, nodes read as clickable sockets, and the screen preserves the approved Compact Constellation Tree direction.
