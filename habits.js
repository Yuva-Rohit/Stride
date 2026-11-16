/* ==========================================
   STRIDE — HABIT TRACKER JAVASCRIPT
========================================== */

// HTML Elements
const habitList = document.getElementById("habit-list");
const habitWeek = document.getElementById("habit-week");
const addHabitBtn = document.getElementById("add-habit-btn");

// Load existing habits safely
function loadHabits() {
    try {
        const savedHabits = JSON.parse(localStorage.getItem("stride-habits")) || [];

        if (!Array.isArray(savedHabits)) return [];

        return savedHabits
            .filter(habit => habit && typeof habit === "object")
            .map(habit => ({
                ...habit,
                name: typeof habit.name === "string" ? habit.name : "Untitled habit",
                completed: habit.completed && typeof habit.completed === "object" && !Array.isArray(habit.completed)
                    ? habit.completed
                    : {}
            }));
    } catch (error) {
        console.warn("Could not read saved habits. Starting with an empty list.", error);
        return [];
    }
}

let habits = loadHabits();

// Keep track of active timers
const activePomodoroIntervals = new Set();

// Habit colours
const habitColors = [
    "#C0C0C8",
    "#A1A1AA",
    "#D4D4D8",
    "#8F929A",
    "#E5E7EB"
];

// ==========================================
// GET HABIT START DATE
// ==========================================

function getHabitStartDate() {

    let savedStart = null;

    try {
        savedStart = localStorage.getItem("stride-habit-start");
    } catch (error) {
        console.warn("Could not read the habit start date.", error);
    }

    if (savedStart && !Number.isNaN(new Date(savedStart + "T00:00:00").getTime())) {
        return new Date(savedStart + "T00:00:00");
    }

    const dates = [];

    habits.forEach(habit => {
        Object.keys(habit.completed || {}).forEach(date => {
            if (habit.completed[date]) {
                dates.push(date);
            }
        });
    });

    dates.sort();

    const start = dates.length
        ? dates[0]
        : getHabitDate();

    try {
        localStorage.setItem("stride-habit-start", start);
    } catch (error) {
        console.warn("Could not save the habit start date.", error);
    }

    return new Date(start + "T00:00:00");
}

// ==========================================
// SAVE HABITS
// ==========================================

function saveHabits() {
    try {
        localStorage.setItem("stride-habits", JSON.stringify(habits));
    } catch (error) {
        console.error("Could not save habits to localStorage.", error);
        alert("Your habits could not be saved. Please check your browser storage settings.");
    }
}

// ==========================================
// GET DATE IN YYYY-MM-DD FORMAT
// ==========================================

function getHabitDate(date = new Date()) {

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;

}

// ==========================================
// GET ICON BASED ON HABIT NAME
// ==========================================

function getHabitIcon(name) {

    const habitName = name.toLowerCase();

    if (habitName.includes("water") || habitName.includes("drink"))
        return "bi-droplet";

    if (habitName.includes("read") || habitName.includes("book"))
        return "bi-book";

    if (habitName.includes("exercise") || habitName.includes("workout"))
        return "bi-activity";

    if (habitName.includes("code") || habitName.includes("program"))
        return "bi-code-slash";

    if (habitName.includes("sleep"))
        return "bi-moon";

    if (habitName.includes("meditat"))
        return "bi-flower1";

    if (habitName.includes("walk"))
        return "bi-person-walking";

    if (habitName.includes("study") || habitName.includes("learn"))
        return "bi-mortarboard";

    if (habitName.includes("write"))
        return "bi-pencil";

    if (habitName.includes("music"))
        return "bi-music-note";

    return "bi-check2-circle";
}

// ==========================================
// RENDER HABIT CARDS
// ==========================================

