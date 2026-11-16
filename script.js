/* =========================
   ELEMENTS
========================= */

const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskPriority = document.getElementById("task-priority");
const taskDate = document.getElementById("task-date");
const taskList = document.getElementById("task-list");
const upcomingList = document.getElementById("upcoming-list");

const totalCount = document.getElementById("total-count");
const completedCount = document.getElementById("completed-count");
const pendingCount = document.getElementById("pending-count");

function getStoredJSON(key, fallback) {
    try {
        const storedValue = localStorage.getItem(key);
        return storedValue ? JSON.parse(storedValue) : fallback;
    } catch (error) {
        console.warn(`Could not read "${key}" from localStorage. Using default data.`, error);
        return fallback;
    }
}

function getLocalDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

let tasks = getStoredJSON("myday-tasks", []);
if (!Array.isArray(tasks)) tasks = [];

let currentFilter = "all";


/* =========================
   DATE AND GREETING
========================= */

const today = new Date();

const dateOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
};

document.getElementById("current-date").textContent =
    today.toLocaleDateString("en-IN", dateOptions);

const hour = today.getHours();
let greeting = "Good Evening";

if (hour < 12) {
    greeting = "Good Morning";
} else if (hour < 17) {
    greeting = "Good Afternoon";
}

document.getElementById("greeting").textContent = greeting;

const greetingElement = document.getElementById("greeting");
let strideUserName = localStorage.getItem("stride-user-name");

if (!strideUserName) {
    strideUserName = prompt("Welcome to Stride! What should we call you?");
    strideUserName = (strideUserName || "").trim();

    if (strideUserName) {
        localStorage.setItem("stride-user-name", strideUserName);
    }
}

greetingElement.textContent = strideUserName
    ? `${greeting}, ${strideUserName}!`
    : `${greeting}!`;

const todayDateString = getLocalDateString(today);
taskDate.min = todayDateString;


/* =========================
   CALENDAR
========================= */

let calendarDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    1
);

const calendarDays = document.getElementById("calendar-days");
const monthYear = document.getElementById("month-year");

function generateCalendar() {

    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    monthYear.textContent = calendarDate.toLocaleDateString(
        "en-IN",
        {
            month: "long",
            year: "numeric"
        }
    );

    calendarDays.innerHTML = "";

    const firstDay = new Date(year, month, 1).getDay();

    const totalDays = new Date(year, month + 1, 0).getDate();

    const previousMonthDays = new Date(year, month, 0).getDate();

    // Previous month dates
    for (let i = firstDay - 1; i >= 0; i--) {

        const span = document.createElement("span");

        span.textContent = previousMonthDays - i;
        span.classList.add("other-month");

        calendarDays.appendChild(span);
    }

    // Current month dates
    for (let day = 1; day <= totalDays; day++) {

        const span = document.createElement("span");

        span.textContent = day;

        if (
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear()
        ) {
            span.classList.add("today");
        }

        span.addEventListener("click", function () {

            document.querySelectorAll(".calendar-days span")
                .forEach(item => item.classList.remove("selected"));

            span.classList.add("selected");

        });

        calendarDays.appendChild(span);
    }

    // Next month dates
    const remaining = 42 - calendarDays.children.length;

    for (let day = 1; day <= remaining; day++) {

        const span = document.createElement("span");

        span.textContent = day;
        span.classList.add("other-month");

        calendarDays.appendChild(span);
    }
}

document.getElementById("prev-month").addEventListener("click", function () {

    calendarDate.setMonth(calendarDate.getMonth() - 1);

    generateCalendar();

});

document.getElementById("next-month").addEventListener("click", function () {

    calendarDate.setMonth(calendarDate.getMonth() + 1);

    generateCalendar();

});

generateCalendar();


/* =========================
   SAVE TASKS
========================= */

