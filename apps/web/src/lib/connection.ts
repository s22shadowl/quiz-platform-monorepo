import Peer, { type DataConnection } from "peerjs";
import { connectionStore } from "./stores/connectionStore";

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

  async init(id?: string): Promise<string> {
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
    conn.on("open", () => {
      console.log("Connected to: " + conn.peer);
      this.connections.set(conn.peer, conn);
      connectionStore.addConnection(conn.peer);

      // If we are host, we might want to send initial state
      if (this.isHost) {
        // TODO: Send current game state
      }
    });

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
    // TODO: Integrate with game logic store
  }

  async connectToHost(hostId: string) {
    if (!this.peer) await this.init();

    const conn = this.peer!.connect(hostId);
    this.handleIncomingConnection(conn);
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
