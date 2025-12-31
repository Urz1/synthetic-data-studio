import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

/**
 * Sidebar configuration for Synth Studio Documentation.
 * Icons are applied via CSS using data-sidebar-icon attributes.
 */
const sidebars: SidebarsConfig = {
  docsSidebar: [
    {
      type: "doc",
      id: "docs-index",
      label: "Documentation Index",
      className: "sidebar-icon-docs",
    },
    {
      type: "category",
      label: "Getting Started",
      collapsed: false,
      className: "sidebar-icon-rocket",
      items: [
        {
          type: "doc",
          id: "getting-started/getting-started-installation",
          label: "Installation",
        },
        {
          type: "doc",
          id: "getting-started/getting-started-quick-start",
          label: "Quick Start",
        },
        {
          type: "doc",
          id: "getting-started/getting-started-configuration",
          label: "Configuration",
        },
      ],
    },
    {
      type: "category",
      label: "User Guide",
      className: "sidebar-icon-book",
      items: [
        {
          type: "doc",
          id: "user-guide/user-guide-overview",
          label: "Overview",
        },
        {
          type: "doc",
          id: "user-guide/user-guide-uploading-data",
          label: "Uploading Data",
        },
        {
          type: "doc",
          id: "user-guide/user-guide-generating-data",
          label: "Generating Data",
        },
        {
          type: "doc",
          id: "user-guide/user-guide-privacy-features",
          label: "Privacy Features",
        },
        {
          type: "doc",
          id: "user-guide/user-guide-evaluating-quality",
          label: "Evaluating Quality",
        },
        {
          type: "doc",
          id: "user-guide/user-guide-ai-features",
          label: "AI Features",
        },
      ],
    },
    {
      type: "category",
      label: "Tutorials",
      className: "sidebar-icon-graduation",
      items: [
        {
          type: "doc",
          id: "tutorials/tutorials-basic-synthesis",
          label: "Basic Synthesis",
        },
        {
          type: "doc",
          id: "tutorials/tutorials-privacy-synthesis",
          label: "Privacy Synthesis",
        },
        {
          type: "doc",
          id: "tutorials/tutorials-quality-evaluation",
          label: "Quality Evaluation",
        },
        {
          type: "doc",
          id: "tutorials/tutorials-compliance-reporting",
          label: "Compliance Reporting",
        },
      ],
    },
    {
      type: "category",
      label: "Developer Guide",
      className: "sidebar-icon-code",
      items: [
        {
          type: "doc",
          id: "developer-guide/developer-guide-architecture",
          label: "Architecture",
        },
        {
          type: "doc",
          id: "developer-guide/developer-guide-development-setup",
          label: "Development Setup",
        },
        {
          type: "doc",
          id: "developer-guide/developer-guide-api-integration",
          label: "API Integration",
        },
        {
          type: "doc",
          id: "developer-guide/developer-guide-testing",
          label: "Testing",
        },
        {
          type: "doc",
          id: "developer-guide/developer-guide-deployment",
          label: "Deployment",
        },
      ],
    },
    {
      type: "category",
      label: "Examples",
      className: "sidebar-icon-package",
      items: [
        {
          type: "doc",
          id: "examples/examples-curl-api-examples",
          label: "cURL Examples",
        },
        {
          type: "doc",
          id: "examples/examples-python-client-examples",
          label: "Python Client",
        },
        {
          type: "doc",
          id: "examples/examples-llm-api-testing-guide",
          label: "LLM API Testing",
        },
      ],
    },
    {
      type: "category",
      label: "Reference",
      className: "sidebar-icon-list",
      items: [
        {
          type: "doc",
          id: "reference/reference-configuration-options",
          label: "Configuration Options",
        },
        {
          type: "doc",
          id: "reference/reference-privacy-levels",
          label: "Privacy Levels",
        },
        {
          type: "doc",
          id: "reference/reference-supported-formats",
          label: "Supported Formats",
        },
        {
          type: "doc",
          id: "reference/reference-troubleshooting",
          label: "Troubleshooting",
        },
        {
          type: "doc",
          id: "reference/component-guide",
          label: "Component Guide",
        },
      ],
    },
  ],
};

export default sidebars;
