const sitePath = "C:\\Users\\28168\\.codex\\第一\\my-website";
const databaseName = "dongni-file-library";
const storeName = "files";

const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector("#nav-links");
const copyButton = document.querySelector("#copy-path");
const copyResult = document.querySelector("#copy-result");
const year = document.querySelector("#year");
const fileForm = document.querySelector("#file-form");
const fileTitle = document.querySelector("#file-title");
const fileCategory = document.querySelector("#file-category");
const fileTags = document.querySelector("#file-tags");
const fileNote = document.querySelector("#file-note");
const fileInput = document.querySelector("#file-input");
const fileStatus = document.querySelector("#file-status");
const fileList = document.querySelector("#file-list");
const libraryCount = document.querySelector("#library-count");
const clearLibrary = document.querySelector("#clear-library");

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
    copyResult.textContent = "已复制本地网站路径。";
  } catch {
    copyResult.textContent = `本地路径：${sitePath}`;
  }
});

function setStatus(message, type = "ok") {
  if (!fileStatus) return;
  fileStatus.textContent = message;
  fileStatus.style.color = type === "error" ? "#b42318" : "#2b7a5b";
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("当前浏览器不支持本地文件库。"));
      return;
    }

    const request = indexedDB.open(databaseName, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(storeName)) {
        const store = db.createObjectStore(storeName, { keyPath: "id" });
        store.createIndex("addedAt", "addedAt", { unique: false });
        store.createIndex("category", "category", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("打开文件库失败。"));
  });
}

async function saveRecord(record) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).put(record);
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error || new Error("保存失败。"));
    };
  });
}

async function getAllRecords() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const request = transaction.objectStore(storeName).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error || new Error("读取文件失败。"));
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error || new Error("读取文件失败。"));
    };
  });
}

async function getRecord(id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const request = transaction.objectStore(storeName).get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("读取文件失败。"));
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error || new Error("读取文件失败。"));
    };
  });
}

async function deleteRecord(id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).delete(id);
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error || new Error("删除失败。"));
    };
  });
}

async function clearRecords() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).clear();
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error || new Error("清空失败。"));
    };
  });
}

function formatBytes(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let size = bytes / 1024;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 10 ? 1 : 2)} ${units[unitIndex]}`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function parseTags(value) {
  return value
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function createId() {
  if (window.crypto?.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function renderEmptyState() {
  fileList.innerHTML = `
    <div class="empty-state">
      <h3>还没有文件</h3>
      <p>选择一篇论文、文章或笔记，保存后会显示在这里。</p>
    </div>
  `;
}

async function renderFiles() {
  if (!fileList) return;

  try {
    const records = await getAllRecords();
    records.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
    libraryCount.textContent = `${records.length} 个文件`;

    if (!records.length) {
      renderEmptyState();
      return;
    }

    fileList.innerHTML = records.map((record) => {
      const tags = record.tags?.length
        ? `<div class="file-tags">${record.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>`
        : "";
      const note = record.note
        ? `<p class="file-note">${escapeHtml(record.note)}</p>`
        : "";

      return `
        <article class="file-item">
          <header>
            <div>
              <h4>${escapeHtml(record.title || record.name)}</h4>
              <p class="file-meta">${escapeHtml(record.name)} · ${formatBytes(record.size)} · ${formatDate(record.addedAt)}</p>
            </div>
            <span class="category-badge">${escapeHtml(record.category || "资料")}</span>
          </header>
          ${tags}
          ${note}
          <div class="file-actions">
            <button class="small-button" type="button" data-action="download" data-id="${record.id}">下载</button>
            <button class="small-button delete" type="button" data-action="delete" data-id="${record.id}">删除</button>
          </div>
        </article>
      `;
    }).join("");
  } catch (error) {
    renderEmptyState();
    setStatus(error.message || "读取文件库失败。", "error");
  }
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

fileForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const selectedFile = fileInput.files?.[0];

  if (!selectedFile) {
    setStatus("请先选择一个文件。", "error");
    return;
  }

  if (selectedFile.size > 80 * 1024 * 1024) {
    const shouldContinue = confirm("这个文件比较大，浏览器本地储存可能失败。还要继续吗？");
    if (!shouldContinue) return;
  }

  const record = {
    id: createId(),
    title: fileTitle.value.trim() || selectedFile.name,
    category: fileCategory.value,
    tags: parseTags(fileTags.value),
    note: fileNote.value.trim(),
    name: selectedFile.name,
    type: selectedFile.type || "application/octet-stream",
    size: selectedFile.size,
    addedAt: new Date().toISOString(),
    blob: selectedFile
  };

  try {
    setStatus("正在保存，请稍等……");
    await saveRecord(record);
    fileForm.reset();
    setStatus("已保存到当前浏览器的文件库。别人打开网站看不到你的文件。");
    await renderFiles();
  } catch (error) {
    setStatus(error.message || "保存失败，可能是浏览器储存空间不够。", "error");
  }
});

fileList?.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const { action, id } = button.dataset;

  if (action === "download") {
    try {
      const record = await getRecord(id);
      if (!record) throw new Error("文件不存在。");
      const url = URL.createObjectURL(record.blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = record.name || record.title || "file";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setStatus("已开始下载。");
    } catch (error) {
      setStatus(error.message || "下载失败。", "error");
    }
  }

  if (action === "delete") {
    const shouldDelete = confirm("确定删除这个文件吗？这个操作只会删除当前浏览器里的副本。");
    if (!shouldDelete) return;
    try {
      await deleteRecord(id);
      setStatus("已删除文件。");
      await renderFiles();
    } catch (error) {
      setStatus(error.message || "删除失败。", "error");
    }
  }
});

clearLibrary?.addEventListener("click", async () => {
  const shouldClear = confirm("确定清空当前浏览器里的全部文件吗？这个操作不能恢复。 ");
  if (!shouldClear) return;
  try {
    await clearRecords();
    setStatus("文件库已清空。");
    await renderFiles();
  } catch (error) {
    setStatus(error.message || "清空失败。", "error");
  }
});

renderFiles();
