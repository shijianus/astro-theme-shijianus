---
title: "Testing i18n Bidirectional Fallback Article"
pubDate: 2026-09-19
updatedDate: 2026-09-19
description: "This English translated post deliberately omits i18nKey to test if the bidirectional filename base matching correctly includes it as a sibling translation."
author: "shijianus"
category: "Testing"
cover: "/media/shijianus/default.png"
coverAlt: "Testing i18n Bidirectional Fallback Article"
tags: ["Test", "i18n", "Fallback"]
lang: "en"
---

# Testing i18n Bidirectional Fallback Article

This English post omits `i18nKey`.

## English Resilience Verification

With our new bidirectional fallback (`pKey === currentI18nKey || pInferredKey === inferredKey`), this English post is successfully paired with the primary post.
It must be rendered as an `.article-translation-variant[data-lang="en"]` in the DOM, and be toggleable via PostHero buttons!
