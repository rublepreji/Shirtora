document
      .getElementById("changeEmailForm")
      .addEventListener("submit", function (event) {

        const emailInput = document.getElementById("newEmail");
        const newEmail = emailInput.value.trim();
        const statusMessage = document.getElementById("statusMessage");

        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        if (!newEmail || !emailPattern.test(newEmail)) {
          event.preventDefault();
          statusMessage.textContent = "Please enter a valid email address.";
          statusMessage.className = "text-red-600";
        }
    });
      // --- Sidebar Toggle Logic (FINAL FIX) ---
      const sideBar = document.getElementById("sideBar");
      const menuButton = document.getElementById("menuButton");
      const closeSidebarButton = document.getElementById("closeSidebarButton");

      function toggleSidebar() {
        // Toggles the sidebar in/out on mobile by removing/adding -translate-x-full
        sideBar.classList.toggle("-translate-x-full");
      }

      // 1. Hamburger button opens the sidebar
      menuButton.addEventListener("click", toggleSidebar);

      // 2. Close button inside the sidebar closes it
      closeSidebarButton.addEventListener("click", toggleSidebar);

      // 3. Optional: Close the sidebar when clicking a link on mobile
      const sidebarLinks = sideBar.querySelectorAll("a");
      sidebarLinks.forEach((link) => {
        link.addEventListener("click", () => {
          // Only auto-close on small screens (using a check based on the MD breakpoint)
          if (window.innerWidth < 768) {
            sideBar.classList.add("-translate-x-full");
          }
        });
        
      });