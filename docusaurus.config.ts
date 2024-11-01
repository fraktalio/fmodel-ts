import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'f ( model )',
  tagline: 'Accelerate development of compositional, safe and ergonomic applications',
  favicon: 'img/favicon-32x32.png',

  // Set the production url of your site here
  url: 'https://fraktalio.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/fmodel-ts/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'fraktalio', // Usually your GitHub org/user name.
  projectName: 'fmodel-typescript', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/fmodel-social2.png',
    metadata: [{name: 'keywords', content: 'domain-modeling, event-sourcing, event-modeling, typescript'}],
    navbar: {
      title: 'Fmodel',
      logo: {
        alt: 'Fraktalio Logo',
        src: 'img/logo.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Learn',
        },
        // {to: '/blog', label: 'Blog', position: 'left'},
        // { to: '/release-notes', label: 'Release Notes', position: 'left' },
        {
          href: 'https://fraktalio.com',
          label: 'fraktalio.com',
          position: 'right',
        },
        {
          href: 'https://github.com/fraktalio/fmodel-ts',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Learn',
              to: '/docs/intro',
            },
            {
              label: 'Get Started',
              to: '/docs/intro#getting-started',
            }
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Mastodon',
              href: 'https://fosstodon.org/@fraktalio',
            },
            {
              label: 'X (Twitter)',
              href: 'https://x.com/fraktalio',
            },
          ],
        },
        {
          title: 'More',
          items: [
            // {
            //   label: 'Blog',
            //   to: '/blog',
            // },
            {
              label: 'fraktalio.com',
              href: 'https://fraktalio.com',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/fraktalio/fmodel-ts',
            }
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Fraktalio D.O.O.`,
    },
    prism: {
      additionalLanguages: ['typescript'],
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