function saveTasks() {
    try {
        localStorage.setItem("myday-tasks", JSON.stringify(tasks));
    } catch (error) {
        console.error("Could not save tasks to localStorage.", error);
        alert("Your tasks could not be saved. Please check your browser storage settings.");
    }
}


/* =========================
   ADD TASK
========================= */

taskForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const taskName = taskInput.value.trim();

    if (taskName === "") {

        alert("Please enter a task!");

        return;
    }

    const newTask = {

        id: Date.now(),

        name: taskName,

        priority: taskPriority.value,

        date: taskDate.value,

        completed: false

    };

    tasks.push(newTask);

    saveTasks();

    displayTasks();

    taskInput.value = "";

    taskDate.value = "";

    taskPriority.value = "Medium";

});


/* =========================
   DISPLAY TASKS
========================= */

function toggleTaskCompletion(task, isCompleted) {
    task.completed = isCompleted;
    saveTasks();
    displayTasks();
}

function displayTasks() {

    taskList.innerHTML = "";

    let filteredTasks = tasks;

    if (currentFilter === "today") {

        filteredTasks = tasks.filter(task => task.date === todayDateString);

    } else if (currentFilter === "completed") {

        filteredTasks = tasks.filter(task => task.completed);

    } else if (currentFilter === "important") {

        filteredTasks = tasks.filter(
            task => task.priority === "High" && !task.completed
        );

    } else if (currentFilter === "upcoming") {

        filteredTasks = tasks.filter(
            task => task.date >= todayDateString &&
                !task.completed
        );

    }

    if (filteredTasks.length === 0) {

        taskList.innerHTML =
            '<p class="empty-message">No tasks found. Add a new task!</p>';

    }

    filteredTasks.forEach(function (task) {

        const taskItem = document.createElement("div");

        taskItem.className = "task-item";

        if (task.completed) {
            taskItem.classList.add("completed");
        }

        const checkbox = document.createElement("input");

        checkbox.type = "checkbox";
        checkbox.checked = task.completed;

        checkbox.addEventListener("change", function () {
            toggleTaskCompletion(task, checkbox.checked);
        });


        const name = document.createElement("span");

        name.className = "task-name";
        name.textContent = task.name;


        const priority = document.createElement("span");

        priority.className = "priority " + task.priority;
        priority.textContent = task.priority;


        const deleteButton = document.createElement("button");

        deleteButton.className = "delete-task";
        deleteButton.textContent = "×";
        deleteButton.setAttribute("aria-label", "Delete task");

        deleteButton.addEventListener("click", function () {

            tasks = tasks.filter(item => item.id !== task.id);

            saveTasks();

            displayTasks();

        });


        taskItem.appendChild(checkbox);
        taskItem.appendChild(name);
        taskItem.appendChild(priority);
        taskItem.appendChild(deleteButton);

        taskList.appendChild(taskItem);

    });

    updateStatistics();

    displayUpcomingTasks();

}
/* =========================
   TASK STATISTICS
========================= */

function updateStatistics() {

    const total = tasks.length;

    const completed = tasks.filter(
        task => task.completed
    ).length;

    const pending = total - completed;

    const percentage = total === 0
        ? 0
        : Math.round((completed / total) * 100);

    totalCount.textContent = total;
    completedCount.textContent = completed;
    pendingCount.textContent = pending;

    document.getElementById("progress-percent").textContent =
        percentage + "%";

    const degrees = percentage * 3.6;

    const progressCircle = document.getElementById("progress-circle");

    progressCircle.style.setProperty(
        "background",
        `conic-gradient(
            from -90deg,
            #E8EBF0 0deg ${degrees}deg,
            #343941 ${degrees}deg 360deg
        )`,
        "important"
    );
}


/* =========================
   UPCOMING TASKS
========================= */

