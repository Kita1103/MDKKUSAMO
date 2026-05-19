document.addEventListener("DOMContentLoaded", () => {
  const dropdown = document.getElementById("aboutDropdown");
  const link = document.getElementById("aboutLink");
  const menu = dropdown.querySelector(".dropdown-menu");

  let tappedOnce = false;

  link.addEventListener("click", (e) => {
    const isMobile = window.innerWidth < 992;

    if (!isMobile) return;

    if (!tappedOnce) {
      e.preventDefault();
      menu.classList.add("show");
      tappedOnce = true;
    } else {
      window.location.href = link.href;
    }
  });

  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target)) {
      menu.classList.remove("show");
      tappedOnce = false;
    }
  });
});
