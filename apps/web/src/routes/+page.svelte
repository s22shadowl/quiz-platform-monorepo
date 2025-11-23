<script lang="ts">
</script>

<div class="hero min-h-screen bg-base-200 relative overflow-hidden">
  <!-- Background Decoration -->
  <div
    class="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none"
  >
    <div
      class="absolute -top-24 -left-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
    ></div>
    <div
      class="absolute top-1/2 right-0 w-80 h-80 bg-secondary/20 rounded-full blur-3xl"
    ></div>
    <div
      class="absolute bottom-0 left-1/3 w-64 h-64 bg-accent/20 rounded-full blur-3xl"
    ></div>
  </div>

  <div class="hero-content text-center z-10">
    <div class="max-w-md">
      <h1
        class="text-5xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent animate-gradient-x"
      >
        P2P 測驗平台
      </h1>
      <p class="py-6 text-lg text-base-content/80">
        極致的 P2P 測驗體驗。主持遊戲、挑戰朋友、追蹤戰績。無需伺服器。
      </p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <a
          href="/host/quizzes"
          class="btn btn-primary btn-lg shadow-lg hover:scale-105 transition-transform"
        >
          主持遊戲
        </a>
        <a
          href="/join"
          class="btn btn-outline btn-lg shadow-lg hover:scale-105 transition-transform"
        >
          加入遊戲
        </a>
      </div>
    </div>
  </div>

  <div class="fixed bottom-4 right-4">
    <button
      class="btn btn-circle btn-ghost bg-base-100 shadow-lg"
      on:click={() => {
        const modal = document.getElementById("project_info_modal")
        if (modal && "showModal" in modal) {
          // @ts-expect-error - showModal is not in HTMLElement type definition
          modal.showModal()
        }
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        class="w-6 h-6 stroke-current"
        ><path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        ></path></svg
      >
    </button>
  </div>

  <dialog id="project_info_modal" class="modal">
    <div class="modal-box">
      <h3 class="font-bold text-lg">P2P 測驗平台</h3>
      <p class="py-4">
        這是一個基於 P2P 技術的即時測驗平台，無需伺服器即可多人同樂。
      </p>
      <div class="divider">技術棧</div>
      <ul class="list-disc list-inside space-y-2">
        <li><strong>Frontend:</strong> SvelteKit + TailwindCSS + DaisyUI</li>
        <li><strong>P2P:</strong> PeerJS (WebRTC)</li>
        <li><strong>State:</strong> Svelte Stores</li>
        <li><strong>Storage:</strong> LocalStorage</li>
      </ul>
      <div class="modal-action">
        <form method="dialog">
          <button class="btn">關閉</button>
        </form>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>
</div>

<style>
  .animate-gradient-x {
    background-size: 200% 200%;
    animation: gradient-x 5s ease infinite;
  }

  @keyframes gradient-x {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
</style>
