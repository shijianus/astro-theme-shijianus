---
title: "Test Matrix: Native English Canonical Post"
description: "A post where English is the primary authoring language (no -en suffix in filename), paired with a Chinese translation."
pubDate: 2026-09-19
author: "shijianus"
category: "Test"
tags: ["i18n", "test", "canonical-en"]
lang: "en"
---

# Native English Canonical Post

This article is authored primarily in English with filename `test-native-english-clean.md`.

## Section 1: English Content
This verifies whether Astro renders English as the primary canonical variant when `lang: "en"` is set without a `-en` filename suffix.

## Section 2: Verification Target
Check if `.article-translation-variant[data-lang="en"]` is rendered and active by default.
