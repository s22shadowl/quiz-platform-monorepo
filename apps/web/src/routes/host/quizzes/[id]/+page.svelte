<script lang="ts">
  import { page } from "$app/stores"
  import { onMount } from "svelte"
  import { quizStore } from "$lib/stores/quizStore"
  import type { Quiz, Question } from "$lib/types"
  import { v4 as uuidv4 } from "uuid"
  import QuestionEditor from "$lib/components/QuestionEditor.svelte"

  let quizId: string
  let quiz: Quiz | undefined

  $: quizId = $page.params.id ?? ""
  $: quiz = $quizStore.find((q) => q.id === quizId)

  onMount(() => {
    quizStore.load()
  })

  let lastSaved: number | null = null
  let saveTimeout: ReturnType<typeof setTimeout>

  function showSaveFeedback() {
    lastSaved = Date.now()
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
      lastSaved = null
    }, 2000)
  }

  function updateTitle(e: Event) {
    if (!quiz) return
    const target = e.target as HTMLInputElement
    quizStore.updateQuiz({
      ...quiz,
      title: target.value,
      updatedAt: Date.now(),
    })
    showSaveFeedback()
  }

  function updateDescription(e: Event) {
    if (!quiz) return
    const target = e.target as HTMLTextAreaElement
    quizStore.updateQuiz({
      ...quiz,
      description: target.value,
      updatedAt: Date.now(),
    })
    showSaveFeedback()
  }

  function addQuestion() {
    if (!quiz) return
    const newQuestion: Question = {
      id: uuidv4(),
      text: "新題目",
      type: "choice",
      options: ["選項 1", "選項 2", "選項 3", "選項 4"],
      correctAnswer: "選項 1",
      timeLimit: 30,
      points: 100,
    }
    const updatedQuestions = [...quiz.questions, newQuestion]
    quizStore.updateQuiz({
      ...quiz,
      questions: updatedQuestions,
      updatedAt: Date.now(),
    })
    showSaveFeedback()
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
    showSaveFeedback()
  }

  function deleteQuestion(questionId: string) {
    if (!quiz) return
    if (!confirm("確定要刪除此題目嗎？")) return
    const updatedQuestions = quiz.questions.filter((q) => q.id !== questionId)
    quizStore.updateQuiz({
      ...quiz,
      questions: updatedQuestions,
      updatedAt: Date.now(),
    })
    showSaveFeedback()
  }
</script>

<div class="container mx-auto p-4 max-w-4xl">
  <div class="flex justify-between items-center mb-4">
    <div class="text-sm breadcrumbs">
      <ul>
        <li><a href="/host/quizzes">我的測驗</a></li>
        <li>編輯測驗</li>
      </ul>
    </div>
    {#if lastSaved}
      <div class="badge badge-success gap-2 animate-pulse">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          class="inline-block w-4 h-4 stroke-current"
          ><path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          ></path></svg
        >
        已儲存
      </div>
    {/if}
  </div>

  {#if quiz}
    <div class="card bg-base-100 shadow-xl mb-8 border border-base-200">
      <div class="card-body">
        <div class="form-control w-full">
          <label class="label" for="quiz-title">
            <span class="label-text font-bold text-lg">測驗標題</span>
          </label>
          <input
            id="quiz-title"
            type="text"
            value={quiz.title}
            on:input={updateTitle}
            class="input input-bordered w-full text-xl font-bold focus:input-primary"
          />
        </div>

        <div class="form-control w-full mt-4">
          <label class="label" for="quiz-desc">
            <span class="label-text">描述</span>
          </label>
          <textarea
            id="quiz-desc"
            value={quiz.description}
            on:input={updateDescription}
            class="textarea textarea-bordered h-24"
            placeholder="輸入測驗描述..."
          ></textarea>
        </div>
      </div>
    </div>

    <div class="flex justify-between items-center mb-4">
      <h2 class="text-2xl font-bold">題目列表 ({quiz.questions.length})</h2>
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
        新增題目
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
      <span>找不到測驗。</span>
    </div>
  {/if}
</div>
