<script lang="ts">
  import { onMount } from "svelte"
  import { storage } from "$lib/storage"
  import type { GameHistory } from "$lib/types"

  let history: GameHistory[] = []

  onMount(() => {
    history = storage.getHistory().sort((a, b) => b.playedAt - a.playedAt)
  })

  function formatDate(timestamp: number) {
    return new Date(timestamp).toLocaleString()
  }
</script>

<div class="container mx-auto p-4">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-3xl font-bold">Game History</h1>
    <a href="/host/quizzes" class="btn btn-outline">Back to Quizzes</a>
  </div>

  {#if history.length === 0}
    <div class="text-center py-12 text-base-content/50">
      <p class="text-xl">No games played yet.</p>
    </div>
  {:else}
    <div class="grid gap-6">
      {#each history as game}
        <div class="card bg-base-100 shadow-xl border border-base-300">
          <div class="card-body">
            <div class="flex justify-between items-start">
              <div>
                <h2 class="card-title text-2xl">{game.quizTitle}</h2>
                <p class="text-sm text-base-content/60">
                  {formatDate(game.playedAt)}
                </p>
              </div>
              <div class="badge badge-primary">
                {game.players.length} Players
              </div>
            </div>

            <div class="divider"></div>

            <div class="overflow-x-auto">
              <table class="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Nickname</th>
                    <th class="text-right">Score</th>
                    <th class="text-right">Streak</th>
                  </tr>
                </thead>
                <tbody>
                  {#each game.players as player, i}
                    <tr>
                      <td class="font-bold">#{i + 1}</td>
                      <td>{player.nickname}</td>
                      <td class="text-right font-mono">{player.score}</td>
                      <td class="text-right font-mono">{player.streak}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