function displayUpcomingTasks() {

    upcomingList.innerHTML = "";

    const now = new Date();
    const todayDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
    );

    const upcomingTasks = tasks
        .filter(task => !task.completed)
        .filter(task => {
            if (!task.date) return true;

            const [year, month, day] = task.date.split("-").map(Number);
            const dueDate = new Date(year, month - 1, day);

            return dueDate >= todayDate;
        })
        .sort((a, b) => {
            if (!a.date) return 1;
            if (!b.date) return -1;
            return a.date.localeCompare(b.date);
        })
        .slice(0, 5);

    document.getElementById("upcoming-number").textContent =
        upcomingTasks.length;

    if (upcomingTasks.length === 0) {
        upcomingList.innerHTML =
            '<p class="empty-message">No upcoming tasks.</p>';
        return;
    }

    upcomingTasks.forEach(function (task) {

        const item = document.createElement("div");
        item.className = "upcoming-item";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = task.completed;

        checkbox.addEventListener("change", function () {
            toggleTaskCompletion(task, checkbox.checked);
        });

        const name = document.createElement("span");
        name.className = "upcoming-task-name";
        name.textContent = task.name;

        const dueLabel = document.createElement("span");
        dueLabel.className = "upcoming-due";

        if (!task.date) {
            dueLabel.textContent = "No due date";
        } else {
            const [year, month, day] = task.date.split("-").map(Number);
            const dueDate = new Date(year, month - 1, day);

            const daysLeft = Math.round(
                (dueDate - todayDate) / (1000 * 60 * 60 * 24)
            );

            if (daysLeft === 0) {
                dueLabel.textContent = "Due today";
                dueLabel.classList.add("due-today");
            } else if (daysLeft === 1) {
                dueLabel.textContent = "1 day left";
            } else {
                dueLabel.textContent = `${daysLeft} days left`;
            }
        }

        item.appendChild(checkbox);
        item.appendChild(name);
        item.appendChild(dueLabel);

        upcomingList.appendChild(item);

    });
}


/* =========================
   SIDEBAR FILTERS + AUTO SCROLL
========================= */

document.querySelectorAll(".nav-item[data-filter]")
    .forEach(function (button) {

        button.addEventListener("click", function () {

            document.querySelectorAll(".nav-item")
                .forEach(item => item.classList.remove("active"));

            button.classList.add("active");

            currentFilter = button.dataset.filter;

            document.getElementById("task-section-label").textContent =
                button.textContent.trim() + " tasks";

            displayTasks();

            // Scroll to Task Reminders for task filters
            if (currentFilter !== "today") {

                requestAnimationFrame(() => {

                    document.querySelector(".reminders-card").scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });

                });

            }

        });

    });


/* =========================
   EDITABLE WEEKLY & MONTHLY GOALS
========================= */


const goalStorageKey = "stride-goals";

const savedGoalData = getStoredJSON(goalStorageKey, null);

let goalData = {
    monthly: Array.isArray(savedGoalData?.monthly)
        ? savedGoalData.monthly
        : [],
    weekly: Array.isArray(savedGoalData?.weekly)
        ? savedGoalData.weekly
        : []
};

// Remove old sample goals
const oldMonthlyGoals = [
    "Read 2 books",
    "Complete a course",
    "Learn JavaScript",
    "Build a project"
];

const oldWeeklyGoals = [
    "Finish assignments",
    "Exercise daily",
    "Practise coding",
    "Read every day"
];

goalData.monthly = goalData.monthly.filter(
    goal => !oldMonthlyGoals.includes(goal.text)
);

goalData.weekly = goalData.weekly.filter(
    goal => !oldWeeklyGoals.includes(goal.text)
);

localStorage.setItem(goalStorageKey, JSON.stringify(goalData));


const goalContainers = {
    monthly: document.getElementById("monthly-goals"),
    weekly: document.getElementById("weekly-goals")
};

function saveGoals() {
    try {
        localStorage.setItem(goalStorageKey, JSON.stringify(goalData));
    } catch (error) {
        console.error("Could not save goals to localStorage.", error);
        alert("Your goals could not be saved. Please check your browser storage settings.");
    }
}

