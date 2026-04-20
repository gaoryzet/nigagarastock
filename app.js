const SUPABASE_URL = "https://jagbzzjmtxugdbuhjbij.supabase.co";
const SUPABASE_KEY = "sb_publishable_SsA8yT__1nGHdEUHshfLVw_5RCq_5cU";
const UI_STORAGE_KEY = "ewonTodo.ui.v1";

const categories = {
  illustration: "일러스트",
  branding: "브랜딩",
  order: "발주",
  etc: "기타",
};

const scheduleTones = {
  urgent: { label: "가장 급함", color: "#d9413a" },
  starting: { label: "시작단계", color: "#d7a21f" },
  relaxed: { label: "여유있음", color: "#3e8f55" },
  later: { label: "여유 일정", color: "#d8dadd", text: "#3f4347" },
};

const projectTypes = {
  complex: "복합 프로젝트",
  single: "단발 프로젝트",
};

const profileColors = ["#176d6b", "#d9413a", "#3e8f55", "#6f5e96"];

const savedUi = readSavedUi();
const state = {
  currentUserId: savedUi.currentUserId || "",
  activeView: savedUi.activeView || "dashboard",
  activeCategory: savedUi.activeCategory || "all",
  calendarDate: savedUi.calendarDate || new Date().toISOString(),
  editingProjectId: "",
  users: [],
  projects: [],
  schedules: [],
  loading: true,
  error: "",
};

const els = {
  navItems: document.querySelectorAll(".nav-item"),
  views: document.querySelectorAll(".view"),
  viewTitle: document.getElementById("viewTitle"),
  viewEyebrow: document.getElementById("viewEyebrow"),
  currentUserSelect: document.getElementById("currentUserSelect"),
  projectFilter: document.getElementById("projectFilter"),
  userFilter: document.getElementById("userFilter"),
  categoryFilter: document.getElementById("categoryFilter"),
  statusFilter: document.getElementById("statusFilter"),
  summaryGrid: document.getElementById("summaryGrid"),
  projectGrid: document.getElementById("projectGrid"),
  calendarGrid: document.getElementById("calendarGrid"),
  mobileCalendarList: document.getElementById("mobileCalendarList"),
  calendarTitle: document.getElementById("calendarTitle"),
  prevMonth: document.getElementById("prevMonth"),
  nextMonth: document.getElementById("nextMonth"),
  categoryTabs: document.getElementById("categoryTabs"),
  categoryTable: document.getElementById("categoryTable"),
  userList: document.getElementById("userList"),
  projectModal: document.getElementById("projectModal"),
  projectForm: document.getElementById("projectForm"),
  projectModalTitle: document.getElementById("projectModalTitle"),
  projectSubmitButton: document.getElementById("projectSubmitButton"),
  openProjectModal: document.getElementById("openProjectModal"),
  closeProjectModal: document.getElementById("closeProjectModal"),
  detailScheduleBox: document.getElementById("detailScheduleBox"),
  detailRows: document.getElementById("detailRows"),
  addDetailRow: document.getElementById("addDetailRow"),
  userForm: document.getElementById("userForm"),
};

const viewCopy = {
  dashboard: ["Project overview", "프로젝트별 일정"],
  calendar: ["Calendar", "캘린더"],
  categories: ["Category list", "카테고리 리스트"],
  users: ["Team", "사용자 관리"],
};

