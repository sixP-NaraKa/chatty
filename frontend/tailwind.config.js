/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{html,ts}"],
    theme: {
        extend: {
            screens: {
                xs: "500px",
                xxs: "370px",
            },
        },
    },
    plugins: [],
};
