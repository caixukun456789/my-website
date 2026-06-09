const sitePath = "C:\\Users\\28168\\.codex\\第一\\my-website";

const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector("#nav-links");
const copyButton = document.querySelector("#copy-path");
const copyResult = document.querySelector("#copy-result");
const year = document.querySelector("#year");

year.textContent = new Date().getFullYear();

navToggle?.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks?.addEventListener("click", (event) => {
  if (event.target.tagName === "A") {
    navLinks.classList.remove("is-open");
    navToggle?.setAttribute("aria-expanded", "false");
  }
});

copyButton?.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(sitePath);
    copyResult.textContent = "已复制网站路径。";
  } catch {
    copyResult.textContent = `网站路径：${sitePath}`;
  }
});
