<script lang="ts">
  import { gameStore } from "$lib/stores/gameStore"
  import { connectionManager } from "$lib/connection"
  import { connectionStore } from "$lib/stores/connectionStore"
  import { goto } from "$app/navigation"

  let hasAnswered = false
  let selectedOption: string | null = null

  // Reset local state when question changes
  $: if ($gameStore.currentQuestionIndex) {
    hasAnswered = false
    selectedOption = null
  }

  function sendAnswer(option: string) {
    if (hasAnswered || $gameStore.timeRemaining <= 0 || $gameStore.isPaused)
      return

    hasAnswered = true
    selectedOption = option

    // TODO: Get Host ID from connection store or context
    const hostId = $connectionStore.connectedPeers[0] // Assuming first peer is host for now (Client mode)
    if (hostId) {
      connectionManager.send(hostId, { type: "ANSWER", payload: { option } })
    }
    console.log("Answer selected:", option)
  }

  function goHome() {
    // Clean up connection if needed, though navigation usually handles it.
    // For P2P, it's good to explicitly close if we are leaving for good.
    // But here we might just want to go back to home.
    goto("/")
  }
</script>

<div class="container mx-auto p-4 max-w-md min-h-screen flex flex-col">
  {#if !$connectionStore.peerId}
    <div class="alert alert-warning shadow-lg my-auto">
      <div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="stroke-current flex-shrink-0 h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          ><path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          /></svg
        >
        <span>尚未連線至任何遊戲。請從首頁加入。</span>
      </div>
    </div>
  {:else if $gameStore.status === "lobby"}
    <div class="hero my-auto">
      <div class="hero-content text-center">
        <div class="max-w-md">
          <h1 class="text-3xl font-bold mb-4">等待主持人...</h1>
          <p class="py-4">您已連線！遊戲即將開始。</p>
          <div class="loading loading-dots loading-lg"></div>
        </div>
      </div>
    </div>
  {:else if $gameStore.status === "playing" && $gameStore.currentQuestion}
    <div class="flex-1 flex flex-col justify-center relative">
      {#if $gameStore.isPaused}
        <div
          class="absolute inset-0 bg-base-100/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-box"
        >
          <div class="text-center">
            <h2 class="text-4xl font-bold mb-2">遊戲暫停</h2>
            <p class="text-xl">請稍候...</p>
          </div>
        </div>
      {/if}

      <div class="card bg-base-100 shadow-xl mb-4">
        <div class="card-body">
          <div class="flex justify-between text-sm text-base-content/60 mb-2">
            <span>第 {$gameStore.currentQuestionIndex + 1} 題</span>
            <span>{$gameStore.timeRemaining}秒</span>
          </div>
          <h2 class="card-title text-xl">{$gameStore.currentQuestion.text}</h2>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-3">
        {#each $gameStore.currentQuestion.options as option}
          <button
            class="btn btn-lg h-auto py-4 text-lg
            {selectedOption === option ? 'btn-primary' : 'btn-outline'}
            {hasAnswered && selectedOption !== option ? 'opacity-50' : ''}"
            on:click={() => sendAnswer(option)}
            disabled={$gameStore.isPaused ||
              hasAnswered ||
              $gameStore.timeRemaining <= 0}
          >
            {option}
          </button>
        {/each}
      </div>

      {#if hasAnswered}
        <div class="text-center mt-4 animate-pulse text-success font-bold">
          已送出答案，等待下一題...
        </div>
      {:else if $gameStore.timeRemaining <= 0}
        <div class="text-center mt-4 text-error font-bold">
          時間到！等待主持人...
        </div>
      {/if}
    </div>
  {:else if $gameStore.status === "finished"}
    <div class="hero my-auto">
      <div class="hero-content text-center">
        <div class="max-w-md">
          <h1 class="text-4xl font-bold mb-4">遊戲結束！</h1>

          <!-- Find current player score -->
          {#if $connectionStore.peerId}
            {@const myPlayer = $gameStore.players.find(
              (p) => p.id === $connectionStore.peerId,
            )}
            {#if myPlayer}
              <div class="stat bg-base-200 rounded-box mb-6">
                <div class="stat-title">您的得分</div>
                <div class="stat-value text-primary">{myPlayer.score}</div>
                <div class="stat-desc">感謝您的參與</div>
              </div>
            {/if}
          {/if}

          <button class="btn btn-primary btn-wide" on:click={goHome}
            >回到首頁</button
          >
        </div>
      </div>
    </div>
  {/if}
</div>
