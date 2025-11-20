import { writable } from "svelte/store";

export interface ConnectionState {
  peerId: string | null;
  connectedPeers: string[];
  error: string | null;
  isConnecting: boolean;
}

function createConnectionStore() {
  const { subscribe, set, update } = writable<ConnectionState>({
    peerId: null,
    connectedPeers: [],
    error: null,
    isConnecting: false,
  });

  return {
    subscribe,
    setPeerId: (id: string) =>
      update((s) => ({ ...s, peerId: id, error: null })),
    addConnection: (peerId: string) =>
      update((s) => ({ ...s, connectedPeers: [...s.connectedPeers, peerId] })),
    removeConnection: (peerId: string) =>
      update((s) => ({
        ...s,
        connectedPeers: s.connectedPeers.filter((id) => id !== peerId),
      })),
    setError: (error: string) => update((s) => ({ ...s, error })),
    setConnecting: (isConnecting: boolean) =>
      update((s) => ({ ...s, isConnecting })),
    reset: () =>
      set({
        peerId: null,
        connectedPeers: [],
        error: null,
        isConnecting: false,
      }),
  };
}

export const connectionStore = createConnectionStore();
