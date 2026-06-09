const STORAGE_KEY = "dongni-link-manager-state-v1";
const ACCOUNT_KEY = "dongni-link-manager-account-v1";

const defaultGroups = [
  { id: "all", name: "全部链接", icon: "⌘", system: true },
  { id: "favorites", name: "收藏夹", icon: "★", system: true },
  { id: "research", name: "论文资料", icon: "📚" },
  { id: "tools", name: "工具效率", icon: "🛠" },
  { id: "inspiration", name: "灵感设计", icon: "🎨" },
  { id: "later", name: "稍后阅读", icon: "🕒" }
];

const seedLinks = [
  { id: "seed-openai", title: "OpenAI 官方文档", url: "https://platform.openai.com/docs", groupId: "research", tags: ["AI", "文档", "API"], favorite: true, color: "#fff1e6", createdAt: "2026-06-09T00:00:00.000Z" },
  { id: "seed-arxiv", title: "arXiv 论文搜索", url: "https://arxiv.org/", groupId: "research", tags: ["论文", "研究"], favorite: false, color: "#eef2ff", createdAt: "2026-06-09T00:01:00.000Z" },
  { id: "seed-notion", title: "Notion 工作台", url: "notion://", groupId: "tools", tags: ["URLScheme", "笔记"], favorite: true, color: "#f8fafc", createdAt: "2026-06-09T00:02:00.000Z" },
  { id: "seed-dribbble", title: "Dribbble 设计灵感", url: "https://dribbble.com/", groupId: "inspiration", tags: ["设计", "灵感"], favorite: false, color: "#ffe4ef", createdAt: "2026-06-09T00:03:00.000Z" },
  { id: "seed-read", title: "稍后阅读示例文章", url: "https://example.com/article", groupId: "later", tags: ["文章", "待读"], favorite: false, color: "#ecfdf5", createdAt: "2026-06-09T00:04:00.000Z" }
];

let state = loadState();
let account = loadAccount();
let activeGroupId = "all";
let viewMode = "card";
let query = "";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const els = {
  year: $("#year"), userAvatar: $("#user-avatar"), userName: $("#user-name"), userTip: $("#user-tip"),
  openAuth: $("#open-auth"), authModal: $("#auth-modal"), authForm: $("#auth-form"), authName: $("#auth-name"), authPassword: $("#auth-password"),
  groupList: $("#group-list"), addGroup: $("#add-group"), quickForm: $("#quick-form"), quickTitle: $("#quick-title"), quickUrl: $("#quick-url"), quickGroup: $("#quick-group"), quickColor: $("#quick-color"),
  searchInput: $("#search-input"), linksGrid: $("#links-grid"), currentTitle: $("#current-title"), totalCount: $("#total-count"), favoriteCount: $("#favorite-count"), groupCount: $("#group-count"), toggleView: $("#toggle-view"),
  editModal: $("#edit-modal"), editForm: $("#edit-form"), editId: $("#edit-id"), editTitle: $("#edit-title"), editUrl: $("#edit-url"), editGroup: $("#edit-group"), editTags: $("#edit-tags"), editColor: $("#edit-color"),
  emptyTemplate: $("#empty-template"), openQuickAdd: $("#open-quick-add"), statusLine: $("#status-line")
};

els.year.textContent = new Date().getFullYear();

function loadState() {
  try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)); if (saved?.links && saved?.groups) return saved; } catch {}
  return { groups: defaultGroups, links: seedLinks };
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function loadAccount() { try { return JSON.parse(localStorage.getItem(ACCOUNT_KEY)) || null; } catch { return null; } }
function saveAccount(nextAccount) { account = nextAccount; localStorage.setItem(ACCOUNT_KEY, JSON.stringify(nextAccount)); renderAccount(); }
function renderAccount() {
  if (account?.name) { els.userName.textContent = account.name; els.userAvatar.textContent = account.name.slice(0, 1); els.userTip.textContent = "你的链接空间保存在当前浏览器。"; els.openAuth.textContent = "已登录"; }
  else { els.userName.textContent = "游客模式"; els.userAvatar.textContent = "游"; els.userTip.textContent = "注册后可在本浏览器保存你的链接空间。"; els.openAuth.textContent = "注册 / 登录"; }
}
function normalizeUrl(url) { const value = url.trim(); if (!value) return ""; if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return value; return `https://${value}`; }
function getDomain(url) { try { if (/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) return new URL(url).hostname.replace(/^www\./, ""); if (url.startsWith("mailto:")) return url.replace("mailto:", "邮箱"); if (url.startsWith("tel:")) return "电话"; return url.split(":")[0] + "://"; } catch { return url; } }
function inferTitle(url) { const domain = getDomain(url); if (!domain) return "新链接"; return domain.replace(/\.[a-z]{2,}$/i, "").replace(/[-_]/g, " "); }
function parseTags(value) { return value.split(/[,，\s]+/).map((tag) => tag.trim()).filter(Boolean).slice(0, 8); }
function createId(prefix = "id") { if (crypto?.randomUUID) return crypto.randomUUID(); return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function escapeHtml(value = "") { return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
function getGroup(id) { return state.groups.find((group) => group.id === id) || state.groups[0]; }
function getVisibleLinks() {
  const lower = query.trim().toLowerCase();
  return state.links.filter((link) => {
    const group = getGroup(link.groupId);
    const inGroup = activeGroupId === "all" || (activeGroupId === "favorites" ? link.favorite : link.groupId === activeGroupId);
    const searchable = [link.title, link.url, group?.name, ...(link.tags || [])].join(" ").toLowerCase();
    return inGroup && (!lower || searchable.includes(lower));
  }).sort((a, b) => Number(b.favorite) - Number(a.favorite) || new Date(b.createdAt) - new Date(a.createdAt));
}
function faviconText(title = "链") { return `<span>${escapeHtml(String(title).trim().slice(0, 1).toUpperCase() || "链")}</span>`; }
function renderGroups() {
  const counts = new Map(); state.groups.forEach((group) => counts.set(group.id, 0)); state.links.forEach((link) => counts.set(link.groupId, (counts.get(link.groupId) || 0) + 1));
  els.groupList.innerHTML = state.groups.map((group, index) => {
    const count = group.id === "all" ? state.links.length : group.id === "favorites" ? state.links.filter((link) => link.favorite).length : counts.get(group.id) || 0;
    const groupLinks = state.links.filter((link) => group.id === "all" ? true : group.id === "favorites" ? link.favorite : link.groupId === group.id);
    const icons = groupLinks.map((link) => faviconText(link.title)).join("");
    return `<button class="group-button ${group.id === activeGroupId ? "is-active" : ""}" type="button" data-group="${group.id}" title="快捷键 ${index + 1}"><span class="group-left"><span class="group-icon">${group.icon}</span><span>${escapeHtml(group.name)}</span></span><span class="group-count">${count}</span><span class="hover-icons" aria-hidden="true">${icons || "暂无"}</span></button>`;
  }).join("");
  const editableGroups = state.groups.filter((group) => !group.system);
  const options = editableGroups.map((group) => `<option value="${group.id}">${group.icon} ${escapeHtml(group.name)}</option>`).join("");
  els.quickGroup.innerHTML = options; els.editGroup.innerHTML = options; els.groupCount.textContent = editableGroups.length;
}
function buildGradient(seed) { let hash = 0; for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash); const hueA = Math.abs(hash) % 360; const hueB = (hueA + 54) % 360; return `linear-gradient(135deg, hsl(${hueA} 86% 68%), hsl(${hueB} 80% 76%))`; }
function renderLinks() {
  const links = getVisibleLinks(); const activeGroup = getGroup(activeGroupId); els.currentTitle.textContent = activeGroup?.name || "全部链接"; els.totalCount.textContent = state.links.length; els.favoriteCount.textContent = state.links.filter((link) => link.favorite).length; els.linksGrid.className = `links-grid ${viewMode}-view`;
  if (els.statusLine) els.statusLine.textContent = `${activeGroup?.name || "全部链接"} · ${links.length} 个结果 · ${viewMode === "card" ? "卡片视图" : "列表视图"}`;
  if (!links.length) { els.linksGrid.innerHTML = els.emptyTemplate.innerHTML; return; }
  const groupOptions = state.groups.filter((group) => !group.system).map((group) => `<option value="${group.id}">${group.icon} ${escapeHtml(group.name)}</option>`).join("");
  els.linksGrid.innerHTML = links.map((link) => {
    const domain = getDomain(link.url); const gradient = buildGradient(link.title + link.url); const selectedOptions = groupOptions.replace(`value="${link.groupId}"`, `value="${link.groupId}" selected`);
    return `<article class="link-card" style="--card-bg:${escapeHtml(link.color || "#fff7ed")}; --preview-gradient:${gradient}"><a class="preview" href="${escapeHtml(link.url)}" target="_blank" rel="noopener" title="打开 ${escapeHtml(link.title)}"><span class="preview-label">网页预览</span><span class="preview-domain">${escapeHtml(domain)}</span><span class="preview-thumb">${escapeHtml((link.title || "链").slice(0, 1))}</span></a><div class="link-main"><h3>${escapeHtml(link.title)}</h3><p class="link-url">${escapeHtml(link.url)}</p><div class="tags">${(link.tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div></div><footer class="card-footer"><select class="move-select" data-action="move" data-id="${link.id}" aria-label="移动到分组">${selectedOptions}</select><div class="card-actions"><button class="card-action favorite ${link.favorite ? "is-on" : ""}" type="button" data-action="favorite" data-id="${link.id}">${link.favorite ? "已收藏" : "收藏"}</button><button class="card-action" type="button" data-action="edit" data-id="${link.id}">编辑</button><button class="card-action delete" type="button" data-action="delete" data-id="${link.id}">删除</button></div></footer></article>`;
  }).join("");
}
function renderAll() { renderAccount(); renderGroups(); renderLinks(); }
function toast(message) { const old = document.querySelector(".toast"); old?.remove(); const node = document.createElement("div"); node.className = "toast"; node.textContent = message; document.body.appendChild(node); setTimeout(() => node.remove(), 2600); }
function addLink({ title, url, groupId, color, tags = [] }) { const normalized = normalizeUrl(url); const link = { id: createId("link"), title: title?.trim() || inferTitle(normalized), url: normalized, groupId: groupId || state.groups.find((group) => !group.system)?.id || "later", tags, favorite: false, color: color || "#fff7ed", createdAt: new Date().toISOString() }; state.links.unshift(link); saveState(); renderAll(); toast("链接已添加"); }

els.groupList.addEventListener("click", (event) => { const button = event.target.closest("button[data-group]"); if (!button) return; activeGroupId = button.dataset.group; renderAll(); });
els.addGroup.addEventListener("click", () => { const name = prompt("新分组名称，例如：论文资料"); if (!name?.trim()) return; const icon = prompt("分组图标，可以填一个 emoji", "📁") || "📁"; state.groups.push({ id: createId("group"), name: name.trim(), icon: icon.trim().slice(0, 2) || "📁" }); saveState(); renderAll(); toast("分组已新增"); });
els.quickForm.addEventListener("submit", (event) => { event.preventDefault(); addLink({ title: els.quickTitle.value, url: els.quickUrl.value, groupId: els.quickGroup.value, color: els.quickColor.value, tags: [] }); els.quickForm.reset(); els.quickColor.value = "#fff7ed"; });
els.searchInput.addEventListener("input", (event) => { query = event.target.value; renderLinks(); });
els.openQuickAdd.addEventListener("click", () => { els.quickUrl.focus(); toast("已定位到快速添加栏"); });
els.openAuth.addEventListener("click", () => els.authModal.showModal());
els.authForm.addEventListener("submit", (event) => { event.preventDefault(); saveAccount({ name: els.authName.value.trim(), passwordHintLength: els.authPassword.value.length, createdAt: new Date().toISOString() }); els.authForm.reset(); els.authModal.close(); toast("本地账号已保存"); });
$$(".scheme-list button").forEach((button) => button.addEventListener("click", () => { const scheme = button.dataset.scheme; els.quickUrl.value = scheme + els.quickUrl.value.replace(/^[a-z][a-z0-9+.-]*:\/\/?/i, ""); els.quickUrl.focus(); }));
$$(".view-tabs button").forEach((button) => button.addEventListener("click", () => { viewMode = button.dataset.view; $$(".view-tabs button").forEach((item) => item.classList.toggle("is-active", item === button)); els.toggleView.textContent = viewMode === "card" ? "卡片视图" : "列表视图"; renderLinks(); }));
els.toggleView.addEventListener("click", () => { viewMode = viewMode === "card" ? "list" : "card"; $$(".view-tabs button").forEach((item) => item.classList.toggle("is-active", item.dataset.view === viewMode)); els.toggleView.textContent = viewMode === "card" ? "卡片视图" : "列表视图"; renderLinks(); });
els.linksGrid.addEventListener("click", (event) => { const button = event.target.closest("button[data-action]"); if (!button) return; const link = state.links.find((item) => item.id === button.dataset.id); if (!link) return; if (button.dataset.action === "favorite") { link.favorite = !link.favorite; saveState(); renderAll(); } if (button.dataset.action === "edit") { els.editId.value = link.id; els.editTitle.value = link.title; els.editUrl.value = link.url; els.editGroup.value = link.groupId; els.editTags.value = (link.tags || []).join(", "); els.editColor.value = link.color || "#fff7ed"; els.editModal.showModal(); } if (button.dataset.action === "delete") { if (!confirm("确定删除这个链接吗？")) return; state.links = state.links.filter((item) => item.id !== link.id); saveState(); renderAll(); toast("链接已删除"); } });
els.linksGrid.addEventListener("change", (event) => { const select = event.target.closest("select[data-action='move']"); if (!select) return; const link = state.links.find((item) => item.id === select.dataset.id); if (!link) return; link.groupId = select.value; saveState(); renderAll(); toast("已移动到新分组"); });
els.editForm.addEventListener("submit", (event) => { event.preventDefault(); const link = state.links.find((item) => item.id === els.editId.value); if (!link) return; link.title = els.editTitle.value.trim() || inferTitle(els.editUrl.value); link.url = normalizeUrl(els.editUrl.value); link.groupId = els.editGroup.value; link.tags = parseTags(els.editTags.value); link.color = els.editColor.value; saveState(); els.editModal.close(); renderAll(); toast("链接已更新"); });
document.addEventListener("keydown", (event) => { const tag = event.target.tagName; const isTyping = ["INPUT", "SELECT", "TEXTAREA"].includes(tag); if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); els.quickUrl.focus(); toast("快速添加：输入或粘贴链接"); return; } if (isTyping) return; if (event.key.toLowerCase() === "f") { activeGroupId = "favorites"; renderAll(); return; } const number = Number(event.key); if (number >= 1 && number <= Math.min(6, state.groups.length)) { activeGroupId = state.groups[number - 1].id; renderAll(); } });

renderAll();