function readSavedUi() {
  try {
    return JSON.parse(localStorage.getItem(UI_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveUi() {
  localStorage.setItem(
    UI_STORAGE_KEY,
    JSON.stringify({
      currentUserId: state.currentUserId,
      activeView: state.activeView,
      activeCategory: state.activeCategory,
      calendarDate: state.calendarDate,
    })
  );
}

function offsetDate(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function byId(list, id) {
  return list.find((item) => item.id === id);
}

function currentUser() {
  return byId(state.users, state.currentUserId) || state.users[0];
}

function dbUserToApp(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    profileColor: row.profile_color,
  };
}

function dbProjectToApp(row) {
  return {
    id: row.id,
    name: row.name,
    clientName: row.client_name,
    color: row.color,
    type: row.type,
    category: row.category,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
  };
}

function dbScheduleToApp(row) {
  return {
    id: row.id,
    projectId: row.project_id,
    phase: row.phase,
    title: row.title,
    clientName: row.client_name,
    content: row.content || "",
    startDate: row.start_date,
    endDate: row.end_date,
    category: row.category,
    status: row.status,
    assigneeUserId: row.assignee_user_id,
  };
}

function userToDb(user) {
  return {
    name: user.name,
    email: user.email,
    profile_color: user.profileColor,
  };
}

function projectToDb(project) {
  return {
    name: project.name,
    client_name: project.clientName,
    color: project.color,
    type: project.type,
    category: project.category,
    start_date: project.startDate,
    end_date: project.endDate,
    status: project.status,
  };
}

function scheduleToDb(schedule) {
  return {
    project_id: schedule.projectId,
    phase: schedule.phase,
    title: schedule.title,
    client_name: schedule.clientName,
    content: schedule.content || "",
    start_date: schedule.startDate,
    end_date: schedule.endDate,
    category: schedule.category,
    status: schedule.status,
    assignee_user_id: schedule.assigneeUserId || null,
  };
}

async function supabaseRequest(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Supabase request failed: ${response.status}`);
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function loadData() {
  state.loading = true;
  state.error = "";
  render();

  try {
    let [users, projects, schedules] = await Promise.all([
      supabaseRequest("app_users?select=*&order=created_at.asc"),
      supabaseRequest("projects?select=*&order=created_at.asc"),
      supabaseRequest("schedules?select=*&order=start_date.asc"),
    ]);

    if (users.length === 0 && projects.length === 0 && schedules.length === 0) {
      await seedInitialData();
      [users, projects, schedules] = await Promise.all([
        supabaseRequest("app_users?select=*&order=created_at.asc"),
        supabaseRequest("projects?select=*&order=created_at.asc"),
        supabaseRequest("schedules?select=*&order=start_date.asc"),
      ]);
    }

    state.users = users.map(dbUserToApp);
    state.projects = projects.map(dbProjectToApp);
    state.schedules = schedules.map(dbScheduleToApp);
    if (!state.users.some((user) => user.id === state.currentUserId)) {
      state.currentUserId = state.users[0]?.id || "";
    }
    state.loading = false;
    saveUi();
    render();
  } catch (error) {
    state.loading = false;
    state.error = "Supabase 연결에 실패했습니다. supabase-schema.sql을 먼저 실행했는지 확인해주세요.";
    console.error(error);
    render();
  }
}

async function seedInitialData() {
  const createdUsers = await supabaseRequest("app_users", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify([
      userToDb({ name: "Admin", email: "zzummm@naver.com", profileColor: "#176d6b" }),
      userToDb({ name: "지안", email: "jian@studio.kr", profileColor: "#d9413a" }),
      userToDb({ name: "민우", email: "minwoo@studio.kr", profileColor: "#3e8f55" }),
    ]),
  });

  const admin = createdUsers[0];
  const jian = createdUsers[1];
  const createdProjects = await supabaseRequest("projects", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify([
      projectToDb({
        name: "A브랜드 리뉴얼",
        clientName: "A브랜드",
        color: "#176d6b",
        type: "complex",
        category: "branding",
        startDate: offsetDate(1),
        endDate: offsetDate(16),
        status: "pending",
      }),
      projectToDb({
        name: "B출판 표지",
        clientName: "B출판사",
        color: "#6f5e96",
        type: "single",
        category: "illustration",
        startDate: offsetDate(4),
        endDate: offsetDate(10),
        status: "pending",
      }),
    ]),
  });

  await supabaseRequest("schedules", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify([
      scheduleToDb({
        projectId: createdProjects[0].id,
        phase: "로고",
        title: "로고 2차 시안 전달",
        clientName: "A브랜드",
        content: "로고 시안과 컬러 가이드 정리",
        startDate: offsetDate(1),
        endDate: offsetDate(3),
        category: "branding",
        status: "pending",
        assigneeUserId: jian.id,
      }),
      scheduleToDb({
        projectId: createdProjects[0].id,
        phase: "매뉴얼 제작",
        title: "브랜드 매뉴얼 제작",
        clientName: "A브랜드",
        content: "로고 사용 규정, 컬러, 서체 페이지 구성",
        startDate: offsetDate(5),
        endDate: offsetDate(9),
        category: "branding",
        status: "pending",
        assigneeUserId: admin.id,
      }),
      scheduleToDb({
        projectId: createdProjects[0].id,
        phase: "패키지 제작",
        title: "패키지 시안 제작",
        clientName: "A브랜드",
        content: "패키지 전면, 측면, 후면 시안 제작",
        startDate: offsetDate(10),
        endDate: offsetDate(16),
        category: "branding",
        status: "pending",
        assigneeUserId: admin.id,
      }),
      scheduleToDb({
        projectId: createdProjects[1].id,
        phase: "단발 프로젝트",
        title: "표지 일러스트 러프",
        clientName: "B출판사",
        content: "표지용 러프 3안 업로드",
        startDate: offsetDate(4),
        endDate: offsetDate(10),
        category: "illustration",
        status: "pending",
        assigneeUserId: admin.id,
      }),
    ]),
  });
}

function filteredSchedules() {
  return state.schedules.filter((schedule) => {
    const projectOk = els.projectFilter.value === "all" || schedule.projectId === els.projectFilter.value;
    const userOk = els.userFilter.value === "all" || schedule.assigneeUserId === els.userFilter.value;
    const categoryOk = els.categoryFilter.value === "all" || schedule.category === els.categoryFilter.value;
    const statusOk = els.statusFilter.value === "all" || schedule.status === els.statusFilter.value;
    return projectOk && userOk && categoryOk && statusOk;
  });
}

function dDay(dateString) {
  const today = new Date();
  const target = new Date(`${dateString}T00:00:00`);
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((target - today) / 86400000);
  if (diff === 0) return "D-Day";
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

function daysUntil(dateString) {
  const today = new Date();
  const target = new Date(`${dateString}T00:00:00`);
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

function scheduleTone(schedule) {
  if (schedule.status === "completed") {
    return { ...scheduleTones.later, label: "완료" };
  }
  const days = daysUntil(schedule.endDate);
  if (days <= 3) return scheduleTones.urgent;
  if (days <= 7) return scheduleTones.starting;
  if (days <= 14) return scheduleTones.relaxed;
  return scheduleTones.later;
}

function render() {
  saveUi();
  renderControls();
  renderView();
  renderDashboard();
  renderCalendar();
  renderCategories();
  renderUsers();
}

function renderControls() {
  els.currentUserSelect.innerHTML = state.users
    .map((user) => `<option value="${user.id}" ${user.id === state.currentUserId ? "selected" : ""}>${user.name}</option>`)
    .join("");

  const currentUserFilter = els.userFilter.value || "all";
  els.userFilter.innerHTML = [
    `<option value="all">전체 사용자</option>`,
    ...state.users.map((user) => `<option value="${user.id}">${user.name}</option>`),
  ].join("");
  els.userFilter.value = state.users.some((user) => user.id === currentUserFilter) ? currentUserFilter : "all";

  const currentProjectFilter = els.projectFilter.value || "all";
  els.projectFilter.innerHTML = [
    `<option value="all">전체 프로젝트</option>`,
    ...state.projects.map((project) => `<option value="${project.id}">${project.name}</option>`),
  ].join("");
  els.projectFilter.value = state.projects.some((project) => project.id === currentProjectFilter) ? currentProjectFilter : "all";

  const currentCategoryFilter = els.categoryFilter.value || "all";
  els.categoryFilter.innerHTML = [
    `<option value="all">전체 카테고리</option>`,
    ...Object.entries(categories).map(([value, label]) => `<option value="${value}">${label}</option>`),
  ].join("");
  els.categoryFilter.value = categories[currentCategoryFilter] ? currentCategoryFilter : "all";
}

function renderView() {
  els.navItems.forEach((item) => item.classList.toggle("active", item.dataset.view === state.activeView));
  els.views.forEach((view) => view.classList.toggle("active-view", view.id === `${state.activeView}View`));
  const [eyebrow, title] = viewCopy[state.activeView] || viewCopy.dashboard;
  els.viewEyebrow.textContent = eyebrow;
  els.viewTitle.textContent = title;
  document.querySelector(".filters").style.display = ["dashboard", "calendar", "categories"].includes(state.activeView) ? "flex" : "none";
}

function renderDashboard() {
  if (state.loading) {
    els.summaryGrid.innerHTML = "";
    els.projectGrid.innerHTML = `<article class="notice">Supabase 데이터를 불러오는 중입니다.</article>`;
    return;
  }
  if (state.error) {
    els.summaryGrid.innerHTML = "";
    els.projectGrid.innerHTML = `<article class="notice">${state.error}</article>`;
    return;
  }

  const schedules = filteredSchedules();
  const pending = schedules.filter((schedule) => schedule.status === "pending");
  const complex = state.projects.filter((project) => project.type === "complex");
  const dueSoon = pending.filter((schedule) => {
    const start = new Date(`${schedule.startDate}T00:00:00`);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return start - now <= 3 * 86400000;
  });

  els.summaryGrid.innerHTML = [
    ["전체 일정", schedules.length],
    ["미완료", pending.length],
    ["복합 프로젝트", complex.length],
    ["3일 이내 시작", dueSoon.length],
  ]
    .map(([label, value]) => `<article class="summary-card"><span class="small-muted">${label}</span><strong>${value}</strong></article>`)
    .join("");

  els.projectGrid.innerHTML = state.projects
    .map((project) => {
      const projectSchedules = schedules.filter((schedule) => schedule.projectId === project.id);
      const completed = projectSchedules.length > 0 && projectSchedules.every((schedule) => schedule.status === "completed");
      const phaseNames = [...new Set(projectSchedules.map((schedule) => schedule.phase))];
      const phaseGroups = phaseNames.map((phase) => {
        const phaseSchedules = projectSchedules.filter((schedule) => schedule.phase === phase);
        return `<section class="phase-group">
          <div class="phase-title">${phase}<span>${phaseSchedules.length}개</span></div>
          <div class="task-list">${phaseSchedules.map((schedule) => scheduleRow(schedule)).join("")}</div>
        </section>`;
      });
      return `<article class="project-card ${completed || project.status === "completed" ? "completed" : ""}">
        <div class="project-top" style="background:${project.color}"></div>
        <div class="project-body">
          <div class="project-meta">${project.startDate} - ${project.endDate} · ${dDay(project.startDate)}</div>
          <div class="project-title-row">
            <h3>${project.name}</h3>
            <div class="project-card-actions">
              <button class="ghost-button small-button" data-action="editProject" data-id="${project.id}" type="button">수정</button>
              <button class="ghost-button danger-button small-button" data-action="deleteProject" data-id="${project.id}" type="button">삭제</button>
            </div>
          </div>
          <div class="project-tags">
            <span class="status-pill">${projectTypes[project.type]}</span>
            <span class="status-pill">${categories[project.category] || "기타"}</span>
            <span class="category-pill">${project.clientName}</span>
          </div>
          ${phaseGroups.join("") || `<p class="small-muted">등록된 일정이 없습니다.</p>`}
        </div>
      </article>`;
    })
    .join("");
}

function scheduleRow(schedule) {
  const assignee = byId(state.users, schedule.assigneeUserId);
  const tone = scheduleTone(schedule);
  return `<div class="task-row ${schedule.status === "completed" ? "completed" : ""}" style="border-left: 6px solid ${tone.color}">
    <input type="checkbox" data-action="toggleSchedule" data-id="${schedule.id}" ${schedule.status === "completed" ? "checked" : ""} />
    <div>
      <strong>${schedule.title}</strong>
      <div class="task-meta">${schedule.startDate} - ${schedule.endDate} · ${schedule.clientName} · ${assignee?.name || "미지정"}</div>
      <div class="task-content">${schedule.content || ""}</div>
    </div>
    <span class="schedule-tone-pill" style="background:${tone.color}; color:${tone.text || "#ffffff"}">${tone.label}</span>
  </div>`;
}

function renderCalendar() {
  const base = new Date(state.calendarDate);
  const year = base.getFullYear();
  const month = base.getMonth();
  els.calendarTitle.textContent = `${year}년 ${month + 1}월`;

  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  const days = [];
  const mobileDays = [];
  for (let index = 0; index < 42; index += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    const key = day.toISOString().slice(0, 10);
    const events = filteredSchedules().filter((schedule) => key >= schedule.startDate && key <= schedule.endDate);
    const eventHtml = events.map((schedule) => calendarEventHtml(schedule)).join("");
    days.push(`<div class="calendar-day ${day.getMonth() === month ? "" : "muted-day"}">
      <span class="calendar-date">${day.getDate()}</span>
      ${eventHtml}
    </div>`);
    if (day.getMonth() === month && events.length > 0) {
      mobileDays.push(`<section class="mobile-calendar-day">
        <div class="mobile-date">
          <strong>${month + 1}월 ${day.getDate()}일</strong>
          <span>${["일", "월", "화", "수", "목", "금", "토"][day.getDay()]}</span>
        </div>
        <div class="mobile-events">${eventHtml}</div>
      </section>`);
    }
  }
  els.calendarGrid.innerHTML = days.join("");
  els.mobileCalendarList.innerHTML = mobileDays.join("") || `<p class="small-muted">이번 달 표시할 일정이 없습니다.</p>`;
}

function calendarEventHtml(schedule) {
  const project = byId(state.projects, schedule.projectId);
  const tone = scheduleTone(schedule);
  return `<span class="calendar-event" style="background:${tone.color}; color:${tone.text || "#ffffff"}">
    <span class="project-color-chip" style="background:${project?.color || "#ffffff"}"></span>
    <span class="calendar-event-text">${schedule.title}</span>
    <small>${project?.name || ""} · ${schedule.phase}</small>
  </span>`;
}

function renderCategories() {
  const tabs = [["all", "전체"], ...Object.entries(categories)];
  els.categoryTabs.innerHTML = tabs
    .map(([value, label]) => `<button class="tab-button ${state.activeCategory === value ? "active" : ""}" data-category-tab="${value}">${label}</button>`)
    .join("");

  const rows = filteredSchedules()
    .filter((schedule) => state.activeCategory === "all" || schedule.category === state.activeCategory)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .map((schedule) => {
      const project = byId(state.projects, schedule.projectId);
      const assignee = byId(state.users, schedule.assigneeUserId);
      return `<tr>
        <td>${schedule.startDate} - ${schedule.endDate}<br><span class="small-muted">${dDay(schedule.startDate)}</span></td>
        <td>${schedule.clientName}</td>
        <td><strong>${schedule.title}</strong><br><span class="small-muted">${schedule.content}</span></td>
        <td>${project?.name || "미지정"}</td>
        <td>${schedule.phase}</td>
        <td>${assignee?.name || "미지정"}</td>
        <td><span class="status-pill">${schedule.status === "completed" ? "완료" : "미완료"}</span></td>
      </tr>`;
    })
    .join("");
  els.categoryTable.innerHTML = rows || `<tr><td colspan="7">표시할 내역이 없습니다.</td></tr>`;
}

function renderUsers() {
  const activeUser = currentUser();
  els.userForm.style.display = "flex";
  els.userList.innerHTML = state.users
    .map((user) => {
      const actionButton =
        user.id === activeUser?.id
          ? `<button class="ghost-button danger-button" data-action="withdrawUser" data-id="${user.id}">팀원 탈퇴</button>`
          : `<button class="ghost-button danger-button" data-action="removeUser" data-id="${user.id}">팀원 제거</button>`;
      return `<article class="person-card">
      <h3><span class="dot" style="background:${user.profileColor}"></span> ${user.name}</h3>
      <p class="small-muted">${user.email}</p>
      <div class="card-actions">${actionButton}</div>
    </article>`;
    })
    .join("");
}

function addDetailRow(values = {}) {
  const row = document.createElement("div");
  row.className = "detail-row";
  const selectedCategory = values.category || els.projectForm.category?.value || "branding";
  row.innerHTML = `
    <label>세부 항목<input name="detailPhase" value="${values.phase || ""}" placeholder="예: 로고" required /></label>
    <label>일정명<input name="detailTitle" value="${values.title || ""}" placeholder="예: 로고 1차 시안" required /></label>
    <label>시작일<input name="detailStartDate" type="date" value="${values.startDate || offsetDate(1)}" required /></label>
    <label>종료일<input name="detailEndDate" type="date" value="${values.endDate || offsetDate(3)}" required /></label>
    <label>카테고리<select name="detailCategory">${Object.entries(categories).map(([value, label]) => `<option value="${value}" ${selectedCategory === value ? "selected" : ""}>${label}</option>`).join("")}</select></label>
    <label>담당자<select name="detailAssignee">${state.users.map((user) => `<option value="${user.id}" ${values.assigneeUserId === user.id ? "selected" : ""}>${user.name}</option>`).join("")}</select></label>
    <label class="detail-content">내용<input name="detailContent" value="${values.content || ""}" placeholder="세부 일정 내용" /></label>
    <button class="ghost-button remove-detail" type="button" data-action="removeDetailRow">삭제</button>
  `;
  els.detailRows.appendChild(row);
}

function resetProjectModalForCreate() {
  state.editingProjectId = "";
  els.projectForm.reset();
  els.projectModalTitle.textContent = "프로젝트 등록";
  els.projectSubmitButton.textContent = "프로젝트 등록";
  els.projectForm.type.value = "single";
  els.projectForm.color.value = "#176d6b";
  els.projectForm.category.value = "branding";
  els.projectForm.startDate.value = offsetDate(1);
  els.projectForm.endDate.value = offsetDate(14);
  els.detailRows.innerHTML = "";
  addDetailRow({ phase: "로고", title: "로고 1차 시안", startDate: offsetDate(1), endDate: offsetDate(3), category: "branding" });
  addDetailRow({ phase: "매뉴얼 제작", title: "브랜드 매뉴얼 제작", startDate: offsetDate(4), endDate: offsetDate(8), category: "branding" });
  addDetailRow({ phase: "패키지 제작", title: "패키지 시안 제작", startDate: offsetDate(9), endDate: offsetDate(14), category: "branding" });
  els.detailScheduleBox.style.display = "none";
}

function openProjectEditModal(projectId) {
  const project = byId(state.projects, projectId);
  if (!project) return;
  state.editingProjectId = projectId;
  els.projectForm.reset();
  els.projectModalTitle.textContent = "프로젝트 수정";
  els.projectSubmitButton.textContent = "수정 후 등록";
  els.projectForm.name.value = project.name;
  els.projectForm.clientName.value = project.clientName;
  els.projectForm.color.value = project.color;
  els.projectForm.type.value = project.type;
  els.projectForm.category.value = project.category;
  els.projectForm.startDate.value = project.startDate;
  els.projectForm.endDate.value = project.endDate;
  els.projectForm.status.value = project.status;
  els.detailRows.innerHTML = "";
  state.schedules
    .filter((schedule) => schedule.projectId === projectId)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .forEach((schedule) => {
      addDetailRow({
        phase: schedule.phase,
        title: schedule.title,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        category: schedule.category,
        assigneeUserId: schedule.assigneeUserId,
        content: schedule.content,
      });
    });
  if (project.type === "complex" && els.detailRows.children.length === 0) {
    addDetailRow({ category: project.category });
  }
  els.detailScheduleBox.style.display = project.type === "complex" ? "block" : "none";
  els.projectModal.showModal();
}

function collectDetailRows(projectId, clientName) {
  return [...els.detailRows.querySelectorAll(".detail-row")]
    .map((row) => ({
      projectId,
      clientName,
      phase: row.querySelector("[name='detailPhase']").value.trim(),
      title: row.querySelector("[name='detailTitle']").value.trim(),
      startDate: row.querySelector("[name='detailStartDate']").value,
      endDate: row.querySelector("[name='detailEndDate']").value,
      category: row.querySelector("[name='detailCategory']").value,
      assigneeUserId: row.querySelector("[name='detailAssignee']").value,
      content: row.querySelector("[name='detailContent']").value.trim(),
      status: "pending",
    }))
    .filter((schedule) => schedule.phase && schedule.title && schedule.startDate && schedule.endDate);
}

async function addProjectFromForm(form) {
  const formData = new FormData(form);
  const type = formData.get("type");
  const project = {
    name: formData.get("name"),
    clientName: formData.get("clientName"),
    color: formData.get("color"),
    type,
    category: formData.get("category"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    status: formData.get("status"),
  };

  const createdProjects = await supabaseRequest("projects", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(projectToDb(project)),
  });
  const projectId = createdProjects[0].id;

  const schedules =
    type === "single"
      ? [
          {
            projectId,
            phase: "단발 프로젝트",
            title: project.name,
            clientName: project.clientName,
            content: `${project.name} 단발 프로젝트`,
            startDate: project.startDate,
            endDate: project.endDate,
            category: project.category,
            status: project.status,
            assigneeUserId: state.currentUserId || state.users[0]?.id || null,
          },
        ]
      : collectDetailRows(projectId, project.clientName);

  if (schedules.length > 0) {
    await supabaseRequest("schedules", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(schedules.map(scheduleToDb)),
    });
  }
  await loadData();
}

async function updateProjectFromForm(form, projectId) {
  const formData = new FormData(form);
  const type = formData.get("type");
  const project = {
    name: formData.get("name"),
    clientName: formData.get("clientName"),
    color: formData.get("color"),
    type,
    category: formData.get("category"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    status: formData.get("status"),
  };

  await supabaseRequest(`projects?id=eq.${projectId}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(projectToDb(project)),
  });

  await supabaseRequest(`schedules?project_id=eq.${projectId}`, { method: "DELETE" });

  const schedules =
    type === "single"
      ? [
          {
            projectId,
            phase: "단발 프로젝트",
            title: project.name,
            clientName: project.clientName,
            content: `${project.name} 단발 프로젝트`,
            startDate: project.startDate,
            endDate: project.endDate,
            category: project.category,
            status: project.status,
            assigneeUserId: state.currentUserId || state.users[0]?.id || null,
          },
        ]
      : collectDetailRows(projectId, project.clientName);

  if (schedules.length > 0) {
    await supabaseRequest("schedules", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(schedules.map(scheduleToDb)),
    });
  }
  state.editingProjectId = "";
  await loadData();
}

async function deleteProject(projectId) {
  const project = byId(state.projects, projectId);
  if (!project) return;
  if (!confirm(`"${project.name}" 프로젝트를 정말 삭제할까요?`)) return;
  await supabaseRequest(`projects?id=eq.${projectId}`, { method: "DELETE" });
  if (els.projectFilter.value === projectId) {
    els.projectFilter.value = "all";
  }
  await loadData();
}

function fallbackUserId(userId) {
  return state.users.find((user) => user.id !== userId)?.id || null;
}

async function removeUser(userId) {
  if (userId === state.currentUserId) return;
  const target = byId(state.users, userId);
  if (!target) return;
  const fallback = fallbackUserId(userId);
  await supabaseRequest(`schedules?assignee_user_id=eq.${userId}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ assignee_user_id: fallback }),
  });
  await supabaseRequest(`app_users?id=eq.${userId}`, { method: "DELETE" });
  await loadData();
}

async function withdrawUser(userId) {
  if (userId !== state.currentUserId) return;
  if (state.users.length <= 1) return;
  const fallback = fallbackUserId(userId);
  await supabaseRequest(`schedules?assignee_user_id=eq.${userId}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ assignee_user_id: fallback }),
  });
  await supabaseRequest(`app_users?id=eq.${userId}`, { method: "DELETE" });
  state.currentUserId = fallback || "";
  await loadData();
}

