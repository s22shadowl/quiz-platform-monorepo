<script lang="ts">
  import { createEventDispatcher } from "svelte"
  import type { Question } from "$lib/types"

  export let question: Question
  export let index: number

  const dispatch = createEventDispatcher<{
    update: Question
    delete: void
  }>()

  function updateField(
    field: keyof Question,
    value: string | number | string[],
  ) {
    dispatch("update", { ...question, [field]: value })
  }

  function updateOption(optIndex: number, value: string) {
    const newOptions = [...question.options]
    newOptions[optIndex] = value
    // If the changed option was the correct answer, update that too (optional logic, but good for UX)
    if (question.options[optIndex] === question.correctAnswer) {
      updateField("correctAnswer", value)
    } else {
      updateField("options", newOptions)
    }
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
    const newOptions = question.options.filter((_, i) => i !== optIndex)
    updateField("options", newOptions)
  }
</script>

<div class="card bg-base-100 shadow-md border border-base-200">
  <div class="card-body p-6">
    <div class="flex justify-between items-start">
      <h3 class="card-title text-lg">Question {index}</h3>
      <button
        class="btn btn-square btn-ghost btn-sm text-error"
        on:click={() => dispatch("delete")}
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

    <!-- Question Text -->
    <div class="form-control w-full">
      <label class="label py-1" for={`question-text-${question.id}`}>
        <span class="label-text-alt">Question Text</span>
      </label>
      <input
        id={`question-text-${question.id}`}
        type="text"
        value={question.text}
        on:input={(e) => updateField("text", e.currentTarget.value)}
        class="input input-bordered font-semibold"
        placeholder="Enter question text..."
      />
    </div>

    <!-- Media URL -->
    <div class="form-control w-full mt-2">
      <label class="label py-1" for={`media-url-${question.id}`}>
        <span class="label-text-alt">Image/Video URL (Optional)</span>
      </label>
      <input
        id={`media-url-${question.id}`}
        type="text"
        value={question.mediaUrl || ""}
        on:input={(e) => updateField("mediaUrl", e.currentTarget.value)}
        class="input input-bordered input-sm"
        placeholder="https://..."
      />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      <!-- Time Limit -->
      <div class="form-control">
        <label class="label py-1" for={`time-limit-${question.id}`}>
          <span class="label-text-alt">Time Limit (seconds)</span>
        </label>
        <select
          id={`time-limit-${question.id}`}
          class="select select-bordered select-sm"
          value={question.timeLimit}
          on:change={(e) =>
            updateField("timeLimit", parseInt(e.currentTarget.value))}
        >
          <option value={10}>10s</option>
          <option value={20}>20s</option>
          <option value={30}>30s</option>
          <option value={60}>60s</option>
          <option value={90}>90s</option>
          <option value={120}>120s</option>
        </select>
      </div>

      <!-- Points -->
      <div class="form-control">
        <label class="label py-1" for={`points-${question.id}`}>
          <span class="label-text-alt">Points</span>
        </label>
        <select
          id={`points-${question.id}`}
          class="select select-bordered select-sm"
          value={question.points}
          on:change={(e) =>
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
    <div class="divider my-2">Options</div>
    <div class="space-y-2">
      {#each question.options as option, i}
        <div class="flex items-center gap-2">
          <input
            type="radio"
            name={`correct-${question.id}`}
            class="radio radio-primary"
            checked={question.correctAnswer === option}
            on:change={() => updateField("correctAnswer", option)}
          />
          <input
            type="text"
            value={option}
            on:input={(e) => updateOption(i, e.currentTarget.value)}
            class="input input-bordered input-sm w-full"
            class:input-primary={question.correctAnswer === option}
          />
          <button
            class="btn btn-square btn-ghost btn-sm"
            disabled={question.options.length <= 2}
            on:click={() => removeOption(i)}
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
          on:click={addOption}
        >
          + Add Option
        </button>
      {/if}
    </div>
  </div>
</div>
