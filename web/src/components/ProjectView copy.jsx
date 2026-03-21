  import "./App.css";
  import "@xyflow/react/dist/style.css";
  import {
    addEdge,
    applyEdgeChanges,
    applyNodeChanges,
    Background,
    Controls,
    MiniMap,
    ReactFlow,
    useReactFlow,

  } from "@xyflow/react";
  import { useCallback, useEffect, useState, useRef, useMemo, use } from "react";
  // import { getNewNodeData } from "./utils/get-new-node-data";
  import { useHocuspocusProvider } from "../hooks/useHocuspocusProvider.js";
  import { useAuth } from "../context/AuthContext";
  import CustomNode from "./CustomNode";
  import CustomEdge from "./CustomEdge";
  import EventsPanel from "./EventsPanel";

  import { useProjectUsers } from "../context/ProjectUsersContext";


  const createEvent = (data) => ({
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    ...data,
  });


  const nodeTypes = { custom: CustomNode };
  const edgeTypes = { custom: CustomEdge };


  const Cursor = ({ cursorPosition, userName, role }) => {
    // console.log(userName)
    let displayedName = userName;
    if (userName === "tests1") {
      displayedName = 'Student 1';
    } else if (userName === "tests2") {
      displayedName = 'Student 2';
    } else if (userName === "testt1") {
      displayedName = 'Teacher';
    }
    return (
      <div
        className="cursor"
        style={{ top: cursorPosition.y - 60, left: cursorPosition.x - 260 }}
      >
        <div className={`pointer ${role === "OWNER" && "pointer-owner"}`}></div>
        <div className="name-badge">{displayedName}</div>
      </div>
    );
  };



  export default function ProjectView({ projectRole, ...props }) {

    // ─── Auth & project context ───────────────────────────────────────────────
    const { user } = useAuth();
    const { getMemberById, projectOwnerId } = useProjectUsers();

    const currentMemberId = user?.id;
    const currentMemberName = user?.name;
    const currentMemberRole = getMemberById(user?.id)?.role;

    // ─── Yjs / realtime ───────────────────────────────────────────────────────
    const {
      provider,
      nodesMap: yNodes,
      edgesMap: yEdges,
      eventsArray: yEvents
    } = useHocuspocusProvider({ projectId: props.project.id, user });

    const { screenToFlowPosition, flowToScreenPosition } = useReactFlow();

    // ─── Yjs → React state ────────────────────────────────────────────────────
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [events, setEvents] = useState([]);

    // ─── UI state ─────────────────────────────────────────────────────────────
    const [awareness, setAwareness] = useState([]);
    const [isEventsOpen, setIsEventsOpen] = useState(false);







    function getNodeReviewState(nodeId, events) {

      // console.log(nodeId)
      // console.log(events[0].entityId, typeof events)

      const nodeEvents = events.filter(
        (e) => e.entityType === "node" && e.entityId === nodeId
      );
      // console.log(nodeEvents)
      // action:"create"
      // createdAt:1773942377517
      // entityId:"731af937-4881-420b-b6d4-45b2d8e98cbf"
      // entityType:"node"
      // id:"68ae8e08-0698-4d36-a88e-3b86adbd89d5"
      // scope:"global"
      // userId:null

      const ownerCreated = nodeEvents.some((e) => e.action === "create" && e.scope === "global");
      // console.log({ ownerCreated })
      const ownerUpped = nodeEvents.some((e) => e.action === "up" && e.scope === "global");
      // console.log({ ownerUpped })
      const ownerDowned = nodeEvents.some((e) => e.action === "down" && e.scope === "global");

      const currentCreated =
        currentMemberRole === "OWNER" ?
          ownerCreated :
          nodeEvents.some((e) => e.action === "create" && e.userId === currentMemberId);
      const currentUpped =
        currentMemberRole === "OWNER" ?
          ownerUpped :
          nodeEvents.some((e) => e.action === "up" && e.userId === currentMemberId);
      const currentDowned =
        currentMemberRole === "OWNER" ?
          ownerDowned :
          nodeEvents.some((e) => e.action === "down" && e.userId === currentMemberId);

      const upCounterForNodeId = nodeEvents.filter((e) => e.action === "up" && e.scope === "local").length;
      const downCounterForNodeId = nodeEvents.filter((e) => e.action === "down" && e.scope === "local").length;

      let reviewable = true;
      let canReview = false;

      if (ownerCreated || currentCreated) {
        reviewable = false;
      } else {
        if (currentMemberRole === "OWNER") {
          canReview = true;
        } else {
          canReview = !ownerUpped && !ownerDowned;
        }
      }

      const creatorId =
        ownerCreated ?
          projectOwnerId :
          nodeEvents.find((e) => e.action === "create" && e.scope === "local")?.userId || "creator_id_missing";
      // console.log({ projectOwnerId })
      let displayedCreatorName = getMemberById(creatorId)?.name || "creator_name_missing";
      // console.log({ displayedCreatorName })
      // console.log({ users })

      const dbgNameOverwrite = (userId = "", userName = "") => {
        // console.log("dbgNameOverwrite", userId, userName)
        if (userId === projectOwnerId) {
          return "o";
        } else if (userName === "tests1") {
          return '1';
        } else if (userName === "tests2") {
          return '2';
        } else {
          return '_';
        }
      }


      const creatorName = dbgNameOverwrite(creatorId, displayedCreatorName);
      // console.log({ creatorName })

      const usersNameUppedArray =
        nodeEvents
          .filter((e) => e.action === "up")
          .map((e) => dbgNameOverwrite(e.userId || projectOwnerId, getMemberById(e.userId)?.name || "missing_name"));
      const usersNameDownedArray =
        nodeEvents
          .filter((e) => e.action === "down")
          .map((e) => dbgNameOverwrite(e.userId || projectOwnerId, getMemberById(e.userId)?.name || "missing_name"));


      const canDelete = currentMemberRole === "OWNER" || (currentCreated && !ownerUpped && !ownerDowned);

      return {
        creatorId,
        creatorName,
        ownerCreated,
        ownerUpped,
        ownerDowned,
        ownerReviewed: ownerUpped || ownerDowned,
        currentCreated,
        currentUpped,
        currentDowned,
        currentReviewed: currentUpped || currentDowned,
        upCount: upCounterForNodeId,
        usersNameUppedArray,
        downCount: downCounterForNodeId,
        usersNameDownedArray,

        reviewable,
        canReview,
        canDelete
      };
    }

    function getEdgeReviewState(edgeId, events) {

      const edgeEvents = events.filter(
        (e) => e.entityType === "edge" && e.entityId === edgeId
      );

      const ownerCreated = edgeEvents.some((e) => e.action === "create" && e.scope === "global");
      const ownerUpped = edgeEvents.some((e) => e.action === "up" && e.scope === "global");
      const ownerDowned = edgeEvents.some((e) => e.action === "down" && e.scope === "global");
      const currentCreated =
        currentMemberRole === "OWNER" ?
          ownerCreated :
          edgeEvents.some((e) => e.action === "create" && e.userId === currentMemberId);
      const currentUpped =
        currentMemberRole === "OWNER" ?
          ownerUpped :
          edgeEvents.some((e) => e.action === "up" && e.userId === currentMemberId);
      const currentDowned =
        currentMemberRole === "OWNER" ?
          ownerDowned :
          edgeEvents.some((e) => e.action === "down" && e.userId === currentMemberId);


      const upCounterForNodeId = edgeEvents.filter((e) => e.action === "up" && e.scope === "local").length;
      const downCounterForNodeId = edgeEvents.filter((e) => e.action === "down" && e.scope === "local").length;

      let reviewable = true;
      let canReview = false;

      if (ownerCreated || currentCreated) {
        reviewable = false;
      } else {
        if (currentMemberRole === "OWNER") {
          canReview = true;
        } else {
          canReview = !ownerUpped && !ownerDowned;
        }
      }
      const creatorId =
        ownerCreated ?
          projectOwnerId :
          edgeEvents.find((e) => e.action === "create" && e.scope === "local")?.userId || "creator_id_missing";
      let displayedCreatorName = getMemberById(creatorId)?.name || "creator_name_missing";

      const dbgNameOverwrite = (userId = "", userName = "") => {
        // console.log("dbgNameOverwrite", userId, userName)
        if (userId === projectOwnerId) {
          return "o";
        } else if (userName === "tests1") {
          return '1';
        } else if (userName === "tests2") {
          return '2';
        } else {
          return '_';
        }
      }
      const creatorName = dbgNameOverwrite(creatorId, displayedCreatorName);

      const usersNameUppedArray =
        edgeEvents
          .filter((e) => e.action === "up")
          .map((e) => dbgNameOverwrite(e.userId || projectOwnerId, getMemberById(e.userId)?.name || "missing_name"));
      const usersNameDownedArray =
        edgeEvents
          .filter((e) => e.action === "down")
          .map((e) => dbgNameOverwrite(e.userId || projectOwnerId, getMemberById(e.userId)?.name || "missing_name"));


      const canDelete = currentMemberRole === "OWNER" || (currentCreated && !ownerUpped && !ownerDowned);

      return {
        creatorId,
        creatorName,
        ownerCreated,
        ownerUpped,
        ownerDowned,
        ownerReviewed: ownerUpped || ownerDowned,
        currentCreated,
        currentUpped,
        currentDowned,
        currentReviewed: currentUpped || currentDowned,
        upCount: upCounterForNodeId,
        usersNameUppedArray,
        downCount: downCounterForNodeId,
        usersNameDownedArray,

        reviewable,
        canReview,
        canDelete
      };
    }

    //yevents format type
    // [{
    //   id: string;
    //   createdAt: number;
    //   entityType: "node" | "edge";
    //   entityId: string;
    //   action: "create" | "up" | "down";
    //   scope: "local" | "global";
    //   userId: string | null;
    //   sourceId?: string; // doar pentru edge
    //   targetId?: string; // doar pentru edge
    // }]

    //reviewState format:
    // {
    //   creatorId: string;
    //   creatorName: string;
    //   ownerCreated: boolean;
    //   ownerUpped: boolean;
    //   ownerDowned: boolean;
    //   ownerReviewed: boolean;
    //   currentCreated: boolean;
    //   currentUpped: boolean;
    //   currentDowned: boolean;
    //   currentReviewed: boolean;
    //   upCount: number;
    //   usersNameUppedArray: string[];
    //   downCount: number;
    //   usersNameDownedArray: string[];
    //   reviewable: boolean;
    //   canReview: boolean;
    //   canDelete: boolean;
    // }
    
    function resolveNodeReviewAction({ reviewState, voteType }) {

      

      if (currentMemberRole === "OWNER") {
        if (reviewState.ownerCreated) {
          return { error: "Cannot review own node" };
        }

        if (voteType === "up") {
          if (reviewState.ownerUpped) {
            // ownerUpped
            // console.log("ownerUpped")
            return { remove: [{ action: "up", scope: "global" }] };
          }

          if (reviewState.ownerDowned) {
            return {
              remove: [{ action: "down", scope: "global" }],
              add: [{ action: "up", scope: "global" }],
            };
          }

          return { add: [{ action: "up", scope: "global" }] };
        }

        if (voteType === "down") {
          if (reviewState.ownerDowned) {
            return { remove: [{ action: "down", scope: "global" }] };
          }

          if (reviewState.ownerUpped) {
            return {
              remove: [{ action: "up", scope: "global" }],
              add: [{ action: "down", scope: "global" }],
            };
          }


            const res = { add: [], remove: [], error: null  };

          //check if has edges events
          const adjacentEdges = yEvents.toArray().filter((e) => {
            return (e.entityType === "edge" &&
              (
                e.source === reviewState.nodeId ||
                e.target === reviewState.nodeId
              ));
          });
          //CHEKING previous global activity on adjacent edges
          //error if global create events on edges

          console.log("owner downed")
          if (adjacentEdges.length > 0) {
            const globallyAffectedEdgesIdsSet = new Set(
              adjacentEdges.filter((e) =>
                e.scope === "global" && e.action !== "create"
              ).map((e) => e.entityId)
            )

            if (adjacentEdges.filter((e) =>
              e.action === "create" && e.scope === "global"
            ).length > 0) {
              res.error = "Cannot down node with globally created adjacent edges";
            }

            //find global upped edges events for deletion <set of edgeIds>
            const globalUppedEdgesIdsSet = new Set(
              adjacentEdges.filter((e) =>
                e.action === "up" && e.scope === "global"
              
              ).map((e) => e.entityId)
            )
            res.remove.push(...Array.from(globalUppedEdgesIdsSet).map(
              edgeId => ({
                entityId: edgeId,
                entityType: "edge",
                action: "up",
                scope: "global"
              })
            ));

            //find local edge events for global down <set of edgeIds>
            const localUndecidedEdgesIdsSet = new Set(
              adjacentEdges.filter((e) =>
                !globallyAffectedEdgesIdsSet.has(e.entityId) &&
                e.scope === "local"
              ).map((e) => e.entityId)
            )
            res.add.push(...Array.from(localUndecidedEdgesIdsSet).map(
              edgeId => ({
                entityId: edgeId,
                entityType: "edge",
                action: "down",
                scope: "global"
              })
            ));

            // res.remove.push({ action: "down", scope: "global" })
            // res.add.push({ action: "up", scope: "global" })
            res.add.push({ action: "down", scope: "global" })
            console.log(res)
            return res;

          } else
            return { add: [{ action: "down", scope: "global" }] };
        }
      } else {
        // user is guest
        if (reviewState.ownerCreated) {
          return { error: "Cannot review user created node" };
        }

        if (reviewState.ownerUpped || reviewState.ownerDowned) {
          return { error: "Cannot review locked node" };
        }

        if (reviewState.currentCreated) {
          return { error: "Cannot review own node" };
        }

        if (voteType === "up") {
          if (reviewState.currentUpped) {
            return { remove: [{ action: "up", scope: "local" }] };
          }

          if (reviewState.currentDowned) {
            return {
              remove: [{ action: "down", scope: "local" }],
              add: [{ action: "up", scope: "local" }],
            };
          }

          return { add: [{ action: "up", scope: "local" }] };
        }

        if (voteType === "down") {
          if (reviewState.currentDowned) {
            return { remove: [{ action: "down", scope: "local" }] };
          }

          if (reviewState.currentUpped) {
            return {
              remove: [{ action: "up", scope: "local" }],
              add: [{ action: "down", scope: "local" }],
            };
          }

          return { add: [{ action: "down", scope: "local" }] };
        }
      }

      return { error: "Invalid action" };
    }

    function removeEventsWhere(eventsArray, predicate) {
      const arr = eventsArray.toArray();

      for (let i = arr.length - 1; i >= 0; i--) {
        if (predicate(arr[i])) {
          eventsArray.delete(i, 1);
        }
      }
    }

    function hasEventsWhere(eventsArray, predicate) {
      const arr = eventsArray.toArray();

      for (let i = arr.length - 1; i >= 0; i--) {

        if (predicate(arr[i])) {
          return true;
        }
      }
      return false;
    }

    function findNodeEvent(events, { nodeId, action, scope, userId }) {
      return events.find((e) => {
        if (e.entityType !== "node") return false;
        if (e.entityId !== nodeId) return false;
        if (e.action !== action) return false;
        if (e.scope !== scope) return false;

        if (scope === "local") return e.userId === userId;
        return true;
      });
    }

    function removeEventById(eventsArray, eventId) {
      const arr = eventsArray.toArray();
      const index = arr.findIndex((e) => e.id === eventId);
      if (index !== -1) {
        eventsArray.delete(index, 1);
      }
    }

    // useEffect(() => {
    //   if (!usersMap) return;

    //   const sync = () => {
    //     setUsers(
    //       //create map of {id:name} from usersMap
    //       Array.from(usersMap.entries()).reduce((acc, [id, name]) => {
    //         acc[id] = name;
    //         return acc;
    //       }, {})
    //     );
    //   };

    //   sync();
    //   usersMap.observe(sync);

    //   return () => usersMap.unobserve(sync);
    // }, [usersMap]);


    useEffect(() => {
      if (!yEvents) return;

      const syncEvents = () => {
        setEvents(yEvents.toArray());
      };

      syncEvents();
      yEvents.observe(syncEvents);

      return () => {
        yEvents.unobserve(syncEvents);
      };
    }, [yEvents]);

    //observer maps for changes
    useEffect(() => {
      if (!yNodes || !yEdges) return;


      // define the callbacks that update the local state when shared state changes
      const nodesObserver = () => {
        setNodes(Array.from(yNodes.values()));
      };
      const edgesObserver = () => {
        setEdges(Array.from(yEdges.values()));
      };
      // call the observers once when the component mounts to sync initial state
      nodesObserver();
      edgesObserver();

      // observers are triggered on changes
      yNodes.observe(nodesObserver);
      yEdges.observe(edgesObserver);

      return () => {
        // unobserve when component unmounts to prevent memory leaks or duplicate event handling
        yNodes.unobserve(nodesObserver);
        yEdges.unobserve(edgesObserver);
      };
    }, [yNodes, yEdges]);

    // Receiving awareness updates
    // to see other users we use useeffect that subscribes  to the update event on the awareness object
    useEffect(() => {
      if (!provider?.awareness) return;

      const awarenessObserver = () => {
        //inside this listener we get a list of all states
        const states = provider.awareness?.getStates();

        if (!states) return;

        const updatedAwareness = [];

        //we iterate through them but we must filter out our own client ID otherwise we would see a ghost cursor following ours with network delay
        for (const [clientId, state] of states.entries()) {
          const userMetadata = state.userMetadata;

          // Do not track this client's cursor
          if (
            clientId === provider.awareness?.clientID ||
            !userMetadata ||
            !userMetadata.cursorPosition //  fixed
          ) {
            continue;
          }

          // the remaining states are mapped to our local React state...
          updatedAwareness.push({
            userName: userMetadata.userName,
            // Converting flow position to screen coordinates
            role: userMetadata.role,
            //(2) when recieving someone elses position ; this takes their absolute coords and projects them onto my current screen viewport
            cursorPosition: flowToScreenPosition(userMetadata.cursorPosition)

          });
        }
        //...which we the render as cursors components
        setAwareness(updatedAwareness);
      };

      provider.awareness.on("update", awarenessObserver);

      return () => {
        provider.awareness?.off("update", awarenessObserver);
      };
    }, [provider, flowToScreenPosition]);


    const appendEvent = useCallback(
      (event) => {
        if (!yEvents) return;
        yEvents.push([event]);
      },
      [yEvents]
    );
    const clearProjectState = useCallback(() => {
      if (projectRole !== "OWNER") return;
      if (!provider?.document || !yNodes || !yEdges || !yEvents) return;

      const ok = window.confirm("Delete all project nodes, edges, and events?");
      if (!ok) return;

      provider.document.transact(() => {
        for (const key of Array.from(yNodes.keys())) {
          yNodes.delete(key);
        }

        for (const key of Array.from(yEdges.keys())) {
          yEdges.delete(key);
        }

        if (yEvents.length > 0) {
          yEvents.delete(0, yEvents.length);
        }
      });
    }, [projectRole, provider, yNodes, yEdges, yEvents]);







    const addNode = () => {
      if (!yNodes || !user) return;

      const newNode = {
        id: crypto.randomUUID(),
        type: "custom",
        position: { x: 0, y: 0 },
        data: {
          label: "New Node",
          createdBy: user.id,
        },
      };

      // 1. update state (Yjs)
      yNodes.set(newNode.id, newNode);

      // 2. log event
      appendEvent(
        createEvent({
          entityType: "node",
          entityId: newNode.id,
          action: "create",
          scope: currentMemberRole === "OWNER" ? "global" : "local",
          userId: currentMemberRole === "OWNER" ? null : user.id,
        })
      );
    };


    const onVoteNode = useCallback(
      (nodeId, voteType) => {
        // console.log("onVoteNode", { users })
        if (!yEvents || !user || !provider) return;

        const yEventsArray = yEvents.toArray();
        // console.log({ yEventsArray })

        const reviewState = getNodeReviewState(nodeId, yEventsArray);

        const resolution = resolveNodeReviewAction({
          reviewState,
          voteType,
        });


        if (resolution?.error) {
          alert(resolution.error);
          // return;
        }

        provider.document.transact(() => {

          // if has remove
          if (resolution?.remove) {


            for (const item of resolution.remove || []) {
              if (item?.entityType === "edge") {
                console.log(item)

                removeEventsWhere(yEdges, (event) =>
                  (event.source === nodeId || event.target === nodeId) &&
                  event.entityId === item.entityId &&
                  event.action === item?.action &&
                  event.scope === item?.scope
                );
              } else {
                // removeEventsWhere(yEvents, (event) =>

                const existing = findNodeEvent(yEventsArray, {
                  nodeId,
                  action: item.action,
                  scope: item.scope,
                  userId: item.scope === "local" ? user.id : null,
                });



                if (existing) {
                  removeEventById(yEvents, existing.id);
                }
              }

            }





          }


          if (resolution?.add) {

            //check for edges events propagation
            // const adjacentNotGloballyCreatedEdgesEvents = yEvents.toArray().filter((e) => {
            //   return (e.entityType === "edge" &&
            //     (e.source === nodeId || e.target === nodeId)
            //     & !(e.scope === "global" && e.action === "create")
            //   );
            // });

            for (const item of resolution.add || []) {
              if (item?.entityType === "edge") {
                appendEvent(
                  createEvent({
                    entityId: item?.entityId,
                    entityType: "edge",
                    action: item?.action,
                    scope: item?.scope,
                    userId: item?.scope === "local" ? user.id : null,
                  })
                );
              } else {
                appendEvent(
                  createEvent({
                    entityType: "node",
                    entityId: nodeId,
                    action: item.action,
                    scope: item.scope,
                    userId: item.scope === "local" ? user.id : null,
                  })
                );
              }



            }
          }
          if (!hasEventsWhere(yEvents, (event) =>
            event.entityType === "node" &&
            event.entityId === nodeId
          )) {

            yNodes.delete(nodeId);
          }
        });



      },
      [yEvents, user, projectRole, provider, appendEvent]
    );

    const onVoteEdge = useCallback(
      (edgeId, voteType) => {
        if (!yEvents || !user || !provider) return;


        const allEvents = yEvents.toArray();

        // const reviewState = getEdgeReviewState({
        //   users,
        //   events: allEvents,
        //   edgeId,
        //   currentUserId: user.id,
        //   projectRole,
        // });

        // const resolution = resolveNodeReviewAction({
        //   projectRole,
        //   reviewState,
        //   voteType,
        // });

        // if (resolution.error) {
        //   console.warn(resolution.error);
        //   return;
        // }

      },
      [yEvents, user, projectRole, provider, appendEvent]
    );



    const deleteNode = useCallback(
      (nodeId) => {
        if (!provider?.document || !yNodes || !yEdges || !yEvents || !user) {
          return;
        }

        const node = yNodes.get(nodeId);
        if (!node) return;

        const isOwner = projectRole === "OWNER";
        const isCreator = node.data?.createdBy === user.id;

        //  guest nu poate șterge dacă nu e creator
        if (!isOwner && !isCreator) return;

        const scope = isOwner ? "global" : "local";

        // 1. update Yjs state


        // optional: ștergi și edges
        // const edges = Array.from(edgesMap?.values?.() || []);
        // for (const edge of edges) {
        //   if (edge.source === nodeId || edge.target === nodeId) {
        //     edgesMap.delete(edge.id);
        //   }
        // }

        // 2. log event
        // appendEvent(
        //   createEvent({
        //     entityType: "node",
        //     entityId: nodeId,
        //     action: "delete",
        //     scope,
        //     userId: scope === "local" ? user.id : null,
        //   })
        // );
        provider.document.transact(() => {
          // const edgesToDelete = Array.from(edgesMap.values()).filter(
          //   (edge) => edge.source === nodeId || edge.target === nodeId
          // );

          if (isOwner) {
            yNodes.delete(nodeId);

            // for (const edge of edgesToDelete) {
            //   yEdges.delete(edge.id);
            // }


            removeEventsWhere(yEvents, (event) => {
              if (event.entityType === "node" && event.entityId === nodeId) {
                return true;
              }

              // if (
              //   event.entityType === "edge" &&
              //   edgesToDelete.some((edge) => edge.id === event.entityId)
              // ) {
              //   return true;
              // }

              return false;
            });
          } else {

            if (!hasEventsWhere(yEvents, (event) =>
              (event.entityType === "node" &&
                event.entityId === nodeId &&
                event.action === "up")
              ||
              (event.entityType === "node" &&
                event.entityId === nodeId &&
                event.action === "down")
            )) {

              yNodes.delete(nodeId);
            }


            // // for (const edge of edgesToDelete) {
            // //   yEdges.delete(edge.id);
            // // }

            removeEventsWhere(yEvents, (event) => {
              if (
                event.entityType === "node" &&
                event.entityId === nodeId &&
                event.action === "create" &&
                event.userId === user.id
              ) {
                return true;
              }

              // if (
              //   event.entityType === "edge" &&
              //   edgesToDelete.some((edge) => edge.id === event.entityId) &&
              //   event.scope === "local" &&
              //   event.userId === user.id
              // ) {
              //   return true;
              // }

              return false;
            });
          }
        });






      },
      [yNodes, yEdges, yEvents, user, projectRole, appendEvent]
    );

    const deleteEdge = useCallback(
      (edgeId) => {
        if (!provider?.document || !yEdges || !yEvents || !user) {
          return;
        }
        const edge = yEdges.get(edgeId);
        if (!edge) return;

        provider.document.transact(() => {
          yEdges.delete(edgeId);

          removeEventsWhere(yEvents, (event) => {
            if (event.entityType === "edge" && event.entityId === edgeId) {
              return true;
            }

            return false;
          });

        });

      },
      [yEdges, yEvents, user, provider]
    );





    // //////////////////////////////////////////
    // //////////////////////////////////////////
    // //////////////////////////////////////////
    // //////////////////////////////////////////
    // //////////////////////////////////////////
    //share outgoing changes
    const onNodesChange = useCallback(
      (changes) => {
        if (!yNodes) return;

        // current shared state read
        const yNodesArray = Array.from(yNodes.values());
        // apply changes to get the next state
        const nextNodes = applyNodeChanges(changes, yNodesArray);

        for (const change of changes) {
          if (change.type === "add" || change.type === "replace") {
            // add or replace items for new or updated nodes
            yNodes.set(change.item.id, change.item);
          } else if (change.type === "remove" && yNodes.has(change.id)) {
            // or remove them if a node was deleted
            yNodes.delete(change.id);
          } else {
            const node = nextNodes.find((n) => n.id === change.id);

            if (node) {
              yNodes.set(change.id, node);
            }
          }
        }
      },
      [yNodes],
    );

    const onEdgesChange = useCallback(
      (changes) => {
        if (!yEdges) return;
        const yEdgesArray = Array.from(yEdges.values());
        const nextEdges = applyEdgeChanges(changes, yEdgesArray);

        for (const change of changes) {
          if (change.type === "add" || change.type === "replace") {
            yEdges.set(change.item.id, change.item);
          } else if (change.type === "remove" && yEdges.has(change.id)) {
            yEdges.delete(change.id);
          } else {
            const edge = nextEdges.find((e) => e.id === change.id);

            if (edge) {
              yEdges.set(change.id, edge);
            }
          }
        }
      },
      [yEdges],
    );

    // trigger for reactflow whenever the user creates a new connection between nodes
    const onConnect = useCallback(
      (params) => {


        if (!yEdges || !user || !params.target || !params.source) return;
        if (params.source === params.target) {
          alert("Cannot connect node to itself");
          return;
        }
        const edges = Array.from(yEdges.values());
        // generate a new edge and store it the shared state

        const edgeId = crypto.randomUUID();

        const scope = projectRole === "OWNER" ? "global" : "local";


        const targetNodeId = yNodes.get(params.target).id;
        const sourceNodeId = yNodes.get(params.source).id;


        let targetsNeedsUp = false;
        let sourceNeedsUp = false;
        //if owner
        if (projectRole === "OWNER") {

          if (!hasEventsWhere(yEvents, (event) =>
            event.entityType === "node" &&
            event.entityId === targetNodeId &&
            event.scope === "global" &&
            (event.action === "up" || event.action === "create")
          )) {
            targetsNeedsUp = true;
          }
          if (!hasEventsWhere(yEvents, (event) =>
            event.entityType === "node" &&
            event.entityId === sourceNodeId &&
            event.scope === "global" &&
            (event.action === "up" || event.action === "create")
          )) {
            sourceNeedsUp = true;
          }
          //confim
          if (targetsNeedsUp || sourceNeedsUp) {

            // OWNERUL VREA SA ADAUGE DAR TREBUIE SA AIBA CREATOR SAU UPVOTE GLOBAL PE NODURI
            const targetLabel = yNodes.get(params.target).data.label;
            const sourceLabel = yNodes.get(params.source).data.label;

            const upvotedString = [targetsNeedsUp ? targetLabel : null, sourceNeedsUp ? sourceLabel : null].filter(Boolean).join(" and ");
            const ok = window.confirm(`Edge creation will assume upvoting ${upvotedString}`);

            if (!ok) {
              return;
            } else {
              if (targetsNeedsUp) {
                // VERIFICAM DACA EXISTA GLOBAL DOWN PE TARGET
                if (hasEventsWhere(yEvents, (event) =>
                  event.entityType === "node" &&
                  event.entityId === targetNodeId &&
                  event.scope === "global" &&
                  event.action === "down"
                )) {
                  // daca da, stergem global down si adaugam global up
                  removeEventById(yEvents, yEvents.toArray().find((event) =>
                    event.entityType === "node" &&
                    event.entityId === targetNodeId &&
                    event.scope === "global" &&
                    event.action === "down"
                  ).id);
                }

                // --- DE REVENIT --- DACA AM STERS GLOBAL DOWN S-AR PUTEA SA SE STEARGA EVENTURI DE GUESTS

                //CONTINUAM CU ADAUGAREA DE GLOBAL UP PE TARGET
                appendEvent(
                  createEvent({
                    entityType: "node",
                    entityId: targetNodeId,
                    action: "up",
                    scope: "global",
                    userId: null,
                  })
                );
              }
              if (sourceNeedsUp) {
                // VERIFICAM DACA EXISTA GLOBAL DOWN PE SOURCE
                if (hasEventsWhere(yEvents, (event) =>
                  event.entityType === "node" &&
                  event.entityId === sourceNodeId &&
                  event.scope === "global" &&
                  event.action === "down"
                )) {
                  // daca da, stergem global down si adaugam global up
                  removeEventById(yEvents, yEvents.toArray().find((event) =>
                    event.entityType === "node" &&
                    event.entityId === sourceNodeId &&
                    event.scope === "global" &&
                    event.action === "down"
                  ).id);
                }
                //CONTINUAM CU ADAUGAREA DE GLOBAL UP PE SOURCE
                appendEvent(
                  createEvent({
                    entityType: "node",
                    entityId: sourceNodeId,
                    action: "up",
                    scope: "global",
                    userId: null,
                  })
                );
              }


            }
          }

        } else {

        }


        const nextEdges = addEdge(
          {
            ...params,
            id: edgeId,
            type: "custom",
            data: {
              label: "NewEdge",
              createdBy: user.id,
            },
          },
          edges
        );

        //store it in the shared state if its not already there
        for (const edge of nextEdges) {
          if (yEdges.has(edge.id)) {
            continue;
          }

          yEdges.set(edge.id, edge);
          appendEvent(
            createEvent({
              entityType: "edge",
              entityId: edgeId,
              action: "create",
              scope: currentMemberRole === "OWNER" ? "global" : "local",
              userId: currentMemberRole === "OWNER" ? null : user.id,
              sourceId: edge.source,
              targetId: edge.target,
            })
          );

        }




      },
      [yEdges, yNodes, yEvents, user, projectRole, appendEvent],
    );
    // Send awareness updates to other users
    // this function is attached to on mouse move and on mouse drag
    const updateAwareness = useCallback(
      //takes the mouse event and call provider.setAwarenessField
      (e) => {
        if (!provider || !user) {
          return;
        }

        // Converting screen coordinates to flow position

        // THE COORD TRAP
        // because users can zoom and pan we cannot sed raw screen pixels;
        // if we did that my cursor would be in the wrong place for someone who panned their view
        // (1)therefore we need a helper to translate my screen pixels into the abosulte coord of the diagram
        const flowPosition = screenToFlowPosition({ x: e.clientX, y: e.clientY });

        // pass users metadata
        provider.setAwarenessField("userMetadata", {
          userId: user.id,
          userName: user.name,
          role: projectRole,
          cursorPosition: flowPosition,
        });
      },
      [provider, user, projectRole, screenToFlowPosition],
    );







    const renderedNodes = useMemo(() => {

      if (!nodes || !events) return [];
      // console.log("renderedNodes", events, nodes)
      return nodes.map((node) => {
        const reviewState = getNodeReviewState(
          node.id,
          events
        );

        return {
          ...node,
          data: {
            ...node.data,
            reviewState,
            onVoteUp: () => onVoteNode(node.id, "up"),
            onVoteDown: () => onVoteNode(node.id, "down"),
            onDelete: deleteNode,
            currentUserId: user?.id,
            projectRole,
          },
        };
      });
    }, [nodes, events, user?.id, projectRole, onVoteNode, deleteNode]);


    const renderedEdges = useMemo(() => {

      return edges.map((edge) => {

        const reviewState = getEdgeReviewState(
          edge.id,
          events
        );
        return {
          ...edge,
          data: {
            ...edge.data,
            reviewState,
            onVoteUp: () => onVoteEdge(edge.id, "up"),
            onVoteDown: () => onVoteEdge(edge.id, "down"),
            onDelete: deleteEdge,

          },
        };
      });
    }, [edges, events, user?.id, projectRole, onVoteEdge, deleteEdge]);

    const renderedEvents = useMemo(() => {
      return events.map((event, index) => ({
        ...event,
        index: index + 1,
      }));
    }, [events]);




    //check if states change causes rerenders
    // clg if events changes
    // let useEffectChanges = ""
    // useEffect(() => {
    //   useEffectChanges += ".events:" + `${events?.map(e => e.action).join(",")} `
    // }, [events]);
    // useEffect(() => {
    //   useEffectChanges += ".nodes:" + `${nodes?.map(n => n.data.label).join(" ")} `
    // }, [nodes]);
    // useEffect(() => {
    //   useEffectChanges += ".edges "
    // }, [edges]);
    // useEffect(() => {
    //   useEffectChanges += ".projectRole "
    // }, [projectRole]);
    // useEffect(() => {
    //   useEffectChanges += ".yEvents:" + `${yEvents?.toArray().map(e => e.action).join(",")} `
    // }, [yEvents]);
    // useEffect(() => {
    //   useEffectChanges += ".yNodes "
    // }, [yNodes]);
    // useEffect(() => {
    //   useEffectChanges += ".yEdges "
    // }, [yEdges]);
    // useEffect(() => {
    //   console.log(`CHANGES: ${useEffectChanges.split(".").join(" | ")}`);
    // },
    //   [events, nodes, edges, projectRole, yEvents, yNodes, yEdges]
    // )


    return (
      <>
        <div className="diagram-container">
          <ReactFlow
            nodes={renderedNodes}
            edges={renderedEdges}
            // fitView
            onNodesChange={onNodesChange}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onMouseMove={updateAwareness}
            onNodeDrag={updateAwareness}
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>

          <button className="add-node-btn" onClick={addNode}>
            Add node
          </button>

          {/* <button className="open-events-btn" onClick={() => setIsEventsOpen((v) => !v)}>
            {isEventsOpen ? "Hide events" : "Show events"}
          </button> */}
        </div>
        {isEventsOpen && (
          <EventsPanel
            events={renderedEvents}
            onClose={() => setIsEventsOpen(false)}
          />
        )}
        {!isEventsOpen && (
          <button
            onClick={() => setIsEventsOpen(true)}
            style={{
              position: "fixed",
              top: 88,
              right: 16,
              zIndex: 1000,
              border: "1px solid #e5e7eb",
              background: "#fff",
              borderRadius: 999,
              padding: "10px 14px",
              boxShadow: "0 8px 24px rgba(17, 24, 39, 0.12)",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Open events
          </button>
        )}
        {awareness.map(({ cursorPosition, userName, role }, index) => (
          <Cursor
            key={index}
            cursorPosition={cursorPosition}
            userName={userName}
            role={role}
          />
        ))}
        {projectRole === "OWNER" && (
          <button style={
            { position: "absolute", bottom: 20, left: 60, zIndex: 10 }
          }
            onClick={clearProjectState}>
            Reset all Yjs state
          </button>
        )}
      </>
    );
  }