function renderGoals(type) {
    const container = goalContainers[type];
    if (!container) return;

    container.innerHTML = "";

    goalData[type].forEach(function (goal) {
        const item = document.createElement("div");
        item.className = "goal-item" + (goal.completed ? " completed" : "");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = goal.completed;
        checkbox.setAttribute("aria-label", "Mark goal complete");

        checkbox.addEventListener("change", function () {
            goal.completed = checkbox.checked;
            saveGoals();
            renderGoals(type);
        });

        const label = document.createElement("span");
        label.className = "goal-name";
        label.textContent = goal.text;

        const actions = document.createElement("div");
        actions.className = "goal-actions";

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "goal-edit";
        editButton.textContent = "✎";
        editButton.setAttribute("aria-label", "Edit goal");

        editButton.addEventListener("click", function () {
            const updatedText = prompt("Edit your goal:", goal.text);
            if (updatedText === null) return;

            const cleanedText = updatedText.trim();
            if (!cleanedText) {
                alert("Goal name cannot be empty.");
                return;
            }

            goal.text = cleanedText;
            saveGoals();
            renderGoals(type);
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "goal-delete";
        deleteButton.textContent = "×";
        deleteButton.setAttribute("aria-label", "Delete goal");

        deleteButton.addEventListener("click", function () {
            if (!confirm("Delete this goal?")) return;

            goalData[type] = goalData[type].filter(item => item.id !== goal.id);
            saveGoals();
            renderGoals(type);
        });

        actions.appendChild(editButton);
        actions.appendChild(deleteButton);

        item.appendChild(checkbox);
        item.appendChild(label);
        item.appendChild(actions);
        container.appendChild(item);
    });

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "goal-add";
    addButton.textContent = "+ Add goal";

    addButton.addEventListener("click", function () {
        const goalText = prompt("Enter your new goal:");
        if (goalText === null) return;

        const cleanedText = goalText.trim();
        if (!cleanedText) {
            alert("Please enter a goal.");
            return;
        }

        goalData[type].push({
            id: Date.now(),
            text: cleanedText,
            completed: false
        });

        saveGoals();
        renderGoals(type);
    });

    container.appendChild(addButton);
}

function loadGoals() {
    renderGoals("monthly");
    renderGoals("weekly");
}

loadGoals();
/* =========================
   POMODORO TIMER
========================= */

let timerSeconds = 25 * 60;

let timerInterval = null;

let isRunning = false;

let isBreak = false;

const timerDisplay = document.getElementById("timer");

const timerStatus = document.getElementById("timer-status");

const startButton = document.getElementById("start-btn");

const resetButton = document.getElementById("reset-btn");


function updateTimerDisplay() {

    const minutes = Math.floor(timerSeconds / 60);

    const seconds = timerSeconds % 60;

    timerDisplay.textContent =
        String(minutes).padStart(2, "0") +
        ":" +
        String(seconds).padStart(2, "0");

}


function startTimer() {

    if (isRunning) {

        clearInterval(timerInterval);

        isRunning = false;

        startButton.textContent = "▶";

        timerStatus.textContent = "Timer paused";

        return;

    }

    isRunning = true;

    startButton.textContent = "❚❚";

    timerStatus.textContent = "Stay focused!";

    resetButton.style.display = "block";

    timerInterval = setInterval(function () {

        if (timerSeconds > 0) {

            timerSeconds--;

            updateTimerDisplay();

        } else {

            clearInterval(timerInterval);

            isRunning = false;

            isBreak = !isBreak;

            timerSeconds = isBreak ? 5 * 60 : 25 * 60;

            startButton.textContent = "▶";

            timerStatus.textContent = isBreak
                ? "Focus complete! Take a break."
                : "Break complete! Back to focus.";

            updateTimerDisplay();

        }

    }, 1000);

}


function resetTimer() {

    clearInterval(timerInterval);

    isRunning = false;

    isBreak = false;

    timerSeconds = 25 * 60;

    startButton.textContent = "▶";

    timerStatus.textContent = "Time to focus!";

    resetButton.style.display = "none";

    updateTimerDisplay();

}


startButton.addEventListener("click", startTimer);

resetButton.addEventListener("click", resetTimer);


// Add 5 extra minutes
document.getElementById("timer-add").addEventListener("click", function () {

    timerSeconds += 5 * 60;

    updateTimerDisplay();

    timerStatus.textContent = "5 minutes added!";

});


updateTimerDisplay();


/* =========================
   DAILY AFFIRMATIONS
========================= */

const affirmations = [

    "Small steps every day lead to big achievements.",

    "Believe in yourself and keep moving forward.",

    "Your future is created by what you do today.",

    "Progress is better than perfection.",

    "Stay focused. Your hard work will pay off.",

    "Every day is a new opportunity to improve.",

    "You are capable of achieving great things."

];

document.getElementById("new-quote").addEventListener("click", function () {

    const randomIndex = Math.floor(
        Math.random() * affirmations.length
    );

    document.getElementById("affirmation").textContent =
        affirmations[randomIndex];

});


/* =========================
   FOCUS TIMER NAVIGATION
========================= */

document.getElementById("focus-nav").addEventListener("click", function () {

    document.getElementById("timer-card").scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

});


/* =========================
   INITIAL DISPLAY
========================= */

displayTasks();


// ==========================================
// MOBILE SIDEBAR TOGGLE
// ==========================================

const menuToggle = document.getElementById("menu-toggle");
const sidebar = document.querySelector(".sidebar");
const sidebarOverlay = document.getElementById("sidebar-overlay");

function openSidebar() {
    sidebar.classList.add("open");
    sidebarOverlay.classList.add("show");
    document.body.classList.add("menu-open");

    // Hide the logo in the top mobile header
    document.querySelector(".mobile-brand-logo").style.display = "none";

    menuToggle.setAttribute("aria-expanded", "true");
}

function closeSidebar() {
    sidebar.classList.remove("open");
    sidebarOverlay.classList.remove("show");
    document.body.classList.remove("menu-open");

    // Show the top mobile header logo again
    document.querySelector(".mobile-brand-logo").style.display = "";

    menuToggle.setAttribute("aria-expanded", "false");
}

menuToggle.addEventListener("click", () => {
    if (sidebar.classList.contains("open")) {
        closeSidebar();
    } else {
        openSidebar();
    }
});

sidebarOverlay.addEventListener("click", closeSidebar);

// Close after selecting a sidebar option
sidebar.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", closeSidebar);
});

