<script lang="ts">
  import { onMount } from "svelte"
  import { quizStore } from "$lib/stores/quizStore"
  import { goto } from "$app/navigation"
  import { v4 as uuidv4 } from "uuid"
  import type { Quiz } from "$lib/types"

  onMount(() => {
    quizStore.load()
  })

  function createNewQuiz() {
    const newQuiz: Quiz = {
      id: uuidv4(),
      title: "New Quiz",
      description: "",
      questions: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    quizStore.add(newQuiz)
    goto(`/host/quizzes/${newQuiz.id}`)
  }

  function deleteQuiz(id: string) {
    if (confirm("Are you sure you want to delete this quiz?")) {
      quizStore.remove(id)
    }
  }
</script>

<div class="container mx-auto">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-3xl font-bold">My Quizzes</h1>
    <div class="flex gap-2">
      <a href="/host/history" class="btn btn-ghost">History</a>
      <button class="btn btn-primary" on:click={createNewQuiz}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v16m8-8H4"
          />
        </svg>
        Create Quiz
      </button>
    </div>
  </div>

  {#if $quizStore.length === 0}
    <div class="hero bg-base-200 rounded-box p-10">
      <div class="hero-content text-center">
        <div class="max-w-md">
          <h2 class="text-2xl font-bold">No Quizzes Found</h2>
          <p class="py-6">
            You haven't created any quizzes yet. Click the button above to get
            started!
          </p>
        </div>
      </div>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each $quizStore as quiz (quiz.id)}
        <div class="card bg-base-100 shadow-xl border border-base-200">
          <div class="card-body">
            <h2 class="card-title">{quiz.title}</h2>
            <p class="text-sm text-base-content/70">
              {quiz.description || "No description"}
            </p>
            <div class="badge badge-outline mt-2">
              {quiz.questions.length} Questions
            </div>
            <div class="card-actions justify-end mt-4">
              <a href="/host/game/{quiz.id}" class="btn btn-primary btn-sm"
                >Play</a
              >
              <a href="/host/quizzes/{quiz.id}" class="btn btn-ghost btn-sm"
                >Edit</a
              >
              <button
                class="btn btn-ghost btn-sm text-error"
                on:click={() => deleteQuiz(quiz.id)}>Delete</button
              >
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
