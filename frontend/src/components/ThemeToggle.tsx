import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    return (
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle Dark Mode"
        >
            {theme === "dark" ? "☀️" : "🌙"}
        </button>
    );
}
