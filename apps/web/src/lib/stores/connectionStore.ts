import { writable } from "svelte/store";

export interface ConnectionState {
  peerId: string | null;
  connectedPeers: string[];
  error: string | null;
  status: ConnectionStatus;
}

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting";

function createConnectionStore() {
  const { subscribe, update, set } = writable<{
    peerId: string | null;
    connectedPeers: string[];
    error: string | null;
    status: ConnectionStatus;
  }>({
    peerId: null,
    connectedPeers: [],
    error: null,
    status: "disconnected",
  });

  return {
    subscribe,
    setPeerId: (id: string) =>
      update((s) => ({ ...s, peerId: id, status: "connected" })), // Assuming getting ID means we are ready
    addConnection: (peerId: string) =>
      update((s) => ({
        ...s,
        connectedPeers: [...s.connectedPeers, peerId],
        status: "connected",
      })),
    removeConnection: (peerId: string) =>
      update((s) => ({
        ...s,
        connectedPeers: s.connectedPeers.filter((p) => p !== peerId),
        // If no peers left and we are client, maybe disconnected?
        // But for now just remove peer.
      })),
    setError: (error: string) => update((s) => ({ ...s, error })),
    setStatus: (status: ConnectionStatus) => update((s) => ({ ...s, status })),
    reset: () =>
      set({
        peerId: null,
        connectedPeers: [],
        error: null,
        status: "disconnected",
      }),
  };
}

export const connectionStore = createConnectionStore();
