<script lang="ts">
  import { onMount } from "svelte"
  import { connectionManager } from "$lib/connection"
  import { connectionStore } from "$lib/stores/connectionStore"
  import { gameStore } from "$lib/stores/gameStore"

  let roomId = ""
  let copied = false

  $: roomId = $connectionStore.peerId || "Initializing..."
  $: players = $gameStore.players

  onMount(async () => {
    try {
      // Initialize as Host (no ID provided = auto-generate)
      // The roomId will be set reactively by connectionStore.peerId
      await connectionManager.init()
    } catch (err) {
      console.error("Failed to init host:", err)
    }
  })

  function copyRoomId() {
    navigator.clipboard.writeText(roomId)
    copied = true
    setTimeout(() => (copied = false), 2000)
  }

  function startGame() {
    if (players.length === 0) {
      alert("Wait for players to join!")
      return
    }
    gameStore.startGame()
  }
</script>

<div class="min-h-screen bg-base-200 p-4">
  <div class="container mx-auto max-w-4xl">
    <div class="text-center mb-12">
      <h1 class="text-4xl font-bold mb-2">Game Lobby</h1>
      <p class="text-base-content/60">Waiting for players to join...</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <!-- Room Info Card -->
      <div class="card bg-base-100 shadow-xl border border-base-300 h-fit">
        <div class="card-body">
          <h2 class="card-title text-2xl mb-4">Room Info</h2>
          <div class="form-control">
            <label class="label" for="room-id">
              <span class="label-text font-semibold">Room ID</span>
            </label>
            <div class="join">
              <input
                id="room-id"
                type="text"
                value={roomId}
                readonly
                class="input input-bordered join-item w-full font-mono bg-base-200"
              />
              <button class="btn btn-primary join-item" on:click={copyRoomId}>
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <label class="label" for="room-id">
              <span class="label-text-alt text-base-content/60"
                >Share this ID with players</span
              >
            </label>
          </div>

          <div class="divider"></div>

          <div class="alert alert-info shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              class="stroke-current shrink-0 w-6 h-6"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path></svg
            >
            <span
              >Select a quiz from "My Quizzes" to start a game session properly.</span
            >
          </div>
          <div class="card-actions justify-end mt-4">
            <a href="/host/quizzes" class="btn btn-outline w-full"
              >Go to My Quizzes</a
            >
          </div>
        </div>
      </div>

      <!-- Players List Card -->
      <div class="card bg-base-100 shadow-xl border border-base-300">
        <div class="card-body">
          <div class="flex justify-between items-center mb-4">
            <h2 class="card-title text-2xl">Players</h2>
            <div class="badge badge-secondary badge-lg">
              {players.length} Joined
            </div>
          </div>

          <div
            class="bg-base-200 rounded-box p-4 min-h-[300px] overflow-y-auto"
          >
            {#if players.length === 0}
              <div
                class="flex flex-col items-center justify-center h-full text-base-content/40"
              >
                <span class="loading loading-dots loading-lg mb-2"></span>
                <p>Waiting for players...</p>
              </div>
            {:else}
              <ul class="menu bg-base-100 rounded-box">
                {#each players as player}
                  <li
                    class="animate-in fade-in slide-in-from-bottom-2 duration-300"
                  >
                    <button
                      class="flex justify-between cursor-default hover:bg-base-200 w-full text-left"
                    >
                      <div class="flex items-center gap-3">
                        <div class="avatar placeholder">
                          <div
                            class="bg-neutral text-neutral-content rounded-full w-8"
                          >
                            <span class="text-xs"
                              >{player.nickname
                                .substring(0, 2)
                                .toUpperCase()}</span
                            >
                          </div>
                        </div>
                        <span class="font-semibold">{player.nickname}</span>
                      </div>
                      <span class="badge badge-ghost">Ready</span>
                    </button>
                  </li>
                {/each}
              </ul>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<div
  class="fixed bottom-0 left-0 right-0 p-4 bg-base-100 border-t border-base-300 shadow-lg"
>
  <div class="container mx-auto max-w-4xl">
    <button
      class="btn btn-primary btn-lg w-full"
      disabled={players.length === 0}
      on:click={startGame}
    >
      Start Game
    </button>
  </div>
</div>
