# 📚 Synth Studio Documentation

This folder contains the source code for the **Synth Studio** documentation site, built with Docusaurus.

## 🚀 Quick Start

1.  **Install dependencies**:

    ```bash
    npm install
    # or
    yarn install
    ```

2.  **Start the dev server**:
    ```bash
    npm start
    ```
    Opens [http://localhost:3000](http://localhost:3000).

## 📂 Structure

- `docs/` - **Markdown Content**: The actual documentation files (guides, API ref).
- `src/` - **Custom Code**: React pages (Homepage) and Global CSS.
- `static/` - **Assets**: Images and public files.
- `docusaurus.config.ts` - **Configuration**: Site navigation, footer, and plugins.
- `sidebars.ts` - **Navigation Logic**: Defines the sidebar structure.

## 🛠️ Commands

| Command         | Description                            |
| :-------------- | :------------------------------------- |
| `npm start`     | Starts the development server.         |
| `npm run build` | Builds the static site for production. |
| `npm run serve` | Serves the built static site locally.  |