function renderHabits() {

    // Stop timers attached to cards that are about to be removed.
    activePomodoroIntervals.forEach(interval => clearInterval(interval));
    activePomodoroIntervals.clear();

    habitList.innerHTML = "";

    if (habits.length === 0) {
        habitList.innerHTML =
            '<p class="habit-empty">No habits yet. Add your first habit!</p>';
    }

    const today = getHabitDate();

    habits.forEach((habit, index) => {

        if (!habit.completed || typeof habit.completed !== "object" || Array.isArray(habit.completed)) {
            habit.completed = {};
        }

        const isDone = Boolean(habit.completed[today]);

        // Habit card
        const card = document.createElement("div");
        card.className = "habit-heatmap-card";

        card.style.setProperty(
            "--habit-color",
            habitColors[index % habitColors.length]
        );

        // Header
        const header = document.createElement("div");
        header.className = "habit-heatmap-header";

        const title = document.createElement("h3");
        title.className = "habit-card-title";

        const icon = document.createElement("i");
        icon.className = `bi ${getHabitIcon(habit.name)} habit-title-icon`;

        const name = document.createElement("span");
        name.textContent = habit.name;

        title.append(icon, name);

        const status = document.createElement("span");
        status.className = "habit-heatmap-status";

        status.textContent = isDone
            ? "Completed today ✓"
            : "In progress";

        header.append(title, status);

        // Calendar, analytics and Pomodoro
        const heatmap = createHabitHeatmap(habit);
        const analytics = createHabitAnalytics(habit);
        const pomodoro = createPomodoroTimer();

        // Habit actions
        const actions = document.createElement("div");
        actions.className = "habit-heatmap-actions";

        // Edit button
        const editButton = document.createElement("button");

        editButton.type = "button";
        editButton.className = "habit-edit";
        editButton.innerHTML = '<i class="bi bi-pencil-fill"></i>';
        editButton.title = "Edit habit";

        editButton.addEventListener("click", function () {

            const newName = prompt(
                "Edit your habit:",
                habit.name
            );

            if (newName === null) return;

            const trimmedName = newName.trim();

            if (!trimmedName) {
                alert("Habit name cannot be empty!");
                return;
            }

            const duplicate = habits.some(item =>
                item.id !== habit.id &&
                item.name.toLowerCase() === trimmedName.toLowerCase()
            );

            if (duplicate) {
                alert("This habit already exists!");
                return;
            }

            habit.name = trimmedName;

            saveHabits();
            renderHabits();

        });

        // Delete button
        const deleteButton = document.createElement("button");

        deleteButton.type = "button";
        deleteButton.className = "habit-delete";
        deleteButton.textContent = "×";
        deleteButton.title = "Delete habit";

        deleteButton.addEventListener("click", function () {

            if (confirm(`Delete "${habit.name}"?`)) {

                habits = habits.filter(
                    item => item.id !== habit.id
                );

                saveHabits();
                renderHabits();

            }

        });

        actions.append(editButton, deleteButton);

        // Right column
        const rightColumn = document.createElement("div");
        rightColumn.className = "habit-right-column";

        // Completion card
        const completionCard = document.createElement("button");
        completionCard.type = "button";
        completionCard.className = "habit-completion-card";

        completionCard.innerHTML = `
            <span class="completion-card-icon">
                ${isDone ? "✓" : "?"}
            </span>
            <span class="completion-card-content">
                <strong>${isDone ? "Habit Completed!" : "Complete Today's Habit"}</strong>
                <small>${isDone ? "Great job! Keep it up." : "Click here when you finish this habit"}</small>
            </span>
            <span class="completion-card-arrow">→</span>
        `;

        if (isDone) {
            completionCard.classList.add("completed");
        }

        completionCard.addEventListener("click", function () {

            habit.completed[today] = !habit.completed[today];

            saveHabits();
            renderHabits();

        });

        rightColumn.append(completionCard, analytics, pomodoro);

        // Main card content
        const cardContent = document.createElement("div");
        cardContent.className = "habit-card-content";

        cardContent.append(heatmap, rightColumn);

        // Assemble card
        card.append(
            header,
            cardContent,
            actions
        );

        habitList.appendChild(card);

    });

    updateHabitStatistics();
    renderHabitWeek();

}
// ==========================================
// CREATE MONTHLY HABIT CALENDAR
// ==========================================

