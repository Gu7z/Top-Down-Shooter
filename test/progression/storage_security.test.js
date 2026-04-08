import test from "node:test";
import assert from "node:assert/strict";
import { encodePayload, decodePayload, _sign } from "../../src/progression/storage_security.js";

const SAMPLE_PAYLOAD = {
  credits: 500,
  purchasedIds: ["core", "fire_rate_1"],
  spentBySkillId: { fire_rate_1: 45 },
};

test("encodePayload produz string com prefixo v1.", () => {
  const encoded = encodePayload(SAMPLE_PAYLOAD);
  assert.ok(encoded.startsWith("v1."), "deve começar com v1.");
  assert.ok(!encoded.startsWith("{"), "não deve ser JSON puro");
});

test("round-trip encode → decode preserva o payload", () => {
  const encoded = encodePayload(SAMPLE_PAYLOAD);
  const decoded = decodePayload(encoded);
  assert.deepEqual(decoded, SAMPLE_PAYLOAD);
});

test("decodePayload retorna null para assinatura corrompida", () => {
  const encoded = encodePayload(SAMPLE_PAYLOAD);
  const parts = encoded.split(".");
  parts[2] = parts[2].replace(/[0-9a-f]/, (c) => ((parseInt(c, 16) ^ 1).toString(16)));
  assert.equal(decodePayload(parts.join(".")), null);
});

test("decodePayload retorna null para base64 corrompido", () => {
  const encoded = encodePayload(SAMPLE_PAYLOAD);
  const parts = encoded.split(".");
  parts[1] = parts[1].slice(0, -4) + "!!!!"; // substitui fim por chars inválidos
  assert.equal(decodePayload(parts.join(".")), null);
});

test("decodePayload retorna null para JSON puro (trigger de migração legada)", () => {
  const plain = JSON.stringify(SAMPLE_PAYLOAD);
  assert.equal(decodePayload(plain), null);
});

test("decodePayload retorna null para versão desconhecida", () => {
  const encoded = encodePayload(SAMPLE_PAYLOAD);
  const withV2 = "v2." + encoded.slice(3);
  assert.equal(decodePayload(withV2), null);
});

test("decodePayload retorna null para string vazia ou nula", () => {
  assert.equal(decodePayload(""), null);
  assert.equal(decodePayload(null), null);
});

test("decodePayload retorna null para string sem estrutura esperada", () => {
  assert.equal(decodePayload("lixo-sem-sentido"), null);
  assert.equal(decodePayload("v1.somenteduaspartes"), null);
});

test("_sign retorna string hex de 64 caracteres", () => {
  const sig = _sign('{"test":true}');
  assert.equal(typeof sig, "string");
  assert.equal(sig.length, 64);
  assert.ok(/^[0-9a-f]+$/.test(sig), "deve ser hex lowercase");
});
