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
    connectionStore.setStatus("connecting")

    try {
      await connectionManager.connectToHost(roomId, nickname)
      // Save session for auto-reconnect
      sessionStorage.setItem("hostId", roomId)
      sessionStorage.setItem("nickname", nickname)
      goto("/play")
    } catch {
      error = "Failed to connect. Check Room ID."
      isConnecting = false
      connectionStore.setStatus("disconnected")
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
        加入遊戲
      </h2>

      {#if error}
        <div class="alert alert-error shadow-lg mb-4">
          <span>{error}</span>
        </div>
      {/if}

      <div class="form-control w-full">
        <label class="label" for="room-id">
          <span class="label-text font-semibold">房間 ID</span>
        </label>
        <input
          id="room-id"
          type="text"
          placeholder="在此貼上房間 ID..."
          class="input input-bordered w-full focus:input-primary transition-all"
          bind:value={roomId}
        />
      </div>

      <div class="form-control w-full mt-4">
        <label class="label" for="nickname">
          <span class="label-text font-semibold">暱稱</span>
        </label>
        <input
          id="nickname"
          type="text"
          placeholder="輸入您的名字"
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
            連線中...
          {:else}
            加入遊戲
          {/if}
        </button>
      </div>

      <div class="divider">或</div>

      <div class="text-center">
        <a href="/" class="link link-hover text-sm">返回首頁</a>
      </div>
    </div>
  </div>
</div>