function createHabitHeatmap(habit) {

    const wrapper = document.createElement("div");
    wrapper.className = "habit-heatmap-wrapper";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayKey = getHabitDate(today);
    const startDate = getHabitStartDate();

    const currentMonth = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
    );

    // Each habit has its own displayed month
    if (!habit.displayedMonth) {
        habit.displayedMonth = getHabitDate(currentMonth);
    }

    const selectedMonth = new Date(
        habit.displayedMonth + "T00:00:00"
    );

    const firstMonth = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        1
    );

    // Month navigation
    const navigation = document.createElement("div");
    navigation.className = "habit-month-navigation";

    const previousButton = document.createElement("button");
    previousButton.type = "button";
    previousButton.className = "habit-month-arrow";
    previousButton.textContent = "‹";
    previousButton.title = "Previous month";

    previousButton.disabled = selectedMonth <= firstMonth;

    previousButton.addEventListener("click", function () {

        const previousMonth = new Date(selectedMonth);

        previousMonth.setMonth(
            previousMonth.getMonth() - 1
        );

        habit.displayedMonth = getHabitDate(previousMonth);

        saveHabits();
        renderHabits();

    });

    const monthTitle = document.createElement("h4");
    monthTitle.className = "habit-month-title";

    monthTitle.textContent = selectedMonth.toLocaleString(
        "en",
        {
            month: "long",
            year: "numeric"
        }
    );

    const nextButton = document.createElement("button");
    nextButton.type = "button";
    nextButton.className = "habit-month-arrow";
    nextButton.textContent = "›";
    nextButton.title = "Next month";

    nextButton.disabled = selectedMonth >= currentMonth;

    nextButton.addEventListener("click", function () {

        if (selectedMonth < currentMonth) {

            const nextMonth = new Date(selectedMonth);

            nextMonth.setMonth(
                nextMonth.getMonth() + 1
            );

            habit.displayedMonth = getHabitDate(nextMonth);

            saveHabits();
            renderHabits();

        }

    });

    navigation.append(
        previousButton,
        monthTitle,
        nextButton
    );

    // Calendar grid
    const calendar = document.createElement("div");
    calendar.className = "habit-month-calendar";

    const weekdays = [
        "Sun", "Mon", "Tue", "Wed",
        "Thu", "Fri", "Sat"
    ];

    weekdays.forEach(day => {

        const heading = document.createElement("span");
        heading.className = "habit-calendar-weekday";
        heading.textContent = day;

        calendar.appendChild(heading);

    });

    const firstDay = new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth(),
        1
    );

    const daysInMonth = new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth() + 1,
        0
    ).getDate();

    // Empty spaces before first date
    for (let i = 0; i < firstDay.getDay(); i++) {

        const emptyCell = document.createElement("div");
        emptyCell.className = "habit-calendar-empty";

        calendar.appendChild(emptyCell);

    }

    // Generate calendar dates
    for (let day = 1; day <= daysInMonth; day++) {

        const date = new Date(
            selectedMonth.getFullYear(),
            selectedMonth.getMonth(),
            day
        );

        const dateKey = getHabitDate(date);

        const isDone = Boolean(habit.completed[dateKey]);
        const isFuture = date > today;
        const isBeforeStart = date < startDate;

        const cell = document.createElement("div");
        cell.className = "habit-calendar-cell";
        cell.textContent = day;

        if (isDone) {
            cell.classList.add("completed");
        }

        if (isFuture || isBeforeStart) {
            cell.classList.add("unavailable");
        }

        if (dateKey === todayKey) {
            cell.classList.add("today");
        }

        cell.title =
            `${dateKey} — ${isDone ? "Completed" : "Not completed"}`;

        calendar.appendChild(cell);

    }

    wrapper.append(
        calendar,
        navigation
    );

    return wrapper;

}


// ==========================================
// INDIVIDUAL HABIT MONTHLY ANALYTICS
// ==========================================

function createHabitAnalytics(habit) {

    const panel = document.createElement("div");
    panel.className = "habit-analytics-panel";

    // Use this habit's own selected month
    if (!habit.displayedMonth) {

        const currentDate = new Date();

        habit.displayedMonth = getHabitDate(
            new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                1
            )
        );

    }

    const habitSelectedMonth = new Date(
        habit.displayedMonth + "T00:00:00"
    );

    const monthStart = new Date(
        habitSelectedMonth.getFullYear(),
        habitSelectedMonth.getMonth(),
        1
    );

    const monthEnd = new Date(
        habitSelectedMonth.getFullYear(),
        habitSelectedMonth.getMonth() + 1,
        0
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const trackingStart = getHabitStartDate();

    const startDate = new Date(
        Math.max(monthStart.getTime(), trackingStart.getTime())
    );

    const endDate = new Date(
        Math.min(monthEnd.getTime(), today.getTime())
    );

    let completedDays = 0;
    let trackedDays = 0;

    if (startDate <= endDate) {

        const date = new Date(startDate);

        while (date <= endDate) {

            trackedDays++;

            if (habit.completed[getHabitDate(date)]) {
                completedDays++;
            }

            date.setDate(date.getDate() + 1);

        }

    }

    const percentage = trackedDays === 0
        ? 0
        : Math.round((completedDays / trackedDays) * 100);

    const bestStreak = calculateBestHabitStreak(habit);
    const currentStreak = calculateHabitStreak(habit);

    panel.innerHTML = `
        <div class="habit-analytics-heading">
            <span>MONTHLY PROGRESS</span>
            <strong>${percentage}%</strong>
        </div>

        <div class="habit-progress-track">
            <div class="habit-progress-fill"
                 style="width: ${percentage}%"></div>
        </div>

        <div class="habit-analytics-stats">

            <div class="habit-analytics-stat">
                <strong>${completedDays}</strong>
                <span>Days completed</span>
            </div>

            <div class="habit-analytics-stat">
                <strong>${bestStreak}</strong>
                <span>
                    <i class="bi bi-lightning-charge"></i>
                    Best streak
                </span>
            </div>

            <div class="habit-analytics-stat">
                <strong>${currentStreak}</strong>
                <span>Current streak</span>
            </div>

        </div>
    `;

    return panel;

}
// ==========================================
// CREATE POMODORO TIMER
// ==========================================

function createPomodoroTimer() {

    const card = document.createElement("div");
    card.className = "habit-pomodoro-card";

    card.innerHTML = `
        <div class="pomodoro-header">
            <span class="pomodoro-label">FOCUS TIMER</span>
            <span class="pomodoro-status">Ready to focus</span>
        </div>

        <div class="pomodoro-timer">25:00</div>

        <div class="pomodoro-mode">
            <span>Focus session</span>
        </div>

        <div class="pomodoro-controls">
            <button type="button" class="pomodoro-start">Start</button>
            <button type="button" class="pomodoro-pause">Pause</button>
            <button type="button" class="pomodoro-reset">Reset</button>
        </div>
    `;

    const timerDisplay = card.querySelector(".pomodoro-timer");
    const status = card.querySelector(".pomodoro-status");

    const startBtn = card.querySelector(".pomodoro-start");
    const pauseBtn = card.querySelector(".pomodoro-pause");
    const resetBtn = card.querySelector(".pomodoro-reset");

    const initialTime = 25 * 60;

    let timeLeft = initialTime;
    let timerInterval = null;

    function updateDisplay() {

        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;

        timerDisplay.textContent =
            `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    }

    // Start timer
    startBtn.addEventListener("click", () => {

        if (timerInterval || timeLeft === 0) return;

        status.textContent = "Focusing...";

        timerInterval = setInterval(() => {

            if (timeLeft > 0) {
                timeLeft--;
                updateDisplay();
            }

            if (timeLeft === 0) {

                clearInterval(timerInterval);
                activePomodoroIntervals.delete(timerInterval);
                timerInterval = null;

                status.textContent = "Session completed!";

            }

        }, 1000);

        activePomodoroIntervals.add(timerInterval);

    });

    // Pause timer
    pauseBtn.addEventListener("click", () => {

        clearInterval(timerInterval);
        activePomodoroIntervals.delete(timerInterval);
        timerInterval = null;

        status.textContent = "Paused";

    });

    // Reset timer
    resetBtn.addEventListener("click", () => {

        clearInterval(timerInterval);
        activePomodoroIntervals.delete(timerInterval);
        timerInterval = null;

        timeLeft = initialTime;

        updateDisplay();

        status.textContent = "Ready to focus";

    });

    return card;

}


// ==========================================
// CALCULATE BEST HISTORICAL STREAK
// ==========================================

function calculateBestHabitStreak(habit) {

    const completedDates = Object.keys(habit.completed || {})
        .filter(date => habit.completed[date])
        .sort();

    let bestStreak = 0;
    let currentStreak = 0;
    let previousDate = null;

    completedDates.forEach(dateKey => {

        const date = new Date(dateKey + "T00:00:00");

        if (previousDate) {

            const difference =
                (date - previousDate) / (1000 * 60 * 60 * 24);

            currentStreak = difference === 1
                ? currentStreak + 1
                : 1;

        } else {
            currentStreak = 1;
        }

        bestStreak = Math.max(bestStreak, currentStreak);
        previousDate = date;

    });

    return bestStreak;

}


// ==========================================
// CALCULATE CURRENT HABIT STREAK
// ==========================================

function calculateHabitStreak(habit) {

    let streak = 0;

    const date = new Date();
    date.setHours(0, 0, 0, 0);

    if (!habit.completed[getHabitDate(date)]) {
        date.setDate(date.getDate() - 1);
    }

    while (true) {

        const dateKey = getHabitDate(date);

        if (habit.completed[dateKey]) {

            streak++;

            date.setDate(date.getDate() - 1);

        } else {

            break;

        }

    }

    return streak;

}
// ==========================================
// UPDATE HABIT STATISTICS
// ==========================================

function updateHabitStatistics() {

    const today = getHabitDate();

    const total = habits.length;

    const completed = habits.filter(
        habit => habit.completed[today]
    ).length;

    const percentage = total === 0
        ? 0
        : Math.round((completed / total) * 100);

    const bestStreak = habits.length === 0
        ? 0
        : Math.max(
            ...habits.map(calculateBestHabitStreak)
        );

    document.getElementById("habit-total").textContent =
        total;

    document.getElementById("habit-completed").textContent =
        completed;

    document.getElementById("habit-percentage").textContent =
        percentage + "%";

    document.getElementById("habit-best-streak").innerHTML =
        `${bestStreak} <i class="bi bi-fire best-streak-icon"></i>`;

}


// ==========================================
// WEEKLY PROGRESS
// ==========================================

function renderHabitWeek() {

    habitWeek.innerHTML = "";

    const today = new Date();
    const todayKey = getHabitDate(today);

    const startOfWeek = new Date(today);

    startOfWeek.setDate(
        today.getDate() - today.getDay()
    );

    const dayNames = [
        "Sun", "Mon", "Tue", "Wed",
        "Thu", "Fri", "Sat"
    ];

    for (let i = 0; i < 7; i++) {

        const date = new Date(startOfWeek);

        date.setDate(
            startOfWeek.getDate() + i
        );

        const dateKey = getHabitDate(date);

        const completed = habits.filter(
            habit => habit.completed[dateKey]
        ).length;

        const day = document.createElement("div");
        day.className = "habit-day";

        if (dateKey === todayKey) {
            day.classList.add("today");
        }

        if (completed > 0) {
            day.classList.add("has-progress");
        }

        const label = document.createElement("span");
        label.textContent = dayNames[i];

        const circle = document.createElement("div");
        circle.className = "habit-day-circle";

        circle.textContent = completed > 0
            ? "✓"
            : date.getDate();

        day.append(label, circle);

        habitWeek.appendChild(day);

    }

}


// ==========================================
// ADD NEW HABIT
// ==========================================

addHabitBtn.addEventListener("click", function () {

    const name = prompt("Enter your new habit:");

    if (!name || name.trim() === "") {
        return;
    }

    const trimmedName = name.trim();

    const duplicate = habits.some(
        habit =>
            habit.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (duplicate) {

        alert("This habit already exists!");
        return;

    }

    const newHabit = {

        id: Date.now(),

        name: trimmedName,

        completed: {}

    };

    habits.push(newHabit);

    saveHabits();
    renderHabits();

});


// ==========================================
// INITIAL RENDER
// ==========================================

renderHabits();


/* =========================
   MOBILE SIDEBAR
========================= */

const menuToggle = document.getElementById("menu-toggle");
const sidebar = document.querySelector(".sidebar");
const sidebarOverlay = document.getElementById("sidebar-overlay");

function openSidebar() {
    if (!sidebar || !sidebarOverlay || !menuToggle) return;

    sidebar.classList.add("open");
    sidebarOverlay.classList.add("show");
    document.body.classList.add("menu-open");

    menuToggle.setAttribute("aria-expanded", "true");
}

function closeSidebar() {
    if (!sidebar || !sidebarOverlay || !menuToggle) return;

    sidebar.classList.remove("open");
    sidebarOverlay.classList.remove("show");
    document.body.classList.remove("menu-open");

    menuToggle.setAttribute("aria-expanded", "false");
}

menuToggle?.addEventListener("click", function () {
    if (sidebar?.classList.contains("open")) {
        closeSidebar();
    } else {
        openSidebar();
    }
});

sidebarOverlay?.addEventListener("click", closeSidebar);

sidebar?.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", closeSidebar);
});

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        closeSidebar();
    }
});


/* STRIDE — Habit Page Mobile Header */

(() => {
    const header = document.querySelector(".mobile-topbar");

    if (!header) return;

    let lastScroll = window.scrollY;

    window.addEventListener("scroll", () => {
        if (window.innerWidth > 700) return;

        const currentScroll = window.scrollY;
        const difference = currentScroll - lastScroll;

        if (currentScroll <= 50 || difference < -5) {
            header.classList.remove("header-hidden");
        } else if (difference > 5) {
            header.classList.add("header-hidden");
        }

        lastScroll = currentScroll;

    }, { passive: true });

})();