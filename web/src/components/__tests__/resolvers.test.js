import { describe, it, expect } from "vitest";
import {
  resolveNodeAdd,
  resolveNodeDelete,
  resolveNodeVote,
  resolveEdgeCreate,
  resolveEdgeDelete,
  resolveEdgeVote,
  getNodeReviewState,
  getEdgeReviewState,
} from "../resolvers.js";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS — construiesc events pentru teste
// ─────────────────────────────────────────────────────────────────────────────

let idCounter = 0;
const makeId = () => `id-${++idCounter}`;

const makeEvent = (overrides) => ({
  id: makeId(),
  createdAt: Date.now(),
  ...overrides,
});

const nodeCreate = ({ nodeId, userId = null, scope = "local" }) =>
  makeEvent({
    entityType: "node",
    entityId: nodeId,
    action: "create",
    scope,
    userId,
  });

const nodeUp = ({ nodeId, userId = null, scope = "local" }) =>
  makeEvent({
    entityType: "node",
    entityId: nodeId,
    action: "up",
    scope,
    userId,
  });

const nodeDown = ({ nodeId, userId = null, scope = "local" }) =>
  makeEvent({
    entityType: "node",
    entityId: nodeId,
    action: "down",
    scope,
    userId,
  });

const nodeAbandon = ({ nodeId, userId }) =>
  makeEvent({
    entityType: "node",
    entityId: nodeId,
    action: "abandon",
    scope: "local",
    userId,
  });

const edgeCreate = ({
  edgeId,
  userId = null,
  scope = "local",
  sourceId,
  targetId,
}) =>
  makeEvent({
    entityType: "edge",
    entityId: edgeId,
    action: "create",
    scope,
    userId,
    sourceId,
    targetId,
  });

const edgeUp = ({ edgeId, userId = null, scope = "local" }) =>
  makeEvent({
    entityType: "edge",
    entityId: edgeId,
    action: "up",
    scope,
    userId,
  });

const edgeDown = ({ edgeId, userId = null, scope = "local" }) =>
  makeEvent({
    entityType: "edge",
    entityId: edgeId,
    action: "down",
    scope,
    userId,
  });

const edgeAbandon = ({ edgeId, userId }) =>
  makeEvent({
    entityType: "edge",
    entityId: edgeId,
    action: "abandon",
    scope: "local",
    userId,
  });

// context helpers
const ownerCtx = (extra = {}) => ({
  currentMemberId: "owner-1",
  currentMemberRole: "OWNER",
  projectOwnerId: "owner-1",
  getMemberById: () => null,
  nodes: [],
  events: [],
  ...extra,
});

const guestCtx = (guestId = "guest-1", extra = {}) => ({
  currentMemberId: guestId,
  currentMemberRole: "STUDENT",
  projectOwnerId: "owner-1",
  getMemberById: () => null,
  nodes: [],
  events: [],
  ...extra,
});

// ─────────────────────────────────────────────────────────────────────────────
// resolveNodeAdd
// ─────────────────────────────────────────────────────────────────────────────

