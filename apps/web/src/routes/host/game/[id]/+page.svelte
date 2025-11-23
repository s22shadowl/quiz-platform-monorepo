<script lang="ts">
  import { onMount } from "svelte"
  import { page } from "$app/stores"
  import { connectionStore } from "$lib/stores/connectionStore"
  import { beforeNavigate } from "$app/navigation"
  import { gameStore } from "$lib/stores/gameStore"
  import { quizStore } from "$lib/stores/quizStore"
  import { goto } from "$app/navigation"

  import { connectionManager } from "$lib/connection"

  let quizId: string
  let copied = false

  $: quizId = $page.params.id ?? ""

  onMount(async () => {
    // Ensure we have the quiz loaded
    if ($quizStore.length === 0) {
      quizStore.load()
    }

    const quiz = $quizStore.find((q) => q.id === quizId)
    if (quiz) {
      gameStore.initGame(quiz)
      // Initialize P2P connection if not already connected
      if (!$connectionStore.peerId) {
        await connectionManager.init({ isHost: true })
      }
    } else {
      alert("找不到測驗！")
      goto("/host/quizzes")
    }
  })

  // Prevent accidental navigation
  beforeNavigate(({ cancel }) => {
    if ($gameStore.status === "playing") {
      if (!confirm("遊戲正在進行中，確定要離開嗎？這將會結束遊戲。")) {
        cancel()
      } else {
        // If confirmed, we should probably notify players or clean up,
        // but for now just letting them leave is fine as the connection will drop.
      }
    }
  })

  // Prevent accidental refresh/close
  function handleBeforeUnload(e: BeforeUnloadEvent) {
    if ($gameStore.status === "playing") {
      e.preventDefault()
      e.returnValue = ""
      return ""
    }
  }

  function startGame() {
    gameStore.startGame()
  }

  function nextQuestion() {
    gameStore.nextQuestion()
  }

  function endGame() {
    if (confirm("確定要結束遊戲嗎？")) {
      gameStore.endGame()
      // Give a moment for the message to be sent before navigating/destroying
      setTimeout(() => {
        connectionManager.destroy()
        goto("/host/quizzes")
      }, 500)
    }
  }

  function togglePause() {
    gameStore.togglePause()
  }

  function copyRoomId() {
    if ($connectionStore.peerId) {
      navigator.clipboard.writeText($connectionStore.peerId)
      copied = true
      setTimeout(() => (copied = false), 2000)
    }
  }
</script>

<svelte:window on:beforeunload={handleBeforeUnload} />

<div class="container mx-auto p-4">
  {#if $gameStore.quiz}
    <div
      class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4"
    >
      <div>
        <h1 class="text-2xl font-bold">主持人: {$gameStore.quiz.title}</h1>
        {#if $connectionStore.peerId}
          <button
            class="btn btn-xs btn-ghost gap-2 mt-1"
            on:click={copyRoomId}
            title="點擊複製"
          >
            <span class="text-base-content/60">房間 ID:</span>
            <span class="font-mono font-bold">{$connectionStore.peerId}</span>
            {#if copied}
              <span class="text-success text-xs">已複製</span>
            {/if}
          </button>
        {/if}
      </div>
      <div class="flex items-center gap-2">
        {#if $gameStore.status === "playing"}
          <button class="btn btn-warning btn-sm" on:click={togglePause}>
            {$gameStore.isPaused ? "繼續" : "暫停"}
          </button>
        {/if}
        <div class="badge badge-primary badge-lg">
          {$gameStore.status.toUpperCase()}
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left Column: Game Control -->
      <div class="col-span-2 space-y-6">
        {#if $gameStore.status === "lobby"}
          <div class="card bg-base-200 shadow-xl">
            <div class="card-body items-center text-center">
              <h2 class="card-title text-3xl mb-4">等待玩家中...</h2>
              <button
                class="btn btn-primary btn-lg btn-wide"
                on:click={startGame}>開始遊戲</button
              >
            </div>
          </div>
        {:else if $gameStore.status === "playing"}
          <div class="card bg-base-100 shadow-xl border border-base-300">
            <div class="card-body">
              <div
                class="flex justify-between text-sm font-bold text-base-content/60 mb-2"
              >
                <span
                  >題目 {$gameStore.currentQuestionIndex + 1} / {$gameStore.quiz
                    .questions.length}</span
                >
                <span class:text-error={$gameStore.timeRemaining <= 5}
                  >時間: {$gameStore.timeRemaining}s</span
                >
              </div>

              {#if $gameStore.currentQuestion}
                <h2 class="text-2xl font-bold mb-6">
                  {$gameStore.currentQuestion.text}
                </h2>
                {#if $gameStore.currentQuestion.mediaUrl}
                  <div class="mb-4">
                    <!-- svelte-ignore a11y-missing-attribute -->
                    <img
                      src={$gameStore.currentQuestion.mediaUrl}
                      class="max-h-64 rounded-lg mx-auto"
                    />
                  </div>
                {/if}

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {#each $gameStore.currentQuestion.options as option}
                    <div
                      class="p-4 bg-base-200 rounded-lg border border-base-300 flex items-center gap-3"
                    >
                      <span>{option}</span>
                    </div>
                  {/each}
                </div>
              {/if}

              <div class="card-actions justify-end mt-8">
                <button class="btn btn-secondary" on:click={nextQuestion}
                  >下一題</button
                >
              </div>
            </div>
          </div>
        {:else if $gameStore.status === "finished"}
          <div class="card bg-base-200 shadow-xl">
            <div class="card-body items-center text-center">
              <h2 class="card-title text-3xl mb-4">遊戲結束！</h2>
              <button class="btn btn-primary" on:click={endGame}
                >回到選單</button
              >
            </div>
          </div>
        {/if}
      </div>

      <!-- Right Column: Players & Leaderboard -->
      <div class="card bg-base-100 shadow-xl border border-base-300 h-fit">
        <div class="card-body">
          <h3 class="card-title text-lg mb-4">
            玩家 ({$gameStore.players.length})
          </h3>
          <div class="overflow-y-auto max-h-[600px]">
            <table class="table table-zebra w-full">
              <thead>
                <tr>
                  <th>暱稱</th>
                  <th class="text-right">分數</th>
                </tr>
              </thead>
              <tbody>
                {#each $gameStore.players as player}
                  <tr>
                    <td class="font-bold">{player.nickname}</td>
                    <td class="text-right">{player.score}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  {:else}
    <div class="flex justify-center items-center h-64">
      <span class="loading loading-spinner loading-lg"></span>
    </div>
  {/if}
</div>
