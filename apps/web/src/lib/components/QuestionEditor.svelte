<script lang="ts">
  import { createEventDispatcher } from "svelte"
  import type { Question } from "$lib/types"

  interface Props {
    question: Question
    index: number
  }

  let { question, index }: Props = $props()

  const dispatch = createEventDispatcher<{
    update: Question
    delete: void
    moveUp: void
    moveDown: void
  }>()

  function updateField(
    field: keyof Question,
    value: string | number | string[] | undefined,
  ) {
    dispatch("update", { ...question, [field]: value })
  }

  function updateOption(optIndex: number, value: string) {
    const newOptions = [...question.options]
    const oldOption = newOptions[optIndex]
    newOptions[optIndex] = value

    // Update correct answer(s) if the option text changed
    if (question.type === "multiple_choice") {
      if (question.correctAnswers?.includes(oldOption)) {
        const newCorrectAnswers = question.correctAnswers.map((a) =>
          a === oldOption ? value : a,
        )
        updateField("correctAnswers", newCorrectAnswers)
      }
    } else {
      if (question.correctAnswer === oldOption) {
        updateField("correctAnswer", value)
      }
    }
    updateField("options", newOptions)
  }

  function toggleCorrectAnswer(option: string) {
    const current = question.correctAnswers || []
    let newCorrectAnswers: string[]
    if (current.includes(option)) {
      newCorrectAnswers = current.filter((a) => a !== option)
    } else {
      newCorrectAnswers = [...current, option]
    }
    updateField("correctAnswers", newCorrectAnswers)
  }

  function addOption() {
    const newOptions = [
      ...question.options,
      `Option ${question.options.length + 1}`,
    ]
    updateField("options", newOptions)
  }

  function removeOption(optIndex: number) {
    if (question.options.length <= 2) return // Minimum 2 options
    const removedOption = question.options[optIndex]
    const newOptions = question.options.filter((_, i) => i !== optIndex)

    // Clean up correct answer(s)
    if (question.type === "multiple_choice") {
      if (question.correctAnswers?.includes(removedOption)) {
        const newCorrectAnswers = question.correctAnswers.filter(
          (a) => a !== removedOption,
        )
        updateField("correctAnswers", newCorrectAnswers)
      }
    } else {
      if (question.correctAnswer === removedOption) {
        updateField("correctAnswer", newOptions[0] || "")
      }
    }

    updateField("options", newOptions)
  }

  function handleImageError(e: Event) {
    const img = e.currentTarget as HTMLImageElement
    img.style.display = "none"
  }
</script>