// Close with Escape key
document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeSidebar();
    }
});

// Open the requested dashboard section from URL
const requestedFilter = new URLSearchParams(
    window.location.search
).get("filter");

if (requestedFilter) {
    const targetButton = document.querySelector(
        `.nav-item[data-filter="${requestedFilter}"]`
    );

    if (targetButton) {
        targetButton.click();
    }
}


// Open Habit Tracker page
document.getElementById("habits-nav")?.addEventListener("click", function () {
    window.location.href = "habits.html";
});


/* STRIDE — Smart Header Scroll Behaviour */

const mobileHeader = document.querySelector(".mobile-topbar");

let lastScrollPosition = window.scrollY;

window.addEventListener("scroll", function () {

    if (window.innerWidth > 700 || !mobileHeader) return;

    const currentScrollPosition = window.scrollY;
    const scrollDifference = currentScrollPosition - lastScrollPosition;

    // Always show header at the top
    if (currentScrollPosition <= 50) {
        mobileHeader.classList.remove("header-hidden");
    }

    // Scrolling down — hide header
    else if (scrollDifference > 5) {
        mobileHeader.classList.add("header-hidden");
    }

    // Scrolling up — show header
    else if (scrollDifference < -5) {
        mobileHeader.classList.remove("header-hidden");
    }

    lastScrollPosition = currentScrollPosition;

}, { passive: true });