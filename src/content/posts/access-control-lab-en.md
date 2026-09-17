---
title: "Article Access Control Lab"
pubDate: 2026-04-26
updatedDate: 2026-04-26
description: "Verifies that password-based access control functions according to server-side rules and ensures restricted content is not directly rendered to the page when locked."
author: "shijianus"
category: "System Design"
group: "Security Experiments"
cover: "/media/shijianus/system.jpg"
coverAlt: "Article Access Control Lab"
featured: false
sticky: 1
tags: ["Access Control", "Security", "Server-Side Rendering"]
access:
  passwordHash: "5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5"
  message: "This article has server-side access control enabled. The content will only be rendered after entering the correct password."
i18nKey: "access-control-lab"
lang: "en"
aiTranslatedFrom: "zh-CN"
---

# This is a Protected Article

If you view this article without unlocking it, the content below will not be output to the page by the server; it won't simply be output first and then hidden by the frontend.

## What You Should Verify After Unlocking

1.  When no password is entered, the article content should not appear in the HTML.
2.  After entering the correct password `12345`, the server will issue a short-term access token.
3.  When refreshing the current article, you should not need to re-enter the password.
4.  Homepage cards, recent articles, and summaries should not leak protected content.

## What This Rule Layer Currently Supports

-   Password access
-   Visible to specified IPs
-   Invisible to specified IPs
-   Visible to specified countries or regions
-   Invisible to specified countries or regions

## Frontmatter Usage Examples

The following snippets can be directly placed into an article's frontmatter:

```yaml
access:
  passwordHash: "5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5"
  message: "Continue reading after entering the correct password."
```

```yaml
access:
  blockedCountries: ["CN"]
  message: "This article is not accessible from your current region."
```

```yaml
access:
  allowedIps: ["203.0.113.7", "198.51.100.*", "192.0.2.0/24"]
  message: "Your current network address is not within the allowed range."
```

If you only want to allow access from specific countries or regions, you can also write:

```yaml
access:
  allowedCountries: ["US", "GB", "HK"]
```

## Why `passwordHash` is Recommended

While directly writing `password` is still compatible, it is more recommended to only use `passwordHash` in Markdown. This way, the theme will only perform comparisons on the server side, eliminating the need to store plain-text passwords in the content configuration.

If you need to generate the hash yourself, the current theme internally uses `SHA-256`. It is recommended to convert the password to a hash locally first, then write it into the frontmatter, rather than placing the plain-text password directly into the article source file.

## Why This Layer Prevents Premature Leakage of Restricted Content

This implementation does not "output the full text first, then hide it with the frontend." Restricted article pages are determined server-side:

1.  When password or region/IP rules are not met, the server only returns the lock panel.
2.  The article body, table of contents, related articles, and public summaries will not be rendered into the page when it's locked.
3.  The homepage, pagination, recent articles, search index, and sidebar will also not include restricted articles.

## Conclusion

This article is primarily for your subsequent smoke testing. As long as the locked page, unlocked page, and the retained state after refreshing all function correctly, it indicates that this access control system has transitioned from a "conceptual feature" to a practically usable state.