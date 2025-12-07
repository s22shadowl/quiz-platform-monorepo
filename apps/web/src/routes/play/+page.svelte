<script lang="ts">
  import { run } from 'svelte/legacy';

  import { onMount } from "svelte"
  import { gameStore } from "$lib/stores/gameStore"
  import { connectionManager } from "$lib/connection"
  import { connectionStore } from "$lib/stores/connectionStore"
  import { goto } from "$app/navigation"

  let hasAnswered = $state(false)
  let selectedOption: string | null = $state(null)
  let selectedOptions: string[] = $state([])

  // Reset local state when question changes
  run(() => {
    if ($gameStore.currentQuestionIndex) {
      hasAnswered = false
      selectedOption = null
      selectedOptions = []
    }
  });

  onMount(async () => {
    // Check for existing session
    const savedHostId = sessionStorage.getItem("hostId")
    const savedNickname = sessionStorage.getItem("nickname")

    if (!$connectionStore.peerId && savedHostId && savedNickname) {
      console.log("Found saved session, attempting reconnect...")
      try {
        await connectionManager.reconnect(savedHostId, savedNickname)
      } catch (err) {
        console.error("Auto-reconnect failed", err)
        sessionStorage.removeItem("hostId")
        sessionStorage.removeItem("nickname")
      }
    }
  })

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

  function toggleOption(option: string) {
    if (hasAnswered || $gameStore.timeRemaining <= 0 || $gameStore.isPaused)
      return

    if (selectedOptions.includes(option)) {
      selectedOptions = selectedOptions.filter((o) => o !== option)
    } else {
      selectedOptions = [...selectedOptions, option]
    }
  }

  function submitMultipleChoice() {
    if (selectedOptions.length === 0) return
    sendAnswer(JSON.stringify(selectedOptions))
  }

  function goHome() {
    sessionStorage.removeItem("hostId")
    sessionStorage.removeItem("nickname")
    connectionManager.destroy()
    goto("/")
  }
</script>

<div class="container mx-auto p-4 max-w-md min-h-screen flex flex-col">
  <!-- Connection Status Indicator -->
  <div class="fixed top-2 right-2 z-50">
    {#if $connectionStore.status === "connecting" || $connectionStore.status === "reconnecting"}
      <div class="badge badge-warning gap-2 animate-pulse">連線中...</div>
    {:else if $connectionStore.status === "disconnected"}
      <div class="badge badge-error gap-2">已斷線</div>
    {:else if $connectionStore.status === "connected"}
      <div class="badge badge-success badge-xs p-1"></div>
    {/if}
  </div>

  {#if $connectionStore.status === "disconnected" && !$connectionStore.peerId}
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
        {#if $gameStore.currentQuestion.type === "text"}
          <div class="form-control">
            <textarea
              class="textarea textarea-bordered h-24 text-lg"
              placeholder="請輸入答案..."
              bind:value={selectedOption}
              disabled={hasAnswered ||
                $gameStore.timeRemaining <= 0 ||
                $gameStore.isPaused}
            ></textarea>
            <button
              class="btn btn-primary mt-4"
              onclick={() => selectedOption && sendAnswer(selectedOption)}
              disabled={!selectedOption ||
                hasAnswered ||
                $gameStore.timeRemaining <= 0 ||
                $gameStore.isPaused}
            >
              送出答案
            </button>
          </div>
        {:else if $gameStore.currentQuestion.type === "multiple_choice"}
          {#each $gameStore.currentQuestion.options as option}
            <button
              class="btn btn-lg h-auto py-4 text-lg
                {selectedOptions.includes(option)
                ? 'btn-primary'
                : 'btn-outline'}
                {hasAnswered ? 'opacity-50' : ''}"
              onclick={() => toggleOption(option)}
              disabled={$gameStore.isPaused ||
                hasAnswered ||
                $gameStore.timeRemaining <= 0}
            >
              {option}
              {#if selectedOptions.includes(option)}
                <span class="ml-2 badge badge-sm">✓</span>
              {/if}
            </button>
          {/each}
          <button
            class="btn btn-success mt-4"
            onclick={submitMultipleChoice}
            disabled={selectedOptions.length === 0 ||
              hasAnswered ||
              $gameStore.timeRemaining <= 0 ||
              $gameStore.isPaused}
          >
            送出答案 ({selectedOptions.length})
          </button>
        {:else}
          {#each $gameStore.currentQuestion.options as option}
            <button
              class="btn btn-lg h-auto py-4 text-lg
                {selectedOption === option ? 'btn-primary' : 'btn-outline'}
                {hasAnswered && selectedOption !== option ? 'opacity-50' : ''}"
              onclick={() => sendAnswer(option)}
              disabled={$gameStore.isPaused ||
                hasAnswered ||
                $gameStore.timeRemaining <= 0}
            >
              {option}
            </button>
          {/each}
        {/if}
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
  {:else if $gameStore.status === "review"}
    <div class="hero my-auto">
      <div class="hero-content text-center">
        <div class="max-w-md">
          <h2 class="text-3xl font-bold mb-4">答案審閱</h2>

          {#if $gameStore.currentQuestion}
            <div class="mb-6">
              <p class="text-lg mb-2">{$gameStore.currentQuestion.text}</p>
              <div class="alert alert-success">
                <span class="font-bold"
                  >正確答案: {$gameStore.currentQuestion.correctAnswer}</span
                >
              </div>
            </div>

            {#if $connectionStore.peerId}
              {@const myPlayer = $gameStore.players.find(
                (p) => p.id === $connectionStore.peerId,
              )}
              {#if myPlayer}
                <div class="stat bg-base-200 rounded-box">
                  <div class="stat-title">目前得分</div>
                  <div class="stat-value">{myPlayer.score}</div>
                </div>
              {/if}
            {/if}
          {/if}

          <p class="py-4 text-base-content/60">等待主持人進入下一題...</p>
          <div class="loading loading-dots loading-md"></div>
        </div>
      </div>
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

          <button class="btn btn-primary btn-wide" onclick={goHome}
            >回到首頁</button
          >
        </div>
      </div>
    </div>
  {/if}
</div>
