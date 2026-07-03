/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        muted: "#657086",
        cloud: "#f5f7fb",
        line: "#e5e9f2",
        teal: "#0f766e",
        coral: "#e76f51",
        amber: "#f59e0b"
      },
      boxShadow: {
        panel: "0 10px 30px rgba(25, 33, 51, 0.07)"
      }
    }
  },
  plugins: []
};
