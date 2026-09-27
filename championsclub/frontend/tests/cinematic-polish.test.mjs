import test from "node:test";
import assert from "node:assert/strict";
import {
  createProgressDamping,
  cinematicState,
} from "../src/showcase/cinematicTimeline.js";

test("fast input reaches 90% within 150ms, decelerates, and settles", () => {
  const d = createProgressDamping();
  d.target(0.4, 1 / 60);
  let previous = 0,
    movement = Infinity;
  for (let i = 0; i < 9; i++) {
    const p = d.step(1 / 60);
    assert.ok(p - previous <= movement);
    movement = p - previous;
    previous = p;
  }
  assert.ok(previous >= 0.36);
  for (let i = 0; i < 60; i++) d.step(1 / 60);
  assert.equal(d.settled, true);
  assert.equal(d.rendered, 0.4);
});

test("reversal responds immediately and loading gate cannot enter an unloaded engine", () => {
  const d = createProgressDamping();
  d.target(0.9);
  for (let i = 0; i < 90; i++) d.step(1 / 60, 0.46);
  assert.equal(d.rendered, 0.46);
  d.target(0.2);
  assert.equal(d.step(1 / 60), 0.2);
  d.target(0.9);
  for (let i = 0; i < 90; i++) d.step(1 / 60);
  assert.equal(d.rendered, 0.9);
  const state = cinematicState(0.64);
  assert.equal(cinematicState(0.94, state), state);
  assert.equal(state.scene, "engine");
});
