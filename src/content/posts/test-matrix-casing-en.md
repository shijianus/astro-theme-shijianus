---
title: "Test Matrix: Language Code Casing Resilience"
description: "This post has lang: 'EN' (uppercase) in frontmatter to test case normalization."
pubDate: 2026-09-19
author: "shijianus"
category: "Testing"
tags: ["i18n", "test", "casing"]
lang: "EN"
i18nKey: "test-matrix-casing"
---

# Language Code Casing Resilience Test

This post explicitly defines `lang: "EN"` (uppercase).

## Section: Uppercase Lang Handling
Verify whether the template normalizes `lang: "EN"` into canonical `en` for `.article-translation-variant[data-lang="en"]` or preserves `EN`.