document.addEventListener("click", async (event) => {
  const nav = event.target.closest("[data-view]");
  if (nav) {
    state.activeView = nav.dataset.view;
    saveUi();
    render();
  }

  const action = event.target.dataset.action;
  const id = event.target.dataset.id;
  try {
    if (action === "toggleSchedule") {
      const schedule = byId(state.schedules, id);
      const status = event.target.checked ? "completed" : "pending";
      schedule.status = status;
      render();
      await supabaseRequest(`schedules?id=eq.${id}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ status }),
      });
      await loadData();
    }
    if (action === "removeDetailRow") {
      event.target.closest(".detail-row")?.remove();
    }
    if (action === "deleteProject") {
      await deleteProject(id);
    }
    if (action === "editProject") {
      openProjectEditModal(id);
    }
    if (action === "removeUser") {
      await removeUser(id);
    }
    if (action === "withdrawUser") {
      await withdrawUser(id);
    }
  } catch (error) {
    alert("Supabase 저장 중 오류가 발생했습니다.");
    console.error(error);
    await loadData();
  }

  const tab = event.target.closest("[data-category-tab]");
  if (tab) {
    state.activeCategory = tab.dataset.categoryTab;
    saveUi();
    render();
  }
});

els.openProjectModal.addEventListener("click", () => {
  resetProjectModalForCreate();
  els.projectModal.showModal();
});

els.closeProjectModal.addEventListener("click", () => {
  state.editingProjectId = "";
  els.projectModal.close();
});

els.projectForm.addEventListener("change", (event) => {
  if (event.target.name === "type") {
    els.detailScheduleBox.style.display = event.target.value === "complex" ? "block" : "none";
  }
  if (event.target.name === "category") {
    els.detailRows.querySelectorAll("[name='detailCategory']").forEach((select) => {
      select.value = event.target.value;
    });
  }
});

els.addDetailRow.addEventListener("click", () => addDetailRow());

els.projectForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    if (state.editingProjectId) {
      await updateProjectFromForm(els.projectForm, state.editingProjectId);
    } else {
      await addProjectFromForm(els.projectForm);
    }
    els.projectModal.close();
  } catch (error) {
    alert("프로젝트 저장 중 오류가 발생했습니다.");
    console.error(error);
  }
});

els.userForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(els.userForm);
  try {
    await supabaseRequest("app_users", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(
        userToDb({
          name: formData.get("name"),
          email: formData.get("email"),
          profileColor: profileColors[state.users.length % profileColors.length],
        })
      ),
    });
    els.userForm.reset();
    await loadData();
  } catch (error) {
    alert("팀원 저장 중 오류가 발생했습니다.");
    console.error(error);
  }
});

els.currentUserSelect.addEventListener("change", (event) => {
  state.currentUserId = event.target.value;
  saveUi();
  render();
});

els.projectFilter.addEventListener("change", render);
els.userFilter.addEventListener("change", render);
els.categoryFilter.addEventListener("change", render);
els.statusFilter.addEventListener("change", render);

els.prevMonth.addEventListener("click", () => {
  const date = new Date(state.calendarDate);
  date.setMonth(date.getMonth() - 1);
  state.calendarDate = date.toISOString();
  saveUi();
  render();
});

els.nextMonth.addEventListener("click", () => {
  const date = new Date(state.calendarDate);
  date.setMonth(date.getMonth() + 1);
  state.calendarDate = date.toISOString();
  saveUi();
  render();
});

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // Local file previews do not support service workers. GitHub Pages will.
    });
  });
}

loadData();
