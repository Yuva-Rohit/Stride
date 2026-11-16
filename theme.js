/* STRIDE — Theme (light / dark)
   Loaded in <head> so the theme is applied before the page paints.
   Uses its own localStorage key and does not touch any other script. */

(function () {
    var STORAGE_KEY = "stride-theme";
    var root = document.documentElement;
    var query = window.matchMedia("(prefers-color-scheme: dark)");

    function readStored() {
        try {
            var value = localStorage.getItem(STORAGE_KEY);
            return value === "dark" || value === "light" ? value : null;
        } catch (error) {
            return null;
        }
    }

    function applyTheme(theme) {
        root.setAttribute("data-theme", theme);

        var meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute("content", theme === "dark" ? "#121417" : "#F5F5F3");

        var button = document.getElementById("theme-toggle");
        if (button) {
            button.setAttribute("aria-pressed", String(theme === "dark"));
            button.textContent = theme === "dark" ? "Light mode" : "Dark mode";
        }
    }

    // Saved choice first, otherwise follow the system setting
    applyTheme(readStored() || (query.matches ? "dark" : "light"));

    document.addEventListener("DOMContentLoaded", function () {
        applyTheme(root.getAttribute("data-theme"));

        var button = document.getElementById("theme-toggle");
        if (!button) return;

        button.addEventListener("click", function () {
            var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
            applyTheme(next);

            try {
                localStorage.setItem(STORAGE_KEY, next);
            } catch (error) {
                console.warn("Could not save the theme preference.", error);
            }
        });
    });

    // If the person has not chosen, keep following the system setting
    var onSystemChange = function (event) {
        if (!readStored()) applyTheme(event.matches ? "dark" : "light");
    };

    if (query.addEventListener) {
        query.addEventListener("change", onSystemChange);
    } else if (query.addListener) {
        query.addListener(onSystemChange);
    }
})();
