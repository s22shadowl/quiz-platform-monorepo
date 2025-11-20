<script lang="ts">
  import { page } from "$app/stores"
  import { onMount } from "svelte"
  import { quizStore } from "$lib/stores/quizStore"
  import type { Quiz, Question } from "$lib/types"
  import { v4 as uuidv4 } from "uuid"
  import QuestionEditor from "$lib/components/QuestionEditor.svelte"

  let quizId: string
  let quiz: Quiz | undefined

  $: quizId = $page.params.id
  $: quiz = $quizStore.find((q) => q.id === quizId)

  onMount(() => {
    quizStore.load()
  })

  function updateTitle(e: Event) {
    if (!quiz) return
    const target = e.target as HTMLInputElement
    quizStore.updateQuiz({
      ...quiz,
      title: target.value,
      updatedAt: Date.now(),
    })
  }

  function updateDescription(e: Event) {
    if (!quiz) return
    const target = e.target as HTMLTextAreaElement
    quizStore.updateQuiz({
      ...quiz,
      description: target.value,
      updatedAt: Date.now(),
    })
  }

  function addQuestion() {
    if (!quiz) return
    const newQuestion: Question = {
      id: uuidv4(),
      text: "New Question",
      type: "choice",
      options: ["Option 1", "Option 2", "Option 3", "Option 4"],
      correctAnswer: "Option 1",
      timeLimit: 30,
      points: 100,
    }
    const updatedQuestions = [...quiz.questions, newQuestion]
    quizStore.updateQuiz({
      ...quiz,
      questions: updatedQuestions,
      updatedAt: Date.now(),
    })
  }

  function updateQuestion(updatedQuestion: Question) {
    if (!quiz) return
    const updatedQuestions = quiz.questions.map((q) =>
      q.id === updatedQuestion.id ? updatedQuestion : q,
    )
    quizStore.updateQuiz({
      ...quiz,
      questions: updatedQuestions,
      updatedAt: Date.now(),
    })
  }

  function deleteQuestion(questionId: string) {
    if (!quiz) return
    if (!confirm("Delete this question?")) return
    const updatedQuestions = quiz.questions.filter((q) => q.id !== questionId)
    quizStore.updateQuiz({
      ...quiz,
      questions: updatedQuestions,
      updatedAt: Date.now(),
    })
  }
</script>

<div class="container mx-auto p-4 max-w-4xl">
  <div class="text-sm breadcrumbs mb-4">
    <ul>
      <li><a href="/host/quizzes">My Quizzes</a></li>
      <li>Edit Quiz</li>
    </ul>
  </div>

  {#if quiz}
    <div class="card bg-base-100 shadow-xl mb-8">
      <div class="card-body">
        <div class="form-control w-full">
          <label class="label" for="quiz-title">
            <span class="label-text font-bold">Quiz Title</span>
          </label>
          <input
            id="quiz-title"
            type="text"
            value={quiz.title}
            on:input={updateTitle}
            class="input input-bordered w-full text-xl font-bold"
          />
        </div>

        <div class="form-control w-full mt-4">
          <label class="label" for="quiz-desc">
            <span class="label-text">Description</span>
          </label>
          <textarea
            id="quiz-desc"
            value={quiz.description}
            on:input={updateDescription}
            class="textarea textarea-bordered h-24"
            placeholder="Enter quiz description..."
          ></textarea>
        </div>
      </div>
    </div>

    <div class="flex justify-between items-center mb-4">
      <h2 class="text-2xl font-bold">Questions ({quiz.questions.length})</h2>
      <button class="btn btn-primary" on:click={addQuestion}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 mr-2"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
            clip-rule="evenodd"
          />
        </svg>
        Add Question
      </button>
    </div>

    <div class="space-y-6">
      {#each quiz.questions as question, index (question.id)}
        <QuestionEditor
          {question}
          index={index + 1}
          on:update={(e) => updateQuestion(e.detail)}
          on:delete={() => deleteQuestion(question.id)}
        />
      {/each}
    </div>
  {:else}
    <div class="alert alert-error">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="stroke-current shrink-0 h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        ><path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
        /></svg
      >
      <span>Quiz not found.</span>
    </div>
  {/if}
</div>
