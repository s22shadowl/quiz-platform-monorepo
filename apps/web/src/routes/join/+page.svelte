<script lang="ts">
  import { connectionManager } from "$lib/connection"
  import { connectionStore } from "$lib/stores/connectionStore"

  let roomId = ""
  let nickname = ""
  let isConnecting = false

  async function joinGame() {
    if (!roomId || !nickname) return

    isConnecting = true
    connectionStore.setConnecting(true)

    try {
      // TODO: Pass nickname in metadata when PeerJS supports it or send immediate JOIN message
      await connectionManager.connectToHost(roomId)

      // Send JOIN message
      connectionManager.send(roomId, {
        type: "JOIN",
        payload: { nickname },
      })

      // Wait for connection confirmation or just redirect to waiting room
      // For now, simple redirect if no error
      // goto('/play'); // TODO: Create play page
      alert("Connected! Waiting for host to start...")
    } catch (err) {
      console.error("Failed to join:", err)
      alert("Failed to join room. Check ID and try again.")
    } finally {
      isConnecting = false
      connectionStore.setConnecting(false)
    }
  }
</script>

<div
  class="container mx-auto p-4 max-w-md flex flex-col justify-center min-h-screen"
>
  <div class="card bg-base-100 shadow-2xl">
    <div class="card-body">
      <h1 class="text-3xl font-bold text-center mb-6">Join Quiz</h1>

      <div class="form-control w-full">
        <label class="label" for="room-id">
          <span class="label-text">Room ID</span>
        </label>
        <input
          id="room-id"
          type="text"
          placeholder="Enter Room ID"
          class="input input-bordered w-full"
          bind:value={roomId}
        />
      </div>

      <div class="form-control w-full mt-4">
        <label class="label" for="nickname">
          <span class="label-text">Nickname</span>
        </label>
        <input
          id="nickname"
          type="text"
          placeholder="Enter your nickname"
          class="input input-bordered w-full"
          bind:value={nickname}
        />
      </div>

      <div class="card-actions justify-end mt-8">
        <button
          class="btn btn-primary w-full"
          on:click={joinGame}
          disabled={isConnecting || !roomId || !nickname}
        >
          {#if isConnecting}
            <span class="loading loading-spinner"></span>
            Connecting...
          {:else}
            Join Game
          {/if}
        </button>
      </div>

      <div class="text-center mt-4">
        <a href="/" class="link link-hover text-sm">Back to Home</a>
      </div>
    </div>
  </div>
</div>
