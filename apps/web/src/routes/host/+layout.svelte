<script>
  import { page } from '$app/stores';
</script>

<div class="drawer lg:drawer-open">
  <input id="host-drawer" type="checkbox" class="drawer-toggle" />
  <div class="drawer-content flex flex-col">
    <!-- Navbar -->
    <div class="w-full navbar bg-base-300 lg:hidden">
      <div class="flex-none lg:hidden">
        <label for="host-drawer" class="btn btn-square btn-ghost">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-6 h-6 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </label>
      </div> 
      <div class="flex-1 px-2 mx-2">Quiz Platform Host</div>
    </div>
    
    <!-- Page Content -->
    <div class="p-4">
      <slot />
    </div>
  </div> 
  
  <div class="drawer-side">
    <label for="host-drawer" class="drawer-overlay"></label> 
    <ul class="menu p-4 w-80 min-h-full bg-base-200 text-base-content">
      <!-- Sidebar content here -->
      <li class="mb-4 text-xl font-bold px-4">Host Control</li>
      <li><a href="/host/quizzes" class:active={$page.url.pathname.startsWith('/host/quizzes')}>My Quizzes</a></li>
      <li><a href="/host/history" class:active={$page.url.pathname.startsWith('/host/history')}>History</a></li>
      <div class="divider"></div>
      <li><a href="/">Back to Home</a></li>
    </ul>
  </div>
</div>
