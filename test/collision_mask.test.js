import test from "node:test";
import assert from "node:assert/strict";
import CollisionMask from "../src/utils/collision_mask.js";

function withDocumentMock(impl, run) {
  const originalDocument = global.document;
  global.document = {
    createElement(type) {
      assert.equal(type, "canvas");
      return impl();
    },
  };

  try {
    return run();
  } finally {
    global.document = originalDocument;
  }
}

test("collision mask marks pixels solid when alpha is above threshold", () => {
  withDocumentMock(
    () => ({
      width: 0,
      height: 0,
      getContext() {
        return {
          drawImage() {},
          getImageData() {
            return {
              data: new Uint8ClampedArray([
                0, 0, 0, 0,
                0, 0, 0, 11,
                0, 0, 0, 255,
                0, 0, 0, 10,
              ]),
            };
          },
        };
      },
    }),
    () => {
      const mask = new CollisionMask({}, 2, 2);

      assert.equal(mask.isSolid(0, 0), false);
      assert.equal(mask.isSolid(1, 0), true);
      assert.equal(mask.isSolid(0, 1), true);
      assert.equal(mask.isSolid(1, 1), false);
    }
  );
});

test("collision mask treats out-of-bounds and empty sources as transparent", () => {
  const mask = new CollisionMask(null, 2, 2);

  assert.equal(mask.isSolid(-1, 0), false);
  assert.equal(mask.isSolid(2, 0), false);
  assert.equal(mask.isSolid(0, 2), false);
  assert.equal(mask.isSolid(0, 0), false);
});

test("collision mask survives canvas read failures", () => {
  const originalWarn = console.warn;
  let warned = false;
  console.warn = () => {
    warned = true;
  };

  try {
    withDocumentMock(
      () => ({
        width: 0,
        height: 0,
        getContext() {
          return {
            drawImage() {
              throw new Error("tainted canvas");
            },
          };
        },
      }),
      () => {
        const mask = new CollisionMask({}, 1, 1);

        assert.equal(mask.isSolid(0, 0), false);
        assert.equal(warned, true);
      }
    );
  } finally {
    console.warn = originalWarn;
  }
});
