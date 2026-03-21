import { Server } from "@hocuspocus/server";
import * as Y from "yjs";
import pool  from "../db/pool.js";

export async function onLoadDocument({ documentName, document }) {
  const result = await pool.query(
    "SELECT state FROM projects WHERE id = $1",
    [documentName]
  );

  if (!result.rows.length || !result.rows[0].state) {
    return;
  }

  const update = new Uint8Array(result.rows[0].state);
  Y.applyUpdate(document, update);
}

export async function onStoreDocument({ documentName, document }) {
  const update = Y.encodeStateAsUpdate(document);

  await pool.query(
    "UPDATE projects SET state = $2 WHERE id = $1",
    [documentName, Buffer.from(update)]
  );
}

export function createCollabServer() {
  return new Server({
    port: Number(process.env.HOCUSPOCUS_PORT || 1234),
    onLoadDocument,
    onStoreDocument,
  });
}


// export async function getProjectById(req, res) {
//   const { id } = req.params;
//   const result = await pool.query(
//     "SELECT id, name, class_id, owner_id, created_at FROM projects WHERE id = $1",
//     [id]
//   );

//   if (!result.rows.length) {
//     return res.status(404).json({ message: "Project not found" });
//   }

//   res.json(result.rows[0]);
// }

// export async function onLoadDocument({ documentName, document }) {
//   const result = await pool.query(
//     "SELECT state FROM projects WHERE id = $1",
//     [documentName]
//   );

//   if (!result.rows.length || !result.rows[0].state) {
//     return;
//   }

//   const update = new Uint8Array(result.rows[0].state);
//   Y.applyUpdate(document, update);
// }

// export async function onStoreDocument({ documentName, document }) {
//   const update = Y.encodeStateAsUpdate(document);

//   await pool.query(
//     "UPDATE projects SET state = $2 WHERE id = $1",
//     [documentName, Buffer.from(update)]
//   );
// }