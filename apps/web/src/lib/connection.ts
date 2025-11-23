import Peer, { type DataConnection } from "peerjs";
import { connectionStore } from "./stores/connectionStore";
import type { GameState } from "./stores/gameStore";

export type MessageType = "JOIN" | "ANSWER" | "GAME_STATE" | "KICK";

export interface Message {
  type: MessageType;
  payload: unknown;
}

export class ConnectionManager {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private isHost: boolean = false;

  constructor() {}

  async init(options: { id?: string; isHost?: boolean } = {}): Promise<string> {
    const { id, isHost } = options;
    this.isHost = isHost ?? !id; // Default logic: if no ID, assume host (unless specified)
    return new Promise((resolve, reject) => {
      // Use a public PeerJS server for now, can be configured for self-hosted later
      this.peer = id ? new Peer(id) : new Peer();

      this.peer.on("open", (peerId) => {
        console.log("My peer ID is: " + peerId);
        connectionStore.setPeerId(peerId);
        resolve(peerId);
      });

      this.peer.on("connection", (conn) => {
        this.handleIncomingConnection(conn);
      });

      this.peer.on("error", (err) => {
        console.error("PeerJS error:", err);
        connectionStore.setError(err.message);
        reject(err);
      });
    });
  }

  private handleIncomingConnection(conn: DataConnection) {
    const onOpen = () => {
      console.log("Connected to: " + conn.peer);
      this.connections.set(conn.peer, conn);
      connectionStore.addConnection(conn.peer);

      // If we are host, we might want to send initial state
      if (this.isHost) {
        // TODO: Send current game state
      }
    };

    if (conn.open) {
      onOpen();
    } else {
      conn.on("open", onOpen);
    }

    conn.on("data", (data) => {
      console.log("Received data:", data);
      this.handleMessage(data as Message, conn.peer);
    });

    conn.on("close", () => {
      console.log("Connection closed: " + conn.peer);
      this.connections.delete(conn.peer);
      connectionStore.removeConnection(conn.peer);
    });
  }

  private handleMessage(message: Message, senderId: string) {
    // Dispatch to store or event handlers
    console.log(`Message from ${senderId}:`, message);

    switch (message.type) {
      case "JOIN": {
        const { nickname } = message.payload as { nickname: string };
        // Only Host handles JOIN
        if (this.isHost) {
          import("./stores/gameStore").then(({ gameStore }) => {
            gameStore.addPlayer(senderId, nickname);
          });
        }
        break;
      }
      case "GAME_STATE":
        // Clients receive GAME_STATE
        if (!this.isHost) {
          import("./stores/gameStore").then(({ gameStore }) => {
            gameStore.syncState(message.payload as GameState);
          });
        }
        break;
      case "ANSWER":
        if (this.isHost) {
          const { option } = message.payload as { option: string };
          import("./stores/gameStore").then(({ gameStore }) => {
            gameStore.handleAnswer(senderId, option);
          });
        }
        break;
    }
  }

  async connectToHost(hostId: string, nickname: string) {
    if (!this.peer) await this.init({ isHost: false });

    const conn = this.peer!.connect(hostId);

    return new Promise<void>((resolve, reject) => {
      conn.on("open", () => {
        this.handleIncomingConnection(conn);
        // Send JOIN message immediately
        this.send(hostId, { type: "JOIN", payload: { nickname } });
        resolve();
      });

      conn.on("error", (err) => {
        reject(err);
      });

      // Timeout if connection takes too long
      setTimeout(() => reject(new Error("Connection timeout")), 5000);
    });
  }

  broadcast(message: Message) {
    this.connections.forEach((conn) => {
      if (conn.open) {
        conn.send(message);
      }
    });
  }

  send(peerId: string, message: Message) {
    const conn = this.connections.get(peerId);
    if (conn && conn.open) {
      conn.send(message);
    }
  }

  destroy() {
    this.peer?.destroy();
    this.peer = null;
    this.connections.clear();
    connectionStore.reset();
  }
}

export const connectionManager = new ConnectionManager();
