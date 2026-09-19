---
title: "Bilan complet des capacités Markdown de An Zhi Yu : Table des matières, formatage, contenu caché, médias et blocs de contenu"
pubDate: 2026-04-25
updatedDate: 2026-04-25
description: "Un long article d'exemple spécialement conçu pour tester le balayage d'articles, les niveaux de table des matières, le GFM, le contenu caché, les formats spéciaux, l'affichage des médias et les blocs de contenu courants."
author: "shijianus"
category: "Ingénierie Frontend"
group: "Exemple Markdown"
cover: "/media/shijianus/workbench.jpg"
coverAlt: "bureau de démonstration markdown"
featured: true
sticky: 4
tags: ["Astro", "Markdown", "Refonte du thème", "UI", "Étude"]
i18nKey: "anzhiyu-markdown-showcase"
lang: "fr"
aiTranslatedFrom: "zh-CN"
---
# Il s'agit d'un long article spécialement conçu pour valider les capacités du thème

Cet article n'est pas un simple essai, mais un test complet visant à vérifier si la page d'article actuelle se rapproche réellement de l'expérience de lecture du thème AnZhiYu. Il couvre simultanément **l'analyse de l'image d'en-tête**, **la reconnaissance des catégories et des tags**, **la cartographie des niveaux de la table des matières**, **l'amélioration des blocs de code**, **les tableaux GFM et les listes de tâches**, **le contenu masqué**, **les polices et formats spéciaux**, **l'affichage des médias**, **la combinaison de blocs de contenu** et **le comportement de défilement des longs paragraphes**.

Si ces fonctionnalités apparaissent de manière stable dans le même article, et que la table des matières, le partage, les commentaires, la barre latérale, les dons et le parcours de lecture global restent intacts, alors le thème peut être considéré comme réellement prêt à être livré.

## Analyse du format de base

Commençons par un texte de base pour confirmer que les syntaxes Markdown les plus courantes sont correctement rendues :

- Ici, du **texte en gras**, pour vérifier que l'emphase du corps du texte n'est ni trop brillante ni floue.
- Ici, du *texte en italique*, pour s'assurer que le rythme du texte n'est pas interrompu.
- Ici, du ~~texte barré~~, pour tester si l'extension GFM fonctionne.
- Ici, du `code en ligne`, pour vérifier les marges, les coins arrondis et la taille de police du bloc de code intégré.
- Ici, un [lien externe vers Astro](https://astro.build/), pour tester la couleur du lien et le retour visuel au survol.

Ce paragraphe mélange intentionnellement du chinois, de l'anglais, des chiffres et des symboles, comme `Astro 6 + React 19 + Tailwind 4`, afin de vérifier que l'espacement et le retour à la ligne restent lisibles dans un texte long réel.

### Formats spéciaux et polices spéciales

Les éléments suivants ne sont pas couramment écrits dans un blog quotidien, mais ils sont idéaux pour tester la capacité du système d'article à exprimer une large gamme de contenus :

- `<mark>texte en surbrillance</mark>` pour tester le marquage d'importance.
- `<kbd>Ctrl</kbd> + <kbd>K</kbd>` pour tester l'affichage des raccourcis clavier.
- `<ruby>table des matières<rt>mulu</rt></ruby>` pour tester la typographie phonétique.
- `<abbr title="Application Programming Interface">API</abbr>` pour tester l'explication des abréviations.
- Exemple de exposant en ligne : E = mc<sup>2</sup>.
- Exemple d’indice en ligne : H<sub>2</sub>O et log<sub>n</sub>.

Il est également possible d’insérer directement un fragment HTML avec différentes polices :

<p>
  <span style="font-family: 'Times New Roman', serif; font-size: 1.08em; letter-spacing: 0.04em;">This sentence uses a serif rhythm.</span>
  <br />
  <span style="font-family: 'Courier New', monospace; font-size: 0.96em;">const typographyMode = "editorial + geek";</span>
</p>

<div class="article-note-card article-note-card--accent">
  <strong>Test de combinaison de formats spéciaux</strong>
  <p>Cette section couvre à la fois <mark>texte en surbrillance</mark>, <kbd>touche</kbd>, `inline code`, différentes graisses de police et HTML natif, afin de vérifier que l'amélioration du texte ne fonctionne pas uniquement pour un type de contenu unique.</p>
</div>

### Contenu masqué et spoilers

Le thème actuel prend en charge plusieurs types de contenu enrichi en ligne :

- Masque spoiler : ||Ceci est un texte de spoiler qui s'affichera après un clic, pour vérifier que le masque bouton a été correctement détecté.||
- Affichage direct au clic : %%Voici un indice caché qui se déplie après un clic.%%

Cette couche ne conserve que les améliorations de visibilité côté client et ne propose plus de « masquage par mot de passe côté client », qui pourrait être confondu avec une fonction de sécurité. En cas de besoin réel de protection par mot de passe, il faut utiliser le contrôle d’accès côté serveur dans le frontmatter de l’article.

Si les deux interactions de ce paragraphe fonctionnent correctement, cela indique que le script d’amélioration du texte est bien synchronisé avec le rendu Markdown, sans affecter les nœuds de texte ordinaires dans `code`, `pre` ou d’autres éléments protégés.

## Test de compression des niveaux de la table des matières

Cette section sert à vérifier que la stratégie de compression des niveaux de la table des matières répond simultanément à deux objectifs :

1. La hiérarchie doit être exacte, sans déguiser un H4 en H2.
2. L'indentation ne doit pas être excessive, sinon la table des matières perdrait en cliquabilité à cause d’un trop grand espace blanc.

### Premier groupe : Structure de l'information

Lorsque la table des matières reflète réellement la structure de l’article, le lecteur n’a pas besoin de lire chaque titre mot à mot pour comprendre si le paragraphe correspond à une thèse principale, à un sous‑argument ou à un complément. Le rôle de la table des matières n’est pas de « recopier tous les titres », mais d’aider le lecteur à se repérer dans la carte de l’article.

#### Deuxième groupe : Indices de niveau

Si la table des matières n’a aucune indentation, tous les titres s’affichent sur la même ligne horizontale, rendant difficile la distinction visuelle des sections. À l’inverse, une indentation trop importante rend la navigation lente.

#### Deuxième groupe : Efficacité de navigation

Une solution réellement utilisable ne consiste pas à augmenter davantage l’indentation, mais à ajouter, sur une petite indentation, des surlignages de chemin, des marques de branche active, un arrière‑plan d’élément actif et des indications numériques, afin que hiérarchie et efficacité coexistent.

### Premier groupe : Parcours de lecture

Ce paragraphe teste un scénario fréquent : le lecteur parcourt la table des matières de haut en bas, s’arrête sur un H3, puis clique directement pour se rendre au milieu du texte.

#### Deuxième groupe : Position actuelle

Si la zone de position actuelle affiche de façon stable le titre actif, le niveau courant et le numéro global, cela améliore considérablement le sens de l’orientation lors de la lecture d’un texte long.

#### Deuxième groupe : Défilement de la table des matières

Lorsque le titre actif change, la liste de la table des matières doit suivre, sans toutefois reprendre le focus lorsque l’utilisateur fait défiler manuellement la table.

### Premier groupe : Texte extrêmement long

Si l’article est suffisamment long, la table des matières doit rester utilisable et fixe, sans perdre son comportement « sticky » à cause d’une mauvaise stratégie de hauteur de carte.

#### Deuxième groupe : Test de densité des H4

Cette partie ajoutera davantage de H4 afin de créer des nœuds plus profonds dans la table des matières, permettant d’observer si la compression de l’indentation reste lisible.

##### Troisième groupe supplémentaire : Compression du chemin H5

Cette couche vérifie que, en approfondissant la hiérarchie, la zone cliquable ne se réduit pas de façon excessive. En d’autres termes, **plus la hiérarchie est profonde, plus la zone interactive ne doit pas diminuer**.

###### Quatrième niveau final : Test d’ancre H6

Si vous pouvez toujours voir clairement ce niveau dans la table des matières latérale et que le saut d’ancre fonctionne correctement avec un surlignage stable, alors la détection des titres plus profonds est complète.

#### Deuxième groupe : Nœud supplémentaire A

Voici le nœud supplémentaire A, destiné à allonger davantage la liste de la table des matières.

#### Deuxième groupe : Nœud supplémentaire B

Voici le nœud supplémentaire B, destiné à allonger davantage la liste de la table des matières.

#### Deuxième groupe : Nœud supplémentaire C

Voici le nœud supplémentaire C, destiné à allonger davantage la liste de la table des matières.

## Listes, tâches et tableaux

Le groupe suivant vérifie principalement que les extensions GFM sont entièrement intégrées.

### Listes non ordonnées et listes ordonnées

- Priorité à la structure de la page d’accueil.
- Priorité à la table des matières de la page d’article.
- La zone des commentaires doit rester intuitive.

1. Vérifier d’abord la fiabilité de la table des matières.
2. Vérifier ensuite la fluidité du partage et des dons.
3. Enfin, s’assurer que la zone des commentaires permet réellement de publier.

### Liste de tâches

- [x] Analyse de l’image d’en‑tête et des métadonnées
- [x] Agrégation des tags et des catégories
- [x] Correction des niveaux de la table des matières
- [x] Réorganisation des structures de dons et de partage
- [ ] Intégration de données de commentaires distants réelles
- [ ] Ajout de davantage de balises de contenu à la manière d’AnZhiYu

### Tableau

| Module | Objectif actuel | Critères d'acceptation |
| --- | --- | --- |
| Carte de catégorie d'accueil | Aligner les animations du thème | Angle des icônes, stratégie de zoom et rythme du survol cohérents |
| Table des matières | Hiérarchie précise tout en restant cliquable | H2/H3/H4 reconnaissables, chemin d'activité clair |
| Fenêtre de don | Afficher uniquement les informations pertinentes | Sélection de zone + QR code, avec évitement automatique du viewport |
| Outils de partage | Correspond réellement aux différentes plateformes | Pas seulement copier le lien, mais générer le contenu de partage approprié |
| Section des commentaires | Publication directe | Disposition verticale, hauteur fixe, défilement pour parcourir les commentaires publics |

## Citations, blocs pliables et code long

> Un thème de blog mature ne doit pas seulement avoir l'air correct sur une capture d'écran, il doit fonctionner de manière continue et stable dans de longs articles réels.

Cette citation teste principalement la perception de hiérarchie du blockquote et le rythme du texte principal.

<details>
  <summary>Cliquez pour développer le bloc pliable, vérifiez que le style de summary/details est lisible</summary>
  <p>Les blocs pliables sont très adaptés pour placer des explications secondaires, du matériel supplémentaire et des notes temporaires. Ici, ils sont volontairement présentés en HTML natif plutôt qu'avec des balises propriétaires du thème, afin de préserver la transférabilité du contenu Markdown.</p>
  <p>Si vous migrez votre système d'articles de Markdown local vers une API ou un CMS, ce type de structure HTML standard sera plus fiable que les shortcodes propriétaires du thème.</p>
</details>

### Bloc de code TypeScript

```ts
type TocNode = {
  id: string;
  depth: 2 | 3 | 4;
  title: string;
  children: TocNode[];
};

export function compressTocIndent(nodes: TocNode[], offset = 0): TocNode[] {
  return nodes.map((node) => ({
    ...node,
    children: compressTocIndent(node.children, offset + 1),
  }));
}

const sharePayload = {
  title: "安知鱼式主题对齐",
  summary: "把目录、分享、评论与打赏的真实使用路径一起补齐。",
  platforms: ["wechat", "weibo", "x", "telegram", "email"],
};
```

### Bloc de code Bash

```bash
npm install
npm run build
npm run preview -- --host 0.0.0.0
```

### Bloc de code CSS

```css
#card-toc .toc-item {
  padding-left: calc(var(--toc-level, 0) * 12px);
}

#card-toc .toc-item.is-active-branch > .toc-link {
  background: color-mix(in srgb, var(--theme-main) 10%, var(--card-bg));
}

.post-share-grid__surface {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
```

## Images, séparateurs et notes de bas de page

Voici une image destinée à vérifier que les images insérées dans le texte ne dépassent pas la largeur de l'article et conservent un espacement stable avec le contexte.

![Espace de travail et environnement d'écriture](/media/shijianus/workbench.jpg)

---

Les notes de bas de page sont également courantes dans les longs articles ; nous les utilisons maintenant pour tester si la prise en charge des notes de bas de page GFM fonctionne.[^toc]

[^toc]: Le texte de cette note de bas de page sera placé en bas de l'article, afin de vérifier la numérotation, le lien et l'espacement avec le texte principal.

## Médias et compléments intégrés

Si vous souhaitez utiliser cet article comme audit complet du thème, il faut également vérifier les blocs multimédias du texte :

<figure>
  <video src="/media/shijianus/avatar-dynamic.mp4" poster="/media/shijianus/default.png" muted loop playsinline controls></video>
  <figcaption>Vidéo locale + poster, pour vérifier que les médias du texte restent stables à différentes largeurs.</figcaption>
</figure>

<figure>
  <img src="https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1600&q=80" alt="Exemple d'hébergement d'image à distance" />
  <figcaption>Image hébergée à distance, pour s'assurer que les ressources cross‑origin et les marges du texte ne se gênent pas.</figcaption>
</figure>

Si les ressources distantes échouent, le script d'amélioration du texte les remplacera par une image de substitution par défaut, au lieu de laisser un cadre vide et cassé.

## Démonstration d’équivalence des blocs de contenu courants

Cette section ne se contente plus de tester le Markdown de base, mais complète les blocs de contenu les plus courants dans les thèmes de blog quotidiens, qui sont également les plus susceptibles d’être perdus lors d’une migration. Nous utilisons du HTML natif et le style du thème actuel pour une démonstration équivalente, en mettant l’accent sur la mise en page, les espacements et la réactivité, plutôt que sur la syntaxe propriétaire d’un ancien thème.

<div class="article-demo-stack">
  <div class="article-demo-tabs">
    <div class="article-demo-tabs__nav">
      <span>Panneau d'onglets</span>
      <span>Instructions étape par étape</span>
      <span>Conclusion d'adaptation</span>
    </div>
    <div class="article-demo-tabs__panel">
      Ce groupe simule les zones de contenu courantes avec des onglets / boutons, afin de vérifier que les blocs d'information sous forme de boutons conservent suffisamment de hiérarchie dans le texte et n'interrompent pas le rythme du contenu.
    </div>
  </div>

  <div class="article-demo-timeline">
    <div class="article-demo-timeline__item">
      <strong>Phase 1 : Alignement de la structure</strong>
      <span>Commencez par aligner les squelettes de la page d'article, de la page d'accueil, du sommaire et de la barre latérale fixe, afin que le lecteur ne perde pas la navigation avant la zone des commentaires ou le pied de page.</span>
    </div>
    <div class="article-demo-timeline__item">
      <strong>Phase 2 : Consolidation des interactions</strong>
      <span>Nettoyez les boutons redondants, placez le partage, la langue, le compte et les paramètres à des emplacements plus clairs, afin d'éviter qu'ils ne se disputent l'espace.</span>
    </div>
    <div class="article-demo-timeline__item">
      <strong>Phase 3 : Rétroaction du contenu</strong>
      <span>Ajoutez les médias, le contenu masqué, les QR codes, les cartes de site et les tests de charge de longs textes, afin de garantir que le texte long ne se désagrège pas.</span>
    </div>
  </div>

  <div class="article-demo-gallery">
    <img src="/media/shijianus/workbench.jpg" alt="Image du poste de travail" />
    <img src="/media/shijianus/hero.jpg" alt="Bloc d'en-tête de la page d'accueil" />
    <img src="/media/shijianus/tg-group.jpg" alt="Test de QR code et d'image longue" />
  </div>

  <div class="article-demo-links">
    <div class="article-demo-link-card">
      <strong>Carte de site</strong>
      <span>Équivalent aux cartes de site / cartes de lien courantes, vérifie que les liens sous forme de cartes conservent une surface de clic suffisante dans le texte.</span>
    </div>
    <div class="article-demo-link-card">
      <strong>Carte média</strong>
      <span>En combinaison avec les hébergeurs d'images, les QR codes et les couvertures vidéo, confirme que les contenus de tailles différentes ne perturbent pas la largeur du texte ni le rythme des espaces.</span>
    </div>
  </div>
</div>

## Test de défilement de longs paragraphes

Le vrai problème n'apparaît généralement pas dans un texte de démonstration très court, mais dans un article suffisamment long, contenant plusieurs modules, avec un sommaire et des outils flottants. Ainsi, nous ajoutons intentionnellement deux paragraphes plus longs pour tester, lors du défilement, la continuité du contenu après l'image d'en-tête, la respiration du texte, le comportement sticky de la barre latérale, les éléments actifs du sommaire, ainsi que l'écart de lecture entre la zone de dons et la zone de commentaires, afin de vérifier leur stabilité.

Une page d'article stable ne doit pas obliger l'utilisateur à comprendre la structure des composants, la pile technologique ou les mécanismes d'interaction. L'utilisateur ne ressent réellement que trois choses : premièrement, puis-je trouver rapidement le paragraphe que je cherche ; deuxièmement, lorsque je veux partager, faire un don ou commenter, ces points d'accès apparaissent-ils exactement quand j'en ai besoin, sans interrompre massivement le texte ; troisièmement, lorsque l'article devient très long, que le sommaire comporte de nombreux nœuds et que les commentaires continuent de croître, la page peut-elle encore maintenir l'ordre. Tant que ces trois points sont remplis, le thème passe de « ressemble à un thème » à « un véritable système de contenu utilisable à long terme ».

Enfin, ajoutons un résumé davantage du point de vue de l'auteur : aligner le thème AnZhiYu ne signifie pas copier chaque ligne de modèle, mais réinterpréter les décisions de conception qui ont été validées sur le long terme, puis les reproduire dans l'écosystème Astro de manière adaptée à la structure actuelle du projet. Ce qui mérite réellement d'être reproduit n'est pas l'ancienne pile technologique, mais son sens du priorisation de l'information, du retour d'interaction, du parcours de lecture et de l'ordre des modules. Si ces jugements ont été entièrement validés dans cet article, alors ce travail d'alignement entre réellement dans une phase livrable.