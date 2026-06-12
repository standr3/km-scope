import "dotenv/config";
import { createCollabServer } from "./collab/hocuspocus.js";

const collabServer = createCollabServer();

collabServer.listen();

console.log(
  `[hocuspocus] listening on port ${process.env.PORT || process.env.HOCUSPOCUS_PORT || 1234}`,
);