<script lang="ts">
  import { connectionManager } from "$lib/connection"
  import { connectionStore } from "$lib/stores/connectionStore"
  import { goto } from "$app/navigation"

  let roomId = ""
  let nickname = ""
  let isConnecting = false
  let error = ""

  async function joinGame() {
    if (!roomId || !nickname) return

    isConnecting = true
    connectionStore.setConnecting(true)

    try {
      await connectionManager.connectToHost(roomId, nickname)
      goto("/play")
    } catch {
      error = "Failed to connect. Check Room ID."
      isConnecting = false
    }
  }
</script>

<div
  class="min-h-screen bg-base-200 flex items-center justify-center p-4 relative overflow-hidden"
>
  <!-- Background Decoration -->
  <div
    class="absolute top-0 right-0 w-full h-full overflow-hidden z-0 pointer-events-none"
  >
    <div
      class="absolute top-10 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"
    ></div>
    <div
      class="absolute bottom-10 left-10 w-72 h-72 bg-secondary/10 rounded-full blur-3xl"
    ></div>
  </div>

  <div
    class="card w-full max-w-md bg-base-100 shadow-2xl z-10 border border-base-300"
  >
    <div class="card-body">
      <h2 class="card-title text-3xl font-bold justify-center mb-6">
        Join Game
      </h2>

      {#if error}
        <div class="alert alert-error shadow-lg mb-4">
          <span>{error}</span>
        </div>
      {/if}

      <div class="form-control w-full">
        <label class="label" for="room-id">
          <span class="label-text font-semibold">Room ID</span>
        </label>
        <input
          id="room-id"
          type="text"
          placeholder="Paste Room ID here..."
          class="input input-bordered w-full focus:input-primary transition-all"
          bind:value={roomId}
        />
      </div>

      <div class="form-control w-full mt-4">
        <label class="label" for="nickname">
          <span class="label-text font-semibold">Nickname</span>
        </label>
        <input
          id="nickname"
          type="text"
          placeholder="Enter your name"
          class="input input-bordered w-full focus:input-primary transition-all"
          bind:value={nickname}
        />
      </div>

      <div class="card-actions justify-end mt-8">
        <button
          class="btn btn-primary w-full text-lg"
          on:click={joinGame}
          disabled={isConnecting}
        >
          {#if isConnecting}
            <span class="loading loading-spinner"></span>
            Connecting...
          {:else}
            Join Game
          {/if}
        </button>
      </div>

      <div class="divider">OR</div>

      <div class="text-center">
        <a href="/" class="link link-hover text-sm">Back to Home</a>
      </div>
    </div>
  </div>
</div>
