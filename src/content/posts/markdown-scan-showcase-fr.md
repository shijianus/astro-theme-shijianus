---
title: "Exemple complet de numérisation et d'affichage Markdown"
pubDate: 2026-04-25
description: "Avec un long article, couvrir en une fois la numérisation Markdown actuelle, la hiérarchie du sommaire, le contenu caché, les tableaux GFM, les notes de bas de page, les blocs de code et les formats spéciaux."
author: "shijianus"
category: "Conception de systèmes"
group: "Exemple Markdown"
cover: "/media/shijianus/system.jpg"
coverAlt: "tableau de démonstration Markdown"
tags: ["Markdown", "Astro", "Configuration", "UI", "Refonte de thème"]
featured: true
sticky: 4
i18nKey: "markdown-scan-showcase"
lang: "fr"
aiTranslatedFrom: "zh-CN"
---
Cet article est spécifiquement conçu pour valider le balayage du contenu, la synchronisation de la table des matières, l'amélioration des styles et les stratégies de lisibilité au sein du thème. Il ne s'agit pas d'une « explication conceptuelle », mais d'un **échantillon de contenu véritablement utilisable pour tester en conditions réelles le thème frontend**.

Dans la version actuelle, j'aspire à couvrir simultanément, au sein d'un seul article :

- **Le balayage des niveaux de titres**
- **Les blocs de code et le code en ligne**
- **Les tableaux, les listes de tâches et les notes de bas de page**
- **Les formats spéciaux, tels que <mark>marque</mark>, <kbd>Ctrl</kbd> + <kbd>K</kbd>, <ruby>AnZhiYu<rt>AnZhiYu</rt></ruby>**
- **Le contenu masqué et les interactions légères**
- **Les citations, les listes, les séparateurs, les repliements de détails et les cartes d'information**

> Si un thème ne paraît correct que dans le cas de « paragraphes ordinaires + titres ordinaires », il ne peut pas encore être considéré comme véritablement achevé.

## Objectifs du balayage

Le balayage d'un article par le thème ne doit pas se limiter au `title` et à la `description`. Il doit au moins prendre en compte simultanément :

1. La **structure hiérarchique réelle** de l'article, car cela affecte directement la table des matières située à droite.
2. L'**accentuation et le rythme** dans le corps du texte, car un écran entier de texte brut ne permet pas une navigation efficace.
3. L'**affichage sémantique** du code, des listes, des tableaux et des citations, car un blog technique ne produit pas uniquement des paragraphes.
4. La présence de blocs de contenu spéciaux tels que le **masquage, les indices et les notes complémentaires**, car ils influencent le parcours de lecture.

### Pourquoi la table des matières ne doit pas se limiter à l'« indentation »

Une erreur couriste consiste à comprendre la hiérarchie de la table des matières uniquement comme une `padding-left`. Cela peut sembler hiérarchisé, mais dès que la profondeur augmente :

- Les espaces vides s'agrandissent considérablement
- Les zones cliquables sont comprimées
- Il devient difficile de déterminer l'élément actif
- L'utilisateur ne sait pas dans quelle couche il se trouve lors du défilement

L'objectif du traitement de la table des matières dans cette version est donc : **la hiérarchie doit être réelle, l'indentation doit être mesurée, et le chemin actif doit être clairement visible**.

#### Une solution qui concilie les deux aspects

La solution actuelle ne consiste pas à décaler fortement vers la droite tous les titres de niveau 3 et 4, mais à utiliser simultanément :

- Une indentation par petits pas
- La mise en surbrillance de l'élément actuel
- Une mise en surbrillance atténuée du chemin parent
- Une ligne de guidage verticale
- Les métadonnées du titre actuel

Cela permet de concilier la connaissance de « la couche dans laquelle on se trouve » et le fait que la table des matières reste cliquable, scannable et défilable.

## Formats en ligne

L'amélioration la plus courante dans le corps du texte est la visualisation des **informations en ligne**. Par exemple :

- Les noms de variables peuvent être écrits comme `themeContract`
- Les éléments de configuration peuvent être écrits comme `siteConfig.post.comments`
- Les mots d'état peuvent être écrits comme <mark>en cours</mark>
- Les raccourcis clavier peuvent être écrits comme <kbd>Ctrl</kbd> + <kbd>Entrée</kbd>
- Les abréviations peuvent être écrites comme <abbr title="Table des matières">TDM</abbr> et <abbr title="Interface de programmation d'application">API</abbr>
- Des termes spécifiques peuvent être écrits comme <span class="article-inline-serif">accentuation serif</span> ou <span class="article-inline-mono">accentuation mono</span>

Certaines informations ne devraient même pas être entièrement déployées dès le départ, par exemple :

- Ceci est un `indice ordinaire`
- Ceci est un `mot avec accentuation`
- Ceci est un `code en ligne`
- Ceci est un `nom de paramètre`
- Ceci est un ||spoiler qui n'apparaît qu'après un clic||
- Ceci est un %%password:24680|contenu masqué qui n'apparaît qu'après saisie du mot de passe%%

### Accentuation et rythme

Lorsqu'une phrase contient simultanément une **phrase clé**, un `nom de configuration`, un <mark>mot d'état</mark> et un <kbd>raccourci clavier</kbd>, le lecteur peut décomposer et comprendre le paragraphe plus rapidement, sans avoir à le lire mot à mot.

#### Caractères spéciaux et indices/sous-indices

Par exemple :

- E = mc<sup>2</sup>
- H<sub>2</sub>O
- <ruby>Frontend<rt>frontend</rt></ruby>
- <ruby>Refonte<rt>rebuild</rt></ruby>

## Cartes d'information et blocs repliables

Voici une carte d'information personnalisée, qui ne dépend pas de plugins supplémentaires et n'utilise que le HTML autorisé dans Markdown :

<div class="article-note-card">
  <strong>Jugement de conception</strong>
  <p>Si un style ou une animation n'améliore pas l'efficacité du positionnement de l'information, il ne devrait pas être conservé uniquement parce qu'il « a l'air impressionnant ».</p>
</div>

Plus bas, il y a un bloc repliable :

<details class="article-detail-card">
  <summary>Cliquez pour déplier : que teste exactement cet échantillon Markdown</summary>
  <p>Il teste si le balayage des titres, la TDM à droite, les tableaux GFM, les listes de tâches, les notes de bas de page, le contenu masqué, les styles en ligne, les blocs de code et la mise en page par blocs fonctionnent ensemble.</p>
  <p>Si l'un de ces éléments est rendu de manière inexacte, cela signifie que la couche article du thème n'est pas encore véritablement stable.</p>
</details>

### Blocs de citation

> « Il ne s'agit pas de rendre le thème fleuri, mais de rendre l'information claire. »
>
> Pour un blog technique, ce qui compte vraiment, ce sont la structure, l'ordre et le retour d'information, et non les décorations flottantes.

#### Citations de second niveau et explications

> La table des matières est importante non pas parce qu'elle ressemble à un document, mais parce qu'elle rend les longs articles navigables.

## Blocs de code

Un article technique doit au moins pouvoir contenir simultanément des blocs de code dans différents langages.

### TypeScript

```ts
type TocNode = {
  id: string;
  depth: 2 | 3 | 4;
  title: string;
  children: TocNode[];
};

function buildCompactToc(nodes: TocNode[]) {
  return nodes.map((node) => ({
    ...node,
    offset: Math.max(0, node.depth - 2) * 12,
    activePath: false,
  }));
}
```

### Bash

```bash
npm install
npm run build
npm run preview:host
```

### CSS

```css
#card-toc .toc-item.is-active > .toc-link {
  background: var(--theme-main);
  color: var(--white);
  box-shadow: inset 3px 0 0 rgba(255, 255, 255, 0.34);
}
```

#### Principes d'utilisation du code en ligne

Ne mettez pas toute la phrase en `code en ligne`. Vous ne devriez mettre en mode code que les vrais noms de configuration, noms de fonctions ou mots-clés, par exemple `navigator.share()`, `remark-gfm`, `scrollIntoView()`.

## Tableaux GFM

Le tableau ci-dessous sert à valider l'en-tête, l'alignement, les bordures et le défilement sur mobile :

| Module | Objectif | Stratégie actuelle | Remarques |
| --- | --- | --- | --- |
| Cartes de catégories d'accueil | Alignement avec le survol AnZhiYu | Utilisation d'icônes réelles + animation d'extension compressée | Vérification spécifique de `lime` |
| Table des matières | Hiérarchie réelle sans gaspillage d'espace | Structure arborescente + légère indentation + chemin actif | Équilibre avec l'efficacité du clic |
| Zone de commentaires | Publication directe possible | Conservation uniquement de la boîte de message et du flux de commentaires publics | Aucune entrée de test exposée |
| Zone de partage | Correspondance aux réseaux sociaux réels | Construction individuelle des paramètres de partage pour chaque plateforme | Pas seulement la copie du lien |

### Liste des tâches

- [x] Couverture des paragraphes ordinaires et des titres de plusieurs niveaux
- [x] Couverture du code en ligne et des blocs de code
- [x] Couverture des spoilers et du contenu masqué par mot de passe
- [x] Couverture des tableaux et des listes de tâches
- [x] Couverture des blocs repliables, des cartes d'information et des citations
- [ ] Compléter davantage la syntaxe des blocs de contenu spécifiques à Anzhiyu[^future]

#### Mélange de listes ordonnées et non ordonnées

1. D'abord, définir la structure de l'article.
2. Ensuite, déterminer la correspondance avec la table des matières située à droite.
3. Puis, décider de la hiérarchie visuelle de chaque type de bloc de contenu.

- L'essentiel ne réside pas dans le nombre de fonctionnalités
- Mais dans la démonstration d'un ordre structuré
- Et dans la capacité réelle des différents modules à fonctionner ensemble

## Notes de bas de page

Les notes de bas de page font elles aussi partie de l'analyse du contenu, car elles influencent la mise en page de la fin de l'article et le comportement des ancres. Voici deux exemples : une note explicative[^scan-note] et une note portant sur un jugement technique[^engineering-note].

### Compléments intercalaires

Lorsque le texte principal contient des informations « au passage, mais sans vouloir interrompre le fil conducteur », les notes de bas de page sont généralement plus efficaces que l'insertion de tout un paragraphe entre parenthèses.

#### Quand ne pas utiliser de notes de bas de page

Si ces informations sont essentielles à la compréhension du fil conducteur, elles ne doivent pas être cachées dans une note de bas de page. Les notes de bas de page conviennent aux compléments, mais ne sont pas adaptées pour porter les arguments centraux.

## Combinaison de blocs de contenu

Le passage suivant mélange délibérément plusieurs fonctionnalités afin de s'assurer que le thème ne présente pas de distorsion lors de l'utilisation combinée, même si chaque élément est rendu correctement de manière isolée.

<div class="article-note-card article-note-card--accent">
  <strong>Test de combinaison</strong>
  <p>Ce paragraphe contient simultanément du <mark>texte surligné</mark>, des <kbd>touches clavier</kbd>, du <ruby>terme<rt>term</rt></ruby>, du `code en ligne` et une référence de note de bas de page[^combo].</p>
</div>

Si un article contient :

- Des paragraphes explicatifs
- Des titres hiérarchisés
- Des blocs de code
- Des tableaux
- Des citations
- Des emphases en ligne
- Du contenu masqué
- Des compléments repliables

et que le thème parvient tout de même à maintenir un ordre de lecture, alors ce système de contenu est véritablement stable.

### Utilisation en tant qu'article de test de fumée

Vous pouvez utiliser directement cet article pour vérifier les points suivants :

1. La table des matières à droite identifie-t-elle correctement les titres H2 / H3 / H4 ?
2. L'élément actif, le chemin parent et le positionnement par défilement sont-ils naturels ?
3. Les blocs de code, les tableaux et les listes de tâches ont-ils une apparence visuelle unifiée ?
4. Le contenu masqué est-il interactif ?
5. Le rythme vertical entre le partage, les commentaires, la barre latérale et le corps du texte est-il harmonieux ?

#### Conclusion finale

Un thème de blog prêt à être publié ne doit pas seulement paraître correct sur les articles les plus simples. Il doit pouvoir résister à un échantillon qui « pousse délibérément la complexité du contenu à son maximum ».

---

[^scan-note]: Le terme « analyse » désigne ici à la fois l'analyse des champs du frontmatter et l'analyse du rendu des titres, des résumés, de la hiérarchie du corps du texte et du contenu interactif.
[^engineering-note]: Si la table des matières simule la hiérarchie uniquement par l'indentation visuelle, elle finira inévitablement par révéler des problèmes de positionnement et de zones cliquables dans les longs articles.
[^future]: Par exemple, une syntaxe de balises Anzhiyu plus complète, des alias de blocs d'information réutilisables, ainsi qu'un ensemble de composants de contenu plus proche du thème original.
[^combo]: L'objectif du test de combinaison est d'empêcher le thème de fonctionner correctement uniquement sous un type de contenu unique.