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
      title: "新測驗",
      description: "",
      questions: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    quizStore.add(newQuiz)
    goto(`/host/quizzes/${newQuiz.id}`)
  }

  function deleteQuiz(id: string) {
    if (confirm("確定要刪除此測驗嗎？")) {
      quizStore.remove(id)
    }
  }

  function exportQuiz(quiz: Quiz) {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(quiz, null, 2))
    const downloadAnchorNode = document.createElement("a")
    downloadAnchorNode.setAttribute("href", dataStr)
    downloadAnchorNode.setAttribute("download", `${quiz.title || "quiz"}.json`)
    document.body.appendChild(downloadAnchorNode) // required for firefox
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
  }

  let fileInput: HTMLInputElement

  function triggerImport() {
    fileInput.click()
  }

  function handleImport(e: Event) {
    const target = e.target as HTMLInputElement
    const file = target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string)
        // Basic validation
        if (!json.id || !json.title || !Array.isArray(json.questions)) {
          throw new Error("Invalid quiz format")
        }
        // Generate new ID to avoid conflicts
        json.id = uuidv4()
        json.createdAt = Date.now()
        json.updatedAt = Date.now()

        quizStore.add(json)
        alert("匯入成功！")
      } catch (err) {
        alert("匯入失敗：格式錯誤")
        console.error(err)
      } finally {
        target.value = "" // Reset input
      }
    }
    reader.readAsText(file)
  }
</script>

<div class="container mx-auto">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-3xl font-bold">我的測驗</h1>
    <div class="flex gap-2">
      <input
        type="file"
        accept=".json"
        class="hidden"
        bind:this={fileInput}
        on:change={handleImport}
      />
      <button class="btn btn-outline" on:click={triggerImport}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          class="w-6 h-6 mr-2 stroke-current"
          ><path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
          ></path></svg
        >
        匯入
      </button>
      <a href="/host/history" class="btn btn-ghost">歷史紀錄</a>
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
        建立測驗
      </button>
    </div>
  </div>

  {#if $quizStore.length === 0}
    <div class="hero bg-base-200 rounded-box p-10">
      <div class="hero-content text-center">
        <div class="max-w-md">
          <h2 class="text-2xl font-bold">找不到測驗</h2>
          <p class="py-6">您尚未建立任何測驗。點擊上方按鈕開始吧！</p>
        </div>
      </div>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each $quizStore as quiz (quiz.id)}
        <div class="card bg-base-100 shadow-xl border border-base-200">
          <div class="card-body">
            <div class="flex justify-between items-start">
              <h2 class="card-title">{quiz.title}</h2>
              <div class="dropdown dropdown-end">
                <div
                  role="button"
                  tabindex="0"
                  class="btn btn-ghost btn-circle btn-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    class="inline-block w-5 h-5 stroke-current"
                    ><path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                    ></path></svg
                  >
                </div>
                <ul
                  class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
                >
                  <li>
                    <button on:click={() => exportQuiz(quiz)}>匯出 JSON</button>
                  </li>
                  <li>
                    <button
                      class="text-error"
                      on:click={() => deleteQuiz(quiz.id)}>刪除</button
                    >
                  </li>
                </ul>
              </div>
            </div>
            <p class="text-sm text-base-content/70">
              {quiz.description || "無描述"}
            </p>
            <div class="badge badge-outline mt-2">
              {quiz.questions.length} 題
            </div>
            <div class="card-actions justify-end mt-4">
              <a href="/host/game/{quiz.id}" class="btn btn-primary btn-sm"
                >開始</a
              >
              <a href="/host/quizzes/{quiz.id}" class="btn btn-ghost btn-sm"
                >編輯</a
              >
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
