<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import { connectionManager } from "$lib/connection"
  import { connectionStore } from "$lib/stores/connectionStore"

  let roomId: string = ""
  let isLoading = true

  onMount(async () => {
    try {
      // Initialize as Host (no ID provided = auto-generate)
      roomId = await connectionManager.init()
      isLoading = false
    } catch (err) {
      console.error("Failed to init host:", err)
      isLoading = false
    }
  })

  onDestroy(() => {
    // connectionManager.destroy(); // Don't destroy on nav, only on explicit exit?
    // For now, let's keep it alive.
  })

  function startGame() {
    // TODO: Implement game start logic (broadcast START message)
    // connectionManager.broadcast({ type: 'GAME_STATE', payload: { status: 'playing' } });
    // goto('/host/game');
    alert("Game Start logic to be implemented in next task")
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(roomId)
    alert("Room ID copied!")
  }
</script>

<div class="container mx-auto p-4 max-w-2xl text-center">
  <h1 class="text-4xl font-bold mb-8">Game Lobby</h1>

  {#if isLoading}
    <span class="loading loading-spinner loading-lg"></span>
    <p>Creating Room...</p>
  {:else if $connectionStore.error}
    <div class="alert alert-error">
      <span>Error: {$connectionStore.error}</span>
    </div>
  {:else}
    <div class="card bg-base-200 shadow-xl mb-8">
      <div class="card-body items-center">
        <h2 class="card-title">Room ID</h2>
        <div class="flex gap-2 items-center">
          <code class="text-2xl font-mono bg-base-300 p-4 rounded-lg"
            >{roomId}</code
          >
          <button class="btn btn-square btn-ghost" on:click={copyToClipboard}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              /></svg
            >
          </button>
        </div>
        <p class="text-sm text-base-content/60 mt-2">
          Share this ID with players to join
        </p>
      </div>
    </div>

    <div class="divider">
      Connected Players ({$connectionStore.connectedPeers.length})
    </div>

    <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
      {#each $connectionStore.connectedPeers as peerId}
        <div class="card bg-base-100 border border-base-300">
          <div class="card-body p-4 text-center">
            <div class="avatar placeholder justify-center mb-2">
              <div
                class="bg-neutral-focus text-neutral-content rounded-full w-12"
              >
                <span class="text-xl">{peerId.slice(0, 2).toUpperCase()}</span>
              </div>
            </div>
            <span class="font-bold truncate">{peerId}</span>
          </div>
        </div>
      {/each}

      {#if $connectionStore.connectedPeers.length === 0}
        <div class="col-span-full text-base-content/50 italic py-8">
          Waiting for players to join...
        </div>
      {/if}
    </div>

    <button
      class="btn btn-primary btn-lg w-full md:w-1/2"
      disabled={$connectionStore.connectedPeers.length === 0}
      on:click={startGame}
    >
      Start Game
    </button>
  {/if}
</div>
