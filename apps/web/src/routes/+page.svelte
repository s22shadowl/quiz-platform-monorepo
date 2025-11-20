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
        Quiz Platform
      </h1>
      <p class="py-6 text-lg text-base-content/80">
        The ultimate P2P quiz experience. Host games, challenge friends, and
        track your victory. No server required.
      </p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <a
          href="/host/quizzes"
          class="btn btn-primary btn-lg shadow-lg hover:scale-105 transition-transform"
        >
          Host Game
        </a>
        <a
          href="/join"
          class="btn btn-outline btn-lg shadow-lg hover:scale-105 transition-transform"
        >
          Join Game
        </a>
      </div>
    </div>
  </div>
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