<div class="card bg-base-100 shadow-md border border-base-200">
  <div class="card-body p-6">
    <div class="flex justify-between items-start">
      <h3 class="card-title text-lg">題目 {index}</h3>
      <div class="flex gap-2">
        <button
          class="btn btn-square btn-ghost btn-sm"
          onclick={() => dispatch("moveUp")}
          disabled={index === 1}
          title="上移"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
        <button
          class="btn btn-square btn-ghost btn-sm"
          onclick={() => dispatch("moveDown")}
          title="下移"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
        <button
          class="btn btn-square btn-ghost btn-sm text-error"
          onclick={() => dispatch("delete")}
          title="刪除"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            /></svg
          >
        </button>
      </div>
    </div>

    <!-- Question Text -->
    <div class="form-control w-full">
      <label class="label py-1" for={`question-text-${question.id}`}>
        <span class="label-text-alt">題目內容</span>
      </label>
      <input
        id={`question-text-${question.id}`}
        type="text"
        value={question.text}
        oninput={(e) => updateField("text", e.currentTarget.value)}
        class="input input-bordered font-semibold"
        placeholder="輸入題目..."
      />
    </div>

    <!-- Question Type -->
    <div class="form-control w-full mt-2">
      <label class="label py-1" for={`question-type-${question.id}`}>
        <span class="label-text-alt">題目類型</span>
      </label>
      <select
        id={`question-type-${question.id}`}
        class="select select-bordered select-sm"
        value={question.type}
        onchange={(e) => updateField("type", e.currentTarget.value)}
      >
        <option value="choice">單選題 (Choice)</option>
        <option value="multiple_choice">複選題 (Multiple Choice)</option>
        <option value="text">簡答題 (Short Answer)</option>
      </select>
    </div>

    <!-- Media URL -->
    <div class="form-control w-full mt-2">
      <label class="label py-1" for={`media-url-${question.id}`}>
        <span class="label-text-alt">圖片/影片 URL (選填)</span>
      </label>
      <input
        id={`media-url-${question.id}`}
        type="text"
        value={question.mediaUrl || ""}
        oninput={(e) => updateField("mediaUrl", e.currentTarget.value)}
        class="input input-bordered input-sm"
        placeholder="https://..."
      />
      {#if question.mediaUrl}
        <div
          class="mt-2 rounded-lg overflow-hidden border border-base-300 bg-base-200 flex justify-center items-center h-48 relative"
        >
          <img
            src={question.mediaUrl}
            alt="Preview"
            class="max-h-full max-w-full object-contain"
            onerror={handleImageError}
          />
          <span class="absolute text-xs text-base-content/50 -z-10"
            >預覽圖片</span
          >
        </div>
      {/if}
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      <!-- Time Limit -->
      <div class="form-control">
        <label class="label py-1" for={`time-limit-${question.id}`}>
          <span class="label-text-alt">時間限制 (秒)</span>
        </label>
        <select
          id={`time-limit-${question.id}`}
          class="select select-bordered select-sm"
          value={question.timeLimit}
          onchange={(e) =>
            updateField("timeLimit", parseInt(e.currentTarget.value))}
        >
          <option value={10}>10秒</option>
          <option value={20}>20秒</option>
          <option value={30}>30秒</option>
          <option value={60}>60秒</option>
          <option value={90}>90秒</option>
          <option value={120}>120秒</option>
        </select>
      </div>

      <!-- Points -->
      <div class="form-control">
        <label class="label py-1" for={`points-${question.id}`}>
          <span class="label-text-alt">分數</span>
        </label>
        <select
          id={`points-${question.id}`}
          class="select select-bordered select-sm"
          value={question.points}
          onchange={(e) =>
            updateField("points", parseInt(e.currentTarget.value))}
        >
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value={200}>200</option>
          <option value={500}>500</option>
          <option value={1000}>1000</option>
        </select>
      </div>
    </div>

    <!-- Options -->
    {#if question.type === "text"}
      <div class="divider my-2">答案設定</div>
      <div class="alert alert-info text-sm">
        簡答題需由主持人手動評分，無須設定標準答案。
      </div>
    {:else}
      <div class="divider my-2">選項</div>
      <div class="space-y-2">
        {#each question.options as option, i}
          <div class="flex items-center gap-2">
            {#if question.type === "multiple_choice"}
              <input
                type="checkbox"
                class="checkbox checkbox-primary"
                checked={question.correctAnswers?.includes(option)}
                onchange={() => toggleCorrectAnswer(option)}
              />
            {:else}
              <input
                type="radio"
                name={`correct-${question.id}`}
                class="radio radio-primary"
                checked={question.correctAnswer === option}
                onchange={() => updateField("correctAnswer", option)}
              />
            {/if}
            <input
              type="text"
              value={option}
              oninput={(e) => updateOption(i, e.currentTarget.value)}
              class="input input-bordered input-sm w-full"
              class:input-primary={question.type === "multiple_choice"
                ? question.correctAnswers?.includes(option)
                : question.correctAnswer === option}
            />
            <button
              class="btn btn-square btn-ghost btn-sm"
              disabled={question.options.length <= 2}
              onclick={() => removeOption(i)}
              aria-label="移除選項"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                ><path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M20 12H4"
                /></svg
              >
            </button>
          </div>
        {/each}

        {#if question.options.length < 6}
          <button
            class="btn btn-ghost btn-sm btn-block mt-2 border-dashed border-2 border-base-300"
            onclick={addOption}
          >
            + 新增選項
          </button>
        {/if}
      </div>
    {/if}
  </div>
</div>
