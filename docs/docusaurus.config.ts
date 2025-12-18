import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "Synth Studio",
  tagline: "Privacy-Preserving Synthetic Data Generation",
  favicon: "img/logo.png",

  future: {
    v4: true,
  },

  url: "https://docs.synthdata.studio",
  baseUrl: "/",

  organizationName: "Urz1",
  projectName: "synthetic-data-studio",

  onBrokenLinks: "warn",
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: "warn",
    },
  },

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  headTags: [
    {
      tagName: "meta",
      attributes: {
        name: "algolia-site-verification",
        content: "37FAECC146DDD827",
      },
    },
    {
      tagName: "link",
      attributes: {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/img/apple-touch-icon.png",
      },
    },
  ],

  presets: [
    [
      "classic",
      {
        docs: {
          // Local docs folder (industry standard)
          path: "docs",
          sidebarPath: "./sidebars.ts",
          editUrl:
            "https://github.com/Urz1/synthetic-data-studio/tree/main/docs/docs/",
          showLastUpdateTime: false,
          showLastUpdateAuthor: false,
          routeBasePath: "docs",
        },
        blog: {
          // Ignore blog posts missing truncation markers during build
          onUntruncatedBlogPosts: "ignore",
          showReadingTime: true,
          feedOptions: {
            type: ["rss", "atom"],
            xslt: true,
          },
          editUrl:
            "https://github.com/Urz1/synthetic-data-studio/tree/main/docs/",
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: "img/synth-studio-social-card.jpg",

    announcementBar: {
      id: "beta_notice",
      content:
        '🚀 Synth Studio is in active development. <a href="/docs/INDEX">Get started</a> or <a href="https://github.com/Urz1/synthetic-data-studio">star us on GitHub</a>!',
      backgroundColor: "#7c3aed",
      textColor: "#ffffff",
      isCloseable: true,
    },

    colorMode: {
      defaultMode: "dark",
      respectPrefersColorScheme: true,
    },

    navbar: {
      title: "Synth Studio",
      logo: {
        alt: "Synth Studio Logo",
        src: "img/logo.png",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "docsSidebar",
          position: "left",
          label: "Docs",
        },
        {
          to: "/docs/developer-guide/api-integration",
          label: "API",
          position: "left",
        },
        { to: "/blog", label: "Blog", position: "left" },
        {
          href: "https://github.com/Urz1/synthetic-data-studio",
          label: "GitHub",
          position: "right",
        },
      ],
    },

    footer: {
      style: "dark",
      links: [
        {
          title: "Documentation",
          items: [
            {
              label: "Getting Started",
              to: "/docs/getting-started/quick-start",
            },
            {
              label: "User Guide",
              to: "/docs/user-guide/overview",
            },
            {
              label: "Developer Guide",
              to: "/docs/developer-guide/architecture",
            },
          ],
        },
        {
          title: "Community",
          items: [
            {
              label: "GitHub Discussions",
              href: "https://github.com/Urz1/synthetic-data-studio/discussions",
            },
            {
              label: "Issues",
              href: "https://github.com/Urz1/synthetic-data-studio/issues",
            },
          ],
        },
        {
          title: "More",
          items: [
            {
              label: "Blog",
              to: "/blog",
            },
            {
              label: "GitHub",
              href: "https://github.com/Urz1/synthetic-data-studio",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Synth Studio. Built with Docusaurus.`,
    },

    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["bash", "python", "json"],
    },

    // Algolia DocSearch: include only when API key is provided
    ...(process.env.ALGOLIA_API_KEY
      ? {
          algolia: {
            appId: process.env.ALGOLIA_APP_ID || "YU8J8A14J6",
            apiKey: process.env.ALGOLIA_API_KEY,
            indexName: process.env.ALGOLIA_INDEX_NAME || "synthdata",
            contextualSearch: true,
            searchPagePath: "search",
          },
        }
      : {}),
  } satisfies Preset.ThemeConfig,
};

export default config;