describe("resolveNodeAdd", () => {
  it("owner creează nod cu scope global și userId null", () => {
    const res = resolveNodeAdd({ position: { x: 0, y: 0 } }, ownerCtx());
    expect(res.error).toBeNull();
    const ev = res.events.nodes.add[0];
    expect(ev.scope).toBe("global");
    expect(ev.userId).toBeNull();
    expect(ev.action).toBe("create");
    expect(res.entities.nodes.add).toHaveLength(1);
  });

  it("guest creează nod cu scope local și userId setat", () => {
    const res = resolveNodeAdd(
      { position: { x: 0, y: 0 } },
      guestCtx("guest-1"),
    );
    expect(res.error).toBeNull();
    const ev = res.events.nodes.add[0];
    expect(ev.scope).toBe("local");
    expect(ev.userId).toBe("guest-1");
  });

  it("returnează eroare dacă label există deja", () => {
    const nodes = [{ data: { label: "Nod existent" } }];
    const res = resolveNodeAdd(
      { label: "Nod existent" },
      guestCtx("guest-1", { nodes }),
    );
    expect(res.error).toBeTruthy();
    expect(res.entities.nodes.add).toHaveLength(0);
  });

  it("permite label nou dacă nu există", () => {
    const nodes = [{ data: { label: "Alt nod" } }];
    const res = resolveNodeAdd(
      { label: "Nod nou" },
      guestCtx("guest-1", { nodes }),
    );
    expect(res.error).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// resolveNodeDelete
// ─────────────────────────────────────────────────────────────────────────────

describe("resolveNodeDelete", () => {
  it("owner șterge nod — șterge nod și toate events", () => {
    const nodeId = "node-1";
    const events = [nodeCreate({ nodeId, userId: "guest-1", scope: "local" })];
    const res = resolveNodeDelete(nodeId, ownerCtx({ events }));
    expect(res.error).toBeNull();
    expect(res.entities.nodes.remove).toContain(nodeId);
    expect(res.events.nodes.remove).toHaveLength(1);
  });

  it("owner șterge nod — șterge și edges adiacente", () => {
    const nodeId = "node-1";
    const edgeId = "edge-1";
    const events = [
      nodeCreate({ nodeId, userId: "guest-1", scope: "local" }),
      edgeCreate({
        edgeId,
        userId: "guest-1",
        scope: "local",
        sourceId: nodeId,
        targetId: "node-2",
      }),
    ];
    const res = resolveNodeDelete(nodeId, ownerCtx({ events }));
    expect(res.entities.edges.remove).toContain(edgeId);
  });

  it("guest nu poate șterge nod creat de owner", () => {
    const nodeId = "node-1";
    const events = [nodeCreate({ nodeId, scope: "global", userId: null })];
    const res = resolveNodeDelete(nodeId, guestCtx("guest-1", { events }));
    expect(res.error).toBeTruthy();
  });

  it("guest nu poate șterge nod revizuit de owner", () => {
    const nodeId = "node-1";
    const events = [
      nodeCreate({ nodeId, userId: "guest-1", scope: "local" }),
      nodeUp({ nodeId, scope: "global", userId: null }),
    ];
    const res = resolveNodeDelete(nodeId, guestCtx("guest-1", { events }));
    expect(res.error).toBeTruthy();
  });

  it("guest nu poate șterge nod creat de alt guest", () => {
    const nodeId = "node-1";
    const events = [nodeCreate({ nodeId, userId: "guest-2", scope: "local" })];
    const res = resolveNodeDelete(nodeId, guestCtx("guest-1", { events }));
    expect(res.error).toBeTruthy();
  });

  it("guest nu poate șterge nod abandonat de el", () => {
    const nodeId = "node-1";
    const events = [nodeAbandon({ nodeId, userId: "guest-1" })];
    const res = resolveNodeDelete(nodeId, guestCtx("guest-1", { events }));
    expect(res.error).toBeTruthy();
  });

  it("guest șterge propriul nod fără reviews — șterge tot", () => {
    const nodeId = "node-1";
    const events = [nodeCreate({ nodeId, userId: "guest-1", scope: "local" })];
    const res = resolveNodeDelete(nodeId, guestCtx("guest-1", { events }));
    expect(res.error).toBeNull();
    expect(res.entities.nodes.remove).toContain(nodeId);
  });

  it("guest șterge propriul nod cu reviews de la alții — abandonează", () => {
    const nodeId = "node-1";
    const events = [
      nodeCreate({ nodeId, userId: "guest-1", scope: "local" }),
      nodeUp({ nodeId, userId: "guest-2", scope: "local" }),
    ];
    const res = resolveNodeDelete(nodeId, guestCtx("guest-1", { events }));
    expect(res.error).toBeNull();
    expect(res.entities.nodes.remove).toHaveLength(0);
    const abandonEvent = res.events.nodes.add.find(
      (e) => e.action === "abandon",
    );
    expect(abandonEvent).toBeTruthy();
    expect(abandonEvent.userId).toBe("guest-1");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// resolveNodeVote
// ─────────────────────────────────────────────────────────────────────────────

describe("resolveNodeVote", () => {
  it("owner dă up pe nod guest — adaugă event global up", () => {
    const nodeId = "node-1";
    const events = [nodeCreate({ nodeId, userId: "guest-1", scope: "local" })];
    const res = resolveNodeVote(
      { nodeId, voteType: "up" },
      ownerCtx({ events }),
    );
    expect(res.error).toBeNull();
    expect(res.events.nodes.add[0]).toMatchObject({
      action: "up",
      scope: "global",
      userId: null,
    });
  });

  it("owner nu poate revizui propriul nod", () => {
    const nodeId = "node-1";
    const events = [nodeCreate({ nodeId, scope: "global", userId: null })];
    const res = resolveNodeVote(
      { nodeId, voteType: "up" },
      ownerCtx({ events }),
    );
    expect(res.error).toBeTruthy();
  });

  it("owner retrage up existent", () => {
    const nodeId = "node-1";
    const upEvent = nodeUp({ nodeId, scope: "global", userId: null });
    const events = [
      nodeCreate({ nodeId, userId: "guest-1", scope: "local" }),
      upEvent,
    ];
    const res = resolveNodeVote(
      { nodeId, voteType: "up" },
      ownerCtx({ events }),
    );
    expect(res.events.nodes.remove).toContain(upEvent.id);
    expect(res.events.nodes.add).toHaveLength(0);
  });

  it("owner schimbă down → up", () => {
    const nodeId = "node-1";
    const downEvent = nodeDown({ nodeId, scope: "global", userId: null });
    const events = [
      nodeCreate({ nodeId, userId: "guest-1", scope: "local" }),
      downEvent,
    ];
    const res = resolveNodeVote(
      { nodeId, voteType: "up" },
      ownerCtx({ events }),
    );
    expect(res.events.nodes.remove).toContain(downEvent.id);
    expect(res.events.nodes.add[0]).toMatchObject({
      action: "up",
      scope: "global",
    });
  });

  it("guest nu poate revizui nod blocat de owner", () => {
    const nodeId = "node-1";
    const events = [
      nodeCreate({ nodeId, userId: "guest-2", scope: "local" }),
      nodeUp({ nodeId, scope: "global", userId: null }),
    ];
    const res = resolveNodeVote(
      { nodeId, voteType: "up" },
      guestCtx("guest-1", { events }),
    );
    expect(res.error).toBeTruthy();
  });

  it("guest nu poate revizui propriul nod", () => {
    const nodeId = "node-1";
    const events = [nodeCreate({ nodeId, userId: "guest-1", scope: "local" })];
    const res = resolveNodeVote(
      { nodeId, voteType: "up" },
      guestCtx("guest-1", { events }),
    );
    expect(res.error).toBeTruthy();
  });

  it("guest dă up pe nod — adaugă event local up", () => {
    const nodeId = "node-1";
    const events = [nodeCreate({ nodeId, userId: "guest-2", scope: "local" })];
    const res = resolveNodeVote(
      { nodeId, voteType: "up" },
      guestCtx("guest-1", { events }),
    );
    expect(res.error).toBeNull();
    expect(res.events.nodes.add[0]).toMatchObject({
      action: "up",
      scope: "local",
      userId: "guest-1",
    });
  });

  it("guest retrage up existent", () => {
    const nodeId = "node-1";
    const upEvent = nodeUp({ nodeId, userId: "guest-1", scope: "local" });
    const events = [
      nodeCreate({ nodeId, userId: "guest-2", scope: "local" }),
      upEvent,
    ];
    const res = resolveNodeVote(
      { nodeId, voteType: "up" },
      guestCtx("guest-1", { events }),
    );
    expect(res.events.nodes.remove).toContain(upEvent.id);
    expect(res.events.nodes.add).toHaveLength(0);
  });

  it("guest retrage up pe nod abandonat fără alte reviews — șterge nodul", () => {
    const nodeId = "node-1";
    const upEvent = nodeUp({ nodeId, userId: "guest-1", scope: "local" });
    const events = [nodeAbandon({ nodeId, userId: "guest-2" }), upEvent];
    const res = resolveNodeVote(
      { nodeId, voteType: "up" },
      guestCtx("guest-1", { events }),
    );
    expect(res.entities.nodes.remove).toContain(nodeId);
  });

  it("owner down pe nod propagă -(0) pe edges adiacente cu +(0)", () => {
    const nodeId = "node-1";
    const edgeId = "edge-1";
    const upEdgeEvent = edgeUp({ edgeId, scope: "global", userId: null });
    const events = [
      nodeCreate({ nodeId, userId: "guest-1", scope: "local" }),
      edgeCreate({
        edgeId,
        userId: null,
        scope: "global",
        sourceId: nodeId,
        targetId: "node-2",
      }),
      upEdgeEvent,
    ];
    const res = resolveNodeVote(
      { nodeId, voteType: "down" },
      ownerCtx({ events }),
    );
    expect(res.events.edges.remove).toContain(upEdgeEvent.id);
    expect(res.events.edges.add[0]).toMatchObject({
      action: "down",
      scope: "global",
      entityId: edgeId,
    });
  });

  it("guest down pe nod propagă -(guest) pe edges adiacente fără opinie owner", () => {
    const nodeId = "node-1";
    const edgeId = "edge-1";
    const events = [
      nodeCreate({ nodeId, userId: "guest-2", scope: "local" }),
      edgeCreate({
        edgeId,
        userId: "guest-2",
        scope: "local",
        sourceId: nodeId,
        targetId: "node-2",
      }),
    ];
    const res = resolveNodeVote(
      { nodeId, voteType: "down" },
      guestCtx("guest-1", { events }),
    );
    expect(
      res.events.edges.add.some(
        (e) => e.entityId === edgeId && e.action === "down",
      ),
    ).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// resolveEdgeCreate
// ─────────────────────────────────────────────────────────────────────────────

describe("resolveEdgeCreate", () => {
  it("returnează eroare dacă source === target", () => {
    const res = resolveEdgeCreate(
      { params: { source: "node-1", target: "node-1" } },
      guestCtx("guest-1", { events: [] }),
    );
    expect(res.error).toBeTruthy();
  });

  it("guest creează edge între noduri pe care le consideră adevărate", () => {
    const events = [
      nodeCreate({ nodeId: "node-1", userId: "guest-1", scope: "local" }),
      nodeCreate({ nodeId: "node-2", userId: "guest-1", scope: "local" }),
    ];
    const res = resolveEdgeCreate(
      { params: { source: "node-1", target: "node-2" } },
      guestCtx("guest-1", { events }),
    );
    expect(res.error).toBeNull();
    expect(res.entities.edges.add).toHaveLength(1);
    expect(res.events.edges.add[0]).toMatchObject({
      action: "create",
      scope: "local",
      userId: "guest-1",
    });
  });

  it("guest nu poate crea edge dacă nu consideră nodul adevărat", () => {
    const events = [
      nodeCreate({ nodeId: "node-1", userId: "guest-2", scope: "local" }),
      nodeCreate({ nodeId: "node-2", userId: "guest-1", scope: "local" }),
    ];
    const res = resolveEdgeCreate(
      { params: { source: "node-1", target: "node-2" } },
      guestCtx("guest-1", { events }),
    );
    expect(res.error).toBeTruthy();
  });

  it("guest creează edge — propagă up pe nodurile unde nu are opinie proprie", () => {
    const events = [
      nodeCreate({ nodeId: "node-1", userId: "guest-2", scope: "local" }),
      nodeUp({ nodeId: "node-1", userId: "guest-1", scope: "local" }),
      nodeCreate({ nodeId: "node-2", userId: "guest-2", scope: "local" }),
      nodeUp({ nodeId: "node-2", userId: null, scope: "global" }), // owner a aprobat
    ];
    const res = resolveEdgeCreate(
      { params: { source: "node-1", target: "node-2" } },
      guestCtx("guest-1", { events }),
    );
    expect(res.error).toBeNull();
    // node-1 are +(guest-1) deja — nu propagă
    // node-2 are +(0) — e adevărat pentru toți, guest-1 nu are opinie proprie dar nu trebuie să propagăm
    const upOnNode2 = res.events.nodes.add.find(
      (e) => e.entityId === "node-2" && e.action === "up",
    );
    expect(upOnNode2).toBeUndefined(); // owner a aprobat deja, nu mai propagăm
  });

  it("owner creează edge — adaugă up implicit pe noduri neaprobate cu confirmare", () => {
    const events = [
      nodeCreate({ nodeId: "node-1", userId: "guest-1", scope: "local" }),
      nodeCreate({ nodeId: "node-2", userId: "guest-2", scope: "local" }),
    ];
    const res = resolveEdgeCreate(
      { params: { source: "node-1", target: "node-2" } },
      ownerCtx({ events }),
    );
    expect(res.requiresConfirm).toBeTruthy();
    expect(
      res.events.nodes.add.some(
        (e) => e.entityId === "node-1" && e.action === "up",
      ),
    ).toBe(true);
    expect(
      res.events.nodes.add.some(
        (e) => e.entityId === "node-2" && e.action === "up",
      ),
    ).toBe(true);
  });

  it("owner creează edge — nu adaugă up pe noduri deja aprobate", () => {
    const events = [
      nodeCreate({ nodeId: "node-1", userId: null, scope: "global" }),
      nodeCreate({ nodeId: "node-2", userId: "guest-1", scope: "local" }),
      nodeUp({ nodeId: "node-2", userId: null, scope: "global" }),
    ];
    const res = resolveEdgeCreate(
      { params: { source: "node-1", target: "node-2" } },
      ownerCtx({ events }),
    );
    expect(res.requiresConfirm).toBeNull();
    expect(res.events.nodes.add).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// resolveEdgeDelete
// ─────────────────────────────────────────────────────────────────────────────

describe("resolveEdgeDelete", () => {
  it("owner șterge edge — șterge edge și toate events", () => {
    const edgeId = "edge-1";
    const events = [
      edgeCreate({
        edgeId,
        userId: "guest-1",
        scope: "local",
        sourceId: "n1",
        targetId: "n2",
      }),
    ];
    const res = resolveEdgeDelete({ edgeId }, ownerCtx({ events }));
    expect(res.error).toBeNull();
    expect(res.entities.edges.remove).toContain(edgeId);
  });

  it("guest nu poate șterge edge blocat de owner", () => {
    const edgeId = "edge-1";
    const events = [
      edgeCreate({
        edgeId,
        userId: null,
        scope: "global",
        sourceId: "n1",
        targetId: "n2",
      }),
    ];
    const res = resolveEdgeDelete({ edgeId }, guestCtx("guest-1", { events }));
    expect(res.error).toBeTruthy();
  });

  it("guest nu poate șterge edge creat de alt guest", () => {
    const edgeId = "edge-1";
    const events = [
      edgeCreate({
        edgeId,
        userId: "guest-2",
        scope: "local",
        sourceId: "n1",
        targetId: "n2",
      }),
    ];
    const res = resolveEdgeDelete({ edgeId }, guestCtx("guest-1", { events }));
    expect(res.error).toBeTruthy();
  });

  it("guest nu poate șterge edge abandonat de el", () => {
    const edgeId = "edge-1";
    const events = [edgeAbandon({ edgeId, userId: "guest-1" })];
    const res = resolveEdgeDelete({ edgeId }, guestCtx("guest-1", { events }));
    expect(res.error).toBeTruthy();
  });

  it("guest șterge propriul edge fără reviews — șterge tot", () => {
    const edgeId = "edge-1";
    const events = [
      edgeCreate({
        edgeId,
        userId: "guest-1",
        scope: "local",
        sourceId: "n1",
        targetId: "n2",
      }),
    ];
    const res = resolveEdgeDelete({ edgeId }, guestCtx("guest-1", { events }));
    expect(res.error).toBeNull();
    expect(res.entities.edges.remove).toContain(edgeId);
  });

  it("guest șterge propriul edge cu reviews de la alții — abandonează", () => {
    const edgeId = "edge-1";
    const createEv = edgeCreate({
      edgeId,
      userId: "guest-1",
      scope: "local",
      sourceId: "n1",
      targetId: "n2",
    });
    const events = [
      createEv,
      edgeUp({ edgeId, userId: "guest-2", scope: "local" }),
    ];
    const res = resolveEdgeDelete({ edgeId }, guestCtx("guest-1", { events }));
    expect(res.error).toBeNull();
    expect(res.entities.edges.remove).toHaveLength(0);
    const abandonEv = res.events.edges.add.find((e) => e.action === "abandon");
    expect(abandonEv).toBeTruthy();
    expect(res.events.edges.remove).toContain(createEv.id);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// resolveEdgeVote
// ─────────────────────────────────────────────────────────────────────────────

describe("resolveEdgeVote", () => {
  it("guest nu poate vota edge blocat de owner", () => {
    const edgeId = "edge-1";
    const events = [
      edgeCreate({
        edgeId,
        userId: null,
        scope: "global",
        sourceId: "n1",
        targetId: "n2",
      }),
      edgeUp({ edgeId, userId: null, scope: "global" }),
    ];
    const res = resolveEdgeVote(
      { edgeId, voteType: "up" },
      guestCtx("guest-1", { events }),
    );
    expect(res.error).toBeTruthy();
  });

  it("guest nu poate vota propriul edge neabandonat", () => {
    const edgeId = "edge-1";
    const events = [
      edgeCreate({
        edgeId,
        userId: "guest-1",
        scope: "local",
        sourceId: "n1",
        targetId: "n2",
      }),
    ];
    const res = resolveEdgeVote(
      { edgeId, voteType: "up" },
      guestCtx("guest-1", { events }),
    );
    expect(res.error).toBeTruthy();
  });

  it("guest dă up pe edge — adaugă event local up", () => {
    const edgeId = "edge-1";
    const events = [
      edgeCreate({
        edgeId,
        userId: "guest-2",
        scope: "local",
        sourceId: "n1",
        targetId: "n2",
      }),
    ];
    const res = resolveEdgeVote(
      { edgeId, voteType: "up" },
      guestCtx("guest-1", { events }),
    );
    expect(res.error).toBeNull();
    expect(res.events.edges.add[0]).toMatchObject({
      action: "up",
      scope: "local",
      userId: "guest-1",
    });
  });

  it("guest dă up pe edge — propagă up pe noduri adiacente unde nu are opinie", () => {
    const edgeId = "edge-1";
    const events = [
      nodeCreate({ nodeId: "n1", userId: "guest-2", scope: "local" }),
      nodeCreate({ nodeId: "n2", userId: "guest-2", scope: "local" }),
      edgeCreate({
        edgeId,
        userId: "guest-2",
        scope: "local",
        sourceId: "n1",
        targetId: "n2",
      }),
    ];
    const res = resolveEdgeVote(
      { edgeId, voteType: "up" },
      guestCtx("guest-1", { events }),
    );
    expect(
      res.events.nodes.add.some(
        (e) => e.entityId === "n1" && e.action === "up",
      ),
    ).toBe(true);
    expect(
      res.events.nodes.add.some(
        (e) => e.entityId === "n2" && e.action === "up",
      ),
    ).toBe(true);
  });

  it("guest retrage up existent pe edge", () => {
    const edgeId = "edge-1";
    const upEv = edgeUp({ edgeId, userId: "guest-1", scope: "local" });
    const events = [
      edgeCreate({
        edgeId,
        userId: "guest-2",
        scope: "local",
        sourceId: "n1",
        targetId: "n2",
      }),
      upEv,
    ];
    const res = resolveEdgeVote(
      { edgeId, voteType: "up" },
      guestCtx("guest-1", { events }),
    );
    expect(res.events.edges.remove).toContain(upEv.id);
    expect(res.events.edges.add).toHaveLength(0);
  });

  it("guest schimbă up → down pe edge", () => {
    const edgeId = "edge-1";
    const upEv = edgeUp({ edgeId, userId: "guest-1", scope: "local" });
    const events = [
      edgeCreate({
        edgeId,
        userId: "guest-2",
        scope: "local",
        sourceId: "n1",
        targetId: "n2",
      }),
      upEv,
    ];
    const res = resolveEdgeVote(
      { edgeId, voteType: "down" },
      guestCtx("guest-1", { events }),
    );
    expect(res.events.edges.remove).toContain(upEv.id);
    expect(res.events.edges.add[0]).toMatchObject({
      action: "down",
      scope: "local",
    });
  });

  it("guest dă down pe edge — nu propagă pe noduri", () => {
    const edgeId = "edge-1";
    const events = [
      edgeCreate({
        edgeId,
        userId: "guest-2",
        scope: "local",
        sourceId: "n1",
        targetId: "n2",
      }),
    ];
    const res = resolveEdgeVote(
      { edgeId, voteType: "down" },
      guestCtx("guest-1", { events }),
    );
    expect(res.events.nodes.add).toHaveLength(0);
    expect(res.events.nodes.remove).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getNodeReviewState
// ─────────────────────────────────────────────────────────────────────────────

describe("getNodeReviewState", () => {
  const ctx = (role, memberId) => ({
    currentMemberId: memberId,
    currentMemberRole: role,
    projectOwnerId: "owner-1",
    getMemberById: () => null,
  });

  it("nod creat de guest — reviewable pentru owner", () => {
    const nodeId = "node-1";
    const events = [nodeCreate({ nodeId, userId: "guest-1", scope: "local" })];
    const rs = getNodeReviewState(nodeId, events, ctx("OWNER", "owner-1"));
    expect(rs.reviewable).toBe(true);
    expect(rs.canReview).toBe(true);
    expect(rs.ownerCreated).toBe(false);
  });

  it("nod creat de owner — nu e reviewable", () => {
    const nodeId = "node-1";
    const events = [nodeCreate({ nodeId, scope: "global", userId: null })];
    const rs = getNodeReviewState(nodeId, events, ctx("OWNER", "owner-1"));
    expect(rs.reviewable).toBe(false);
    expect(rs.ownerCreated).toBe(true);
  });

  it("nod cu up de owner — blocat pentru guests", () => {
    const nodeId = "node-1";
    const events = [
      nodeCreate({ nodeId, userId: "guest-1", scope: "local" }),
      nodeUp({ nodeId, scope: "global", userId: null }),
    ];
    const rs = getNodeReviewState(nodeId, events, ctx("STUDENT", "guest-2"));
    expect(rs.canReview).toBe(false);
    expect(rs.ownerReviewed).toBe(true);
  });

  it("nod abandonat — nu e reviewable pentru creator", () => {
    const nodeId = "node-1";
    const events = [nodeAbandon({ nodeId, userId: "guest-1" })];
    const rs = getNodeReviewState(nodeId, events, ctx("STUDENT", "guest-1"));
    expect(rs.reviewable).toBe(false);
    expect(rs.currentAbandoned).toBe(true);
  });

  it("canDelete — owner poate oricând", () => {
    const nodeId = "node-1";
    const events = [nodeCreate({ nodeId, userId: "guest-1", scope: "local" })];
    const rs = getNodeReviewState(nodeId, events, ctx("OWNER", "owner-1"));
    expect(rs.canDelete).toBe(true);
  });

  it("canDelete — guest poate dacă e creator și fără review owner", () => {
    const nodeId = "node-1";
    const events = [nodeCreate({ nodeId, userId: "guest-1", scope: "local" })];
    const rs = getNodeReviewState(nodeId, events, ctx("STUDENT", "guest-1"));
    expect(rs.canDelete).toBe(true);
  });

  it("canDelete — guest nu poate dacă owner a dat up", () => {
    const nodeId = "node-1";
    const events = [
      nodeCreate({ nodeId, userId: "guest-1", scope: "local" }),
      nodeUp({ nodeId, scope: "global", userId: null }),
    ];
    const rs = getNodeReviewState(nodeId, events, ctx("STUDENT", "guest-1"));
    expect(rs.canDelete).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getEdgeReviewState
// ─────────────────────────────────────────────────────────────────────────────

describe("getEdgeReviewState", () => {
  const ctx = (role, memberId) => ({
    currentMemberId: memberId,
    currentMemberRole: role,
    projectOwnerId: "owner-1",
    getMemberById: () => null,
  });

  it("edge creat de guest — reviewable pentru owner", () => {
    const edgeId = "edge-1";
    const events = [
      edgeCreate({
        edgeId,
        userId: "guest-1",
        scope: "local",
        sourceId: "n1",
        targetId: "n2",
      }),
    ];
    const rs = getEdgeReviewState(edgeId, events, ctx("OWNER", "owner-1"));
    expect(rs.reviewable).toBe(true);
    expect(rs.canReview).toBe(true);
    expect(rs.ownerCreated).toBe(false);
  });

  it("edge creat de owner — nu e reviewable", () => {
    const edgeId = "edge-1";
    const events = [
      edgeCreate({
        edgeId,
        userId: null,
        scope: "global",
        sourceId: "n1",
        targetId: "n2",
      }),
    ];
    const rs = getEdgeReviewState(edgeId, events, ctx("OWNER", "owner-1"));
    expect(rs.reviewable).toBe(false);
    expect(rs.ownerCreated).toBe(true);
  });

  it("edge cu up de owner — blocat pentru guests", () => {
    const edgeId = "edge-1";
    const events = [
      edgeCreate({
        edgeId,
        userId: "guest-1",
        scope: "local",
        sourceId: "n1",
        targetId: "n2",
      }),
      edgeUp({ edgeId, scope: "global", userId: null }),
    ];
    const rs = getEdgeReviewState(edgeId, events, ctx("STUDENT", "guest-2"));
    expect(rs.canReview).toBe(false);
    expect(rs.ownerReviewed).toBe(true);
  });

  it("edge cu down de owner — blocat pentru guests", () => {
    const edgeId = "edge-1";
    const events = [
      edgeCreate({
        edgeId,
        userId: "guest-1",
        scope: "local",
        sourceId: "n1",
        targetId: "n2",
      }),
      edgeDown({ edgeId, scope: "global", userId: null }),
    ];
    const rs = getEdgeReviewState(edgeId, events, ctx("STUDENT", "guest-2"));
    expect(rs.canReview).toBe(false);
    expect(rs.ownerDowned).toBe(true);
  });

  it("edge abandonat — nu e reviewable pentru creator", () => {
    const edgeId = "edge-1";
    const events = [edgeAbandon({ edgeId, userId: "guest-1" })];
    const rs = getEdgeReviewState(edgeId, events, ctx("STUDENT", "guest-1"));
    expect(rs.reviewable).toBe(false);
    expect(rs.currentAbandoned).toBe(true);
  });

  it("currentUpped și currentDowned reflectă corect starea actorului", () => {
    const edgeId = "edge-1";
    const events = [
      edgeCreate({
        edgeId,
        userId: "guest-2",
        scope: "local",
        sourceId: "n1",
        targetId: "n2",
      }),
      edgeUp({ edgeId, userId: "guest-1", scope: "local" }),
    ];
    const rs = getEdgeReviewState(edgeId, events, ctx("STUDENT", "guest-1"));
    expect(rs.currentUpped).toBe(true);
    expect(rs.currentDowned).toBe(false);
  });

  it("upCount și downCount numără corect reviews locale", () => {
    const edgeId = "edge-1";
    const events = [
      edgeCreate({
        edgeId,
        userId: "guest-3",
        scope: "local",
        sourceId: "n1",
        targetId: "n2",
      }),
      edgeUp({ edgeId, userId: "guest-1", scope: "local" }),
      edgeUp({ edgeId, userId: "guest-2", scope: "local" }),
      edgeDown({ edgeId, userId: "guest-4", scope: "local" }),
    ];
    const rs = getEdgeReviewState(edgeId, events, ctx("STUDENT", "guest-1"));
    expect(rs.upCount).toBe(2);
    expect(rs.downCount).toBe(1);
  });

  it("canDelete — owner poate oricând", () => {
    const edgeId = "edge-1";
    const events = [
      edgeCreate({
        edgeId,
        userId: "guest-1",
        scope: "local",
        sourceId: "n1",
        targetId: "n2",
      }),
    ];
    const rs = getEdgeReviewState(edgeId, events, ctx("OWNER", "owner-1"));
    expect(rs.canDelete).toBe(true);
  });

  it("canDelete — guest creator fără review owner", () => {
    const edgeId = "edge-1";
    const events = [
      edgeCreate({
        edgeId,
        userId: "guest-1",
        scope: "local",
        sourceId: "n1",
        targetId: "n2",
      }),
    ];
    const rs = getEdgeReviewState(edgeId, events, ctx("STUDENT", "guest-1"));
    expect(rs.canDelete).toBe(true);
  });

  it("canDelete — guest creator cu review owner — nu poate", () => {
    const edgeId = "edge-1";
    const events = [
      edgeCreate({
        edgeId,
        userId: "guest-1",
        scope: "local",
        sourceId: "n1",
        targetId: "n2",
      }),
      edgeUp({ edgeId, scope: "global", userId: null }),
    ];
    const rs = getEdgeReviewState(edgeId, events, ctx("STUDENT", "guest-1"));
    expect(rs.canDelete).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// resolveNodeDelete — cazuri complexe cu edges
// ─────────────────────────────────────────────────────────────────────────────

describe("resolveNodeDelete — edges complexe", () => {
  it("guest abandonează nod — edge creat de el cu reviews de la alții → edge abandonat", () => {
    const nodeId = "node-1";
    const edgeId = "edge-1";
    const createEdgeEv = edgeCreate({
      edgeId,
      userId: "guest-1",
      scope: "local",
      sourceId: nodeId,
      targetId: "node-2",
    });
    const events = [
      nodeCreate({ nodeId, userId: "guest-1", scope: "local" }),
      nodeUp({ nodeId, userId: "guest-2", scope: "local" }),
      createEdgeEv,
      edgeUp({ edgeId, userId: "guest-2", scope: "local" }),
    ];
    const res = resolveNodeDelete(nodeId, {
      events,
      currentMemberId: "guest-1",
      currentMemberRole: "STUDENT",
      projectOwnerId: "owner-1",
    });
    expect(res.error).toBeNull();
    const abandonEdge = res.events.edges.add.find(
      (e) => e.action === "abandon" && e.entityId === edgeId,
    );
    expect(abandonEdge).toBeTruthy();
    expect(res.events.edges.remove).toContain(createEdgeEv.id);
  });

  it("guest abandonează nod — edge creat de el fără reviews → edge șters", () => {
    const nodeId = "node-1";
    const edgeId = "edge-1";
    const createEdgeEv = edgeCreate({
      edgeId,
      userId: "guest-1",
      scope: "local",
      sourceId: nodeId,
      targetId: "node-2",
    });
    const events = [
      nodeCreate({ nodeId, userId: "guest-1", scope: "local" }),
      nodeUp({ nodeId, userId: "guest-2", scope: "local" }),
      createEdgeEv,
    ];
    const res = resolveNodeDelete(nodeId, {
      events,
      currentMemberId: "guest-1",
      currentMemberRole: "STUDENT",
      projectOwnerId: "owner-1",
    });
    expect(res.error).toBeNull();
    expect(res.entities.edges.remove).toContain(edgeId);
    expect(
      res.events.edges.add.find((e) => e.action === "abandon"),
    ).toBeUndefined();
  });

  it("guest abandonează nod — edge cu owner create → eroare", () => {
    const nodeId = "node-1";
    const edgeId = "edge-1";
    const events = [
      nodeCreate({ nodeId, userId: "guest-1", scope: "local" }),
      nodeUp({ nodeId, userId: "guest-2", scope: "local" }),
      edgeCreate({
        edgeId,
        userId: null,
        scope: "global",
        sourceId: nodeId,
        targetId: "node-2",
      }),
    ];
    const res = resolveNodeDelete(nodeId, {
      events,
      currentMemberId: "guest-1",
      currentMemberRole: "STUDENT",
      projectOwnerId: "owner-1",
    });
    expect(res.error).toBeTruthy();
  });

  it("guest abandonează nod — edge cu owner review → eroare", () => {
    const nodeId = "node-1";
    const edgeId = "edge-1";
    const events = [
      nodeCreate({ nodeId, userId: "guest-1", scope: "local" }),
      nodeUp({ nodeId, userId: "guest-2", scope: "local" }),
      edgeCreate({
        edgeId,
        userId: "guest-2",
        scope: "local",
        sourceId: nodeId,
        targetId: "node-2",
      }),
      edgeUp({ edgeId, userId: null, scope: "global" }),
    ];
    const res = resolveNodeDelete(nodeId, {
      events,
      currentMemberId: "guest-1",
      currentMemberRole: "STUDENT",
      projectOwnerId: "owner-1",
    });
    expect(res.error).toBeTruthy();
  });

  it("guest abandonează nod — edge creat de alt guest, actorul are review → ștergem review actor", () => {
    const nodeId = "node-1";
    const edgeId = "edge-1";
    const actorUpEdge = edgeUp({ edgeId, userId: "guest-1", scope: "local" });
    const events = [
      nodeCreate({ nodeId, userId: "guest-1", scope: "local" }),
      nodeUp({ nodeId, userId: "guest-2", scope: "local" }),
      edgeCreate({
        edgeId,
        userId: "guest-2",
        scope: "local",
        sourceId: nodeId,
        targetId: "node-2",
      }),
      actorUpEdge,
    ];
    const res = resolveNodeDelete(nodeId, {
      events,
      currentMemberId: "guest-1",
      currentMemberRole: "STUDENT",
      projectOwnerId: "owner-1",
    });
    expect(res.error).toBeNull();
    expect(res.events.edges.remove).toContain(actorUpEdge.id);
    expect(res.entities.edges.remove).not.toContain(edgeId);
  });

  it("guest abandonează nod — edge creat de alt guest, actorul fără review → nu facem nimic pe edge", () => {
    const nodeId = "node-1";
    const edgeId = "edge-1";
    const events = [
      nodeCreate({ nodeId, userId: "guest-1", scope: "local" }),
      nodeUp({ nodeId, userId: "guest-2", scope: "local" }),
      edgeCreate({
        edgeId,
        userId: "guest-2",
        scope: "local",
        sourceId: nodeId,
        targetId: "node-2",
      }),
    ];
    const res = resolveNodeDelete(nodeId, {
      events,
      currentMemberId: "guest-1",
      currentMemberRole: "STUDENT",
      projectOwnerId: "owner-1",
    });
    expect(res.error).toBeNull();
    expect(res.entities.edges.remove).not.toContain(edgeId);
    expect(res.events.edges.remove).toHaveLength(0);
    expect(res.events.edges.add).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARII END-TO-END CRONOLOGICE
// Simulează secvențe de acțiuni ca în aplicație
// ─────────────────────────────────────────────────────────────────────────────

describe("scenarii end-to-end", () => {
  // Helper: aplică o resolution pe un array de events (simulează executeResolution)
  function applyResolution(events, resolution) {
    const toRemove = new Set([
      ...resolution.events.nodes.remove,
      ...resolution.events.edges.remove,
    ]);
    const remaining = events.filter((e) => !toRemove.has(e.id));
    return [
      ...remaining,
      ...resolution.events.nodes.add.map((e) => ({
        id: makeId(),
        createdAt: Date.now(),
        ...e,
      })),
      ...resolution.events.edges.add.map((e) => ({
        id: makeId(),
        createdAt: Date.now(),
        ...e,
      })),
    ];
  }

  it("flux complet: guest creează nod → owner aprobă → guest nu mai poate șterge", () => {
    const nodeId = "node-1";
    let events = [];

    // guest creează nod
    const gCtx = {
      currentMemberId: "guest-1",
      currentMemberRole: "STUDENT",
      projectOwnerId: "owner-1",
      getMemberById: () => null,
      nodes: [],
      events,
    };
    const addRes = resolveNodeAdd({ position: { x: 0, y: 0 } }, gCtx);
    const createdNodeId = addRes.entities.nodes.add[0].id;
    events = applyResolution(events, addRes);

    // owner aprobă
    const oCtx = {
      ...gCtx,
      currentMemberId: "owner-1",
      currentMemberRole: "OWNER",
      events,
    };
    const upRes = resolveNodeVote(
      { nodeId: createdNodeId, voteType: "up" },
      oCtx,
    );
    events = applyResolution(events, upRes);

    // guest încearcă să șteargă
    const delRes = resolveNodeDelete(createdNodeId, { ...gCtx, events });
    expect(delRes.error).toBeTruthy();
  });

  it("flux complet: guest creează nod → alt guest dă up → primul guest abandonează", () => {
    const nodeId = "node-1";
    let events = [
      nodeCreate({ nodeId, userId: "guest-1", scope: "local" }),
      nodeUp({ nodeId, userId: "guest-2", scope: "local" }),
    ];

    const ctx = {
      currentMemberId: "guest-1",
      currentMemberRole: "STUDENT",
      projectOwnerId: "owner-1",
      getMemberById: () => null,
      events,
    };
    const res = resolveNodeDelete(nodeId, ctx);

    expect(res.error).toBeNull();
    events = applyResolution(events, res);

    // nodul trebuie să aibă abandon event
    const abandonEv = events.find(
      (e) =>
        e.entityType === "node" &&
        e.entityId === nodeId &&
        e.action === "abandon",
    );
    expect(abandonEv).toBeTruthy();

    // create event trebuie șters
    const createEv = events.find(
      (e) =>
        e.entityType === "node" &&
        e.entityId === nodeId &&
        e.action === "create",
    );
    expect(createEv).toBeUndefined();
  });

  it("flux complet: nod abandonat dispare când ultimul reviewer retrage up-ul", () => {
    const nodeId = "node-1";
    const upEvent = nodeUp({ nodeId, userId: "guest-2", scope: "local" });
    let events = [nodeAbandon({ nodeId, userId: "guest-1" }), upEvent];

    const ctx = {
      currentMemberId: "guest-2",
      currentMemberRole: "STUDENT",
      projectOwnerId: "owner-1",
      getMemberById: () => null,
      events,
    };
    const res = resolveNodeVote({ nodeId, voteType: "up" }, ctx); // retrage up

    expect(res.entities.nodes.remove).toContain(nodeId);
    events = applyResolution(events, res);

    const remainingNodeEvents = events.filter(
      (e) => e.entityType === "node" && e.entityId === nodeId,
    );
    expect(remainingNodeEvents).toHaveLength(0);
  });

  it("flux complet: guest creează edge → alt guest dă up pe edge → primul guest șterge edge → abandon", () => {
    const edgeId = "edge-1";
    const createEv = edgeCreate({
      edgeId,
      userId: "guest-1",
      scope: "local",
      sourceId: "n1",
      targetId: "n2",
    });
    let events = [
      createEv,
      edgeUp({ edgeId, userId: "guest-2", scope: "local" }),
    ];

    const ctx = {
      currentMemberId: "guest-1",
      currentMemberRole: "STUDENT",
      projectOwnerId: "owner-1",
      getMemberById: () => null,
      events,
    };
    const res = resolveEdgeDelete({ edgeId }, ctx);

    expect(res.error).toBeNull();
    events = applyResolution(events, res);

    const abandonEv = events.find(
      (e) =>
        e.entityType === "edge" &&
        e.entityId === edgeId &&
        e.action === "abandon",
    );
    expect(abandonEv).toBeTruthy();

    const remainingCreate = events.find(
      (e) =>
        e.entityType === "edge" &&
        e.entityId === edgeId &&
        e.action === "create",
    );
    expect(remainingCreate).toBeUndefined();
  });

  it("flux complet: owner creează edge → aprobă implicit nodurile guest adiacente", () => {
    const n1 = "node-1";
    const n2 = "node-2";
    let events = [
      nodeCreate({ nodeId: n1, userId: "guest-1", scope: "local" }),
      nodeCreate({ nodeId: n2, userId: "guest-2", scope: "local" }),
    ];

    const ctx = {
      currentMemberId: "owner-1",
      currentMemberRole: "OWNER",
      projectOwnerId: "owner-1",
      getMemberById: () => null,
      events,
    };
    const res = resolveEdgeCreate({ params: { source: n1, target: n2 } }, ctx);

    expect(res.requiresConfirm).toBeTruthy();
    expect(
      res.events.nodes.add.some((e) => e.entityId === n1 && e.action === "up"),
    ).toBe(true);
    expect(
      res.events.nodes.add.some((e) => e.entityId === n2 && e.action === "up"),
    ).toBe(true);

    events = applyResolution(events, res);

    const n1Approved = events.some(
      (e) =>
        e.entityType === "node" &&
        e.entityId === n1 &&
        e.action === "up" &&
        e.scope === "global",
    );
    const n2Approved = events.some(
      (e) =>
        e.entityType === "node" &&
        e.entityId === n2 &&
        e.action === "up" &&
        e.scope === "global",
    );
    expect(n1Approved).toBe(true);
    expect(n2Approved).toBe(true);
  });

  it("flux complet: guest dă down pe nod → edge creat de el se abandonează → retrage down → edge rămâne abandonat", () => {
    const nodeId = "node-1";
    const edgeId = "edge-1";
    const createEdgeEv = edgeCreate({
      edgeId,
      userId: "guest-1",
      scope: "local",
      sourceId: nodeId,
      targetId: "node-2",
    });
    let events = [
      nodeCreate({ nodeId, userId: "guest-2", scope: "local" }),
      createEdgeEv,
    ];

    const ctx = (evs) => ({
      currentMemberId: "guest-1",
      currentMemberRole: "STUDENT",
      projectOwnerId: "owner-1",
      getMemberById: () => null,
      events: evs,
    });

    // guest-1 dă down pe nod
    const downRes = resolveNodeVote({ nodeId, voteType: "down" }, ctx(events));
    expect(downRes.error).toBeNull();
    events = applyResolution(events, downRes);

    // edge trebuie abandonat
    const abandonEv = events.find(
      (e) =>
        e.entityType === "edge" &&
        e.entityId === edgeId &&
        e.action === "abandon",
    );
    expect(abandonEv).toBeTruthy();

    // guest-1 retrage down de pe nod
    const retryRes = resolveNodeVote({ nodeId, voteType: "down" }, ctx(events));
    events = applyResolution(events, retryRes);

    // edge rămâne abandonat — down nu se retrage de pe edge la retragerea down de pe nod
    const abandonStillThere = events.find(
      (e) =>
        e.entityType === "edge" &&
        e.entityId === edgeId &&
        e.action === "abandon",
    );
    expect(abandonStillThere).toBeTruthy();
  });
  it("guest retrage up pe edge abandonat fără alte reviews — șterge edge", () => {
    const edgeId = "edge-1";
    const upEv = edgeUp({ edgeId, userId: "guest-1", scope: "local" });
    const events = [edgeAbandon({ edgeId, userId: "guest-2" }), upEv];
    const res = resolveEdgeVote(
      { edgeId, voteType: "up" },
      guestCtx("guest-1", { events }),
    );
    expect(res.entities.edges.remove).toContain(edgeId);
  });
});
