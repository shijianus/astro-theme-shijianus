---
title: "Laboratoire de contrôle d'accès aux articles"
pubDate: 2026-04-26
updatedDate: 2026-04-26
description: "Permet de vérifier que le contrôle d'accès par mot de passe fonctionne selon les règles côté serveur et de confirmer que le contenu restreint n'est pas directement affiché sur la page tant qu'il n'est pas déverrouillé."
author: "shijianus"
category: "Conception de systèmes"
group: "Expérimentation de sécurité"
cover: "/media/shijianus/system.jpg"
coverAlt: "Laboratoire de contrôle d'accès aux articles"
featured: false
sticky: 1
tags: ["Contrôle d'accès", "Sécurité", "Rendu côté serveur"]
access:
  passwordHash: "5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5"
  message: "Cet article est soumis à un contrôle d'accès côté serveur. Le contenu ne sera rendu qu'après avoir saisi le mot de passe correct."
i18nKey: "access-control-lab"
lang: "fr"
aiTranslatedFrom: "zh-CN"
---

# Cet article est protégé

Si vous consultez cet article sans l'avoir déverrouillé, le contenu ci-dessous ne sera pas généré par le serveur et ne sera donc pas affiché sur la page. Il ne s'agit pas d'un simple masquage côté client après rendu.

## Que vérifier après le déverrouillage ?

1.  Le contenu principal ne doit pas apparaître dans le code HTML si le mot de passe n'a pas été saisi.
2.  Après avoir saisi le mot de passe correct (`12345`), le serveur enregistre un jeton d'accès temporaire.
3.  Lors d'un rafraîchissement ultérieur de l'article, il ne devrait pas être nécessaire de saisir à nouveau le mot de passe.
4.  Les cartes de la page d'accueil, les articles récents et les résumés ne doivent pas révéler le contenu protégé.

## Ce que cette règle prend en charge

-   Accès par mot de passe
-   Visible pour des adresses IP spécifiques
-   Invisible pour des adresses IP spécifiques
-   Visible pour des pays ou régions spécifiques
-   Invisible pour des pays ou régions spécifiques

## Exemples de configuration Frontmatter

Les extraits de code suivants peuvent être directement insérés dans le frontmatter de l'article :

```yaml
access:
  passwordHash: "5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5"
  message: "Saisissez le mot de passe correct pour continuer la lecture."
```

```yaml
access:
  blockedCountries: ["CN"]
  message: "Cet article n'est pas accessible depuis votre région actuelle."
```

```yaml
access:
  allowedIps: ["203.0.113.7", "198.51.100.*", "192.0.2.0/24"]
  message: "Votre adresse réseau actuelle n'est pas autorisée."
```

Si vous souhaitez autoriser l'accès uniquement à certains pays ou régions, vous pouvez également écrire directement :

```yaml
access:
  allowedCountries: ["US", "GB", "HK"]
```

## Pourquoi il est recommandé d'utiliser passwordHash

Bien que la saisie directe de `password` soit toujours compatible, il est fortement recommandé de n'utiliser que `passwordHash` dans le Markdown. De cette façon, le thème effectuera la comparaison uniquement côté serveur, sans avoir à stocker le mot de passe en clair dans la configuration du contenu.

Si vous devez générer vous-même la valeur de hachage, le thème utilise actuellement `SHA-256`. Il est recommandé de convertir d'abord le mot de passe en hachage localement, puis de l'écrire dans le frontmatter, plutôt que de placer le mot de passe en clair directement dans le fichier source de l'article.

## Pourquoi ce mécanisme ne divulgue pas le contenu restreint à l'avance

Cette implémentation ne consiste pas à « d'abord afficher le contenu complet, puis le masquer côté client ». La page d'un article restreint est gérée par une décision côté serveur :

1.  Si les règles de mot de passe ou de région/IP ne sont pas satisfaites, le serveur ne renvoie que le panneau de verrouillage.
2.  Le contenu principal, la table des matières, les articles connexes et les résumés publics ne seront pas rendus sur la page tant qu'elle n'est pas déverrouillée.
3.  La page d'accueil, la pagination, les articles récents, l'index de recherche et la barre latérale n'incluront pas non plus les articles restreints.

## Conclusion

Cet article est principalement destiné à vos tests de fumée ultérieurs. Tant que la page de verrouillage, la page déverrouillée et l'état de persistance après rafraîchissement fonctionnent correctement, cela signifie que ce système de contrôle d'accès est passé du statut de « fonctionnalité conceptuelle » à un état réellement utilisable.