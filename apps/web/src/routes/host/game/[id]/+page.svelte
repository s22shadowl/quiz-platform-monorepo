<script lang="ts">
  import { onMount } from "svelte"
  import { page } from "$app/stores"
  import { gameStore } from "$lib/stores/gameStore"
  import { quizStore } from "$lib/stores/quizStore"
  import { goto } from "$app/navigation"

  let quizId: string

  $: quizId = $page.params.id ?? ""

  onMount(async () => {
    // Ensure we have the quiz loaded
    if ($quizStore.length === 0) {
      quizStore.load()
    }

    const quiz = $quizStore.find((q) => q.id === quizId)
    if (quiz) {
      gameStore.initGame(quiz)
    } else {
      alert("Quiz not found!")
      goto("/host/quizzes")
    }
  })

  function startGame() {
    gameStore.startGame()
  }

  function nextQuestion() {
    gameStore.nextQuestion()
  }

  function endGame() {
    // gameStore.endGame(); // TODO: Implement end game
    goto("/host/quizzes")
  }
</script>

<div class="container mx-auto p-4">
  {#if $gameStore.quiz}
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Host: {$gameStore.quiz.title}</h1>
      <div class="badge badge-primary badge-lg">
        {$gameStore.status.toUpperCase()}
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left Column: Game Control -->
      <div class="col-span-2 space-y-6">
        {#if $gameStore.status === "lobby"}
          <div class="card bg-base-200 shadow-xl">
            <div class="card-body items-center text-center">
              <h2 class="card-title text-3xl mb-4">Waiting for Players...</h2>
              <button
                class="btn btn-primary btn-lg btn-wide"
                on:click={startGame}>Start Game</button
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
                  >Question {$gameStore.currentQuestionIndex + 1} / {$gameStore
                    .quiz.questions.length}</span
                >
                <span>Time: {$gameStore.timeRemaining}s</span>
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
                      {#if option === $gameStore.currentQuestion.correctAnswer}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="h-6 w-6 text-success"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          ><path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M5 13l4 4L19 7"
                          /></svg
                        >
                      {/if}
                      <span>{option}</span>
                    </div>
                  {/each}
                </div>
              {/if}

              <div class="card-actions justify-end mt-8">
                <button class="btn btn-secondary" on:click={nextQuestion}
                  >Next Question</button
                >
              </div>
            </div>
          </div>
        {:else if $gameStore.status === "finished"}
          <div class="card bg-base-200 shadow-xl">
            <div class="card-body items-center text-center">
              <h2 class="card-title text-3xl mb-4">Game Over!</h2>
              <button class="btn btn-primary" on:click={endGame}
                >Back to Menu</button
              >
            </div>
          </div>
        {/if}
      </div>

      <!-- Right Column: Players & Leaderboard -->
      <div class="card bg-base-100 shadow-xl border border-base-300 h-fit">
        <div class="card-body">
          <h3 class="card-title text-lg mb-4">
            Players ({$gameStore.players.length})
          </h3>
          <div class="overflow-y-auto max-h-[600px]">
            <table class="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Name</th>
                  <th class="text-right">Score</th>
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
