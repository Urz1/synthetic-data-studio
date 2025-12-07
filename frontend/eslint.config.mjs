import next from "eslint-config-next"

const config = [
    {
        ignores: ["**/node_modules/**", ".next/**", "out/**", "dist/**"],
    },
    ...next,
]

export default config