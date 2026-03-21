import { useEffect, useState } from "react";
import { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";

export function useHocuspocusProvider({ projectId, user }) {
  const [provider, setProvider] = useState(null);
  const [nodesMap, setNodesMap] = useState(null);
  const [edgesMap, setEdgesMap] = useState(null);
  const [eventsArray, setEventsArray] = useState(null);
  // const [userName, setUserName] = useState("");
  // const [usersMap, setUsersMap] = useState(null);

  useEffect(() => {
    if (!projectId) return;

    const ydoc = new Y.Doc();

    const nextProvider = new HocuspocusProvider({
      url: "ws://127.0.0.1:1234",
      name: projectId,
      document: ydoc,
    });

    // const nextUsersMap = ydoc.getMap("users");
    const nextNodesMap = ydoc.getMap("nodes");
    const nextEdgesMap = ydoc.getMap("edges");
    const nextEventsArray = ydoc.getArray("events");

    // setUsersMap(nextUsersMap);
    setProvider(nextProvider);
    setNodesMap(nextNodesMap);
    setEdgesMap(nextEdgesMap);
    setEventsArray(nextEventsArray);
    // setUserName(user?.name || "Anonymous");

    nextProvider.setAwarenessField("userMetadata", {
      userName: user?.name || "Anonymous",
      userId: user?.id || null,
    });

    return () => {
      nextProvider.destroy();
      ydoc.destroy();
    };
  }, [projectId, user?.id]);

  return {
    provider,
    nodesMap,
    edgesMap,
    eventsArray,
    // userName,
    // usersMap,
  };
}
