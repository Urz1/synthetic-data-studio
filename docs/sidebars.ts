import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

/**
 * Sidebar configuration matching the existing backend/docs structure.
 * Uses slugs from doc frontmatter for correct routing.
 */
const sidebars: SidebarsConfig = {
  docsSidebar: [
    {
      type: "doc",
      id: "docs-index",
      label: "Documentation Home",
    },
    {
      type: "category",
      label: "Getting Started",
      collapsed: false,
      items: [
        "getting-started/getting-started-installation",
        "getting-started/getting-started-quick-start",
        "getting-started/getting-started-configuration",
      ],
    },
    {
      type: "category",
      label: "User Guide",
      items: [
        "user-guide/user-guide-overview",
        "user-guide/user-guide-uploading-data",
        "user-guide/user-guide-generating-data",
        "user-guide/user-guide-privacy-features",
        "user-guide/user-guide-evaluating-quality",
        "user-guide/user-guide-ai-features",
      ],
    },
    {
      type: "category",
      label: "Tutorials",
      items: [
        "tutorials/tutorials-basic-synthesis",
        "tutorials/tutorials-privacy-synthesis",
        "tutorials/tutorials-quality-evaluation",
        "tutorials/tutorials-compliance-reporting",
      ],
    },
    {
      type: "category",
      label: "Developer Guide",
      items: [
        "developer-guide/developer-guide-architecture",
        "developer-guide/developer-guide-development-setup",
        "developer-guide/developer-guide-api-integration",
        "developer-guide/developer-guide-testing",
        "developer-guide/developer-guide-deployment",
      ],
    },
    {
      type: "category",
      label: "Examples",
      items: [
        "examples/examples-curl-api-examples",
        "examples/examples-python-client-examples",
        "examples/examples-llm-api-testing-guide",
      ],
    },
    {
      type: "category",
      label: "Reference",
      items: [
        "reference/reference-configuration-options",
        "reference/reference-privacy-levels",
        "reference/reference-supported-formats",
        "reference/reference-troubleshooting",
      ],
    },
  ],
};

export default sidebars;
