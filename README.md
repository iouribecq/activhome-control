# Activhome Control

**Activhome Control** regroupe les composants Home Assistant développés pour le tableau de bord de contrôle et de maintenance Activhome.

## Composants

### Activhome System Health — v0.1.1

Carte de surveillance de l'état du système Home Assistant :

- utilisation du processeur ;
- utilisation de la mémoire ;
- utilisation du disque ;
- dernier backup automatique réussi ;
- état global du système.

Cette carte utilise les capteurs fournis par l'intégration **System Monitor** de Home Assistant.

```yaml
type: custom:activhome-system-health
```

### Activhome Maintenance — v0.1.2

Carte dédiée à la maintenance et aux mises à jour de Home Assistant.

Elle gère notamment :

- Home Assistant Core ;
- Home Assistant Supervisor ;
- Home Assistant Operating System ;
- les autres entités `update.*` détectées automatiquement.

```yaml
type: custom:activhome-maintenance
```

### Activhome Device Info — v0.2.0

Carte compacte permettant d'afficher les informations d'un appareil utilisant les capteurs Home Assistant Companion.

Elle peut notamment afficher :

- niveau de batterie ;
- état de charge ;
- type de connexion ;
- réseau Wi-Fi / SSID.

```yaml
type: custom:activhome-device-info
```

### Activhome Feedback — v0.7.0

Moteur global de feedback pour l'interface Home Assistant.

Il permet notamment :

- les retours sonores ;
- les retours haptiques sur les appareils compatibles ;
- le réglage du volume ;
- la gestion des différentes catégories de sons.

Le moteur est exposé dans Home Assistant via `window.ActivhomeFeedback`.

### Activhome Feedback Card — v0.3.0

Carte permettant de configurer le moteur Activhome Feedback directement depuis Home Assistant.

```yaml
type: custom:activhome-feedback-card
```

## Ordre de chargement

`activhome-feedback.js` doit être chargé avant `activhome-feedback-card.js`.

La carte de configuration utilise le moteur global `window.ActivhomeFeedback` fourni par `activhome-feedback.js`.

## Structure du dépôt

```text
activhome-control/
├── dist/
│   ├── activhome-control.js
│   ├── activhome-system-health.js
│   ├── activhome-maintenance.js
│   ├── activhome-device-info.js
│   ├── activhome-feedback.js
│   └── activhome-feedback-card.js
├── hacs.json
├── README.md
└── LICENSE
```

## Compatibilité

Développé pour Home Assistant et les tableaux de bord Lovelace.

## Auteur

**Iouri Becq / Activhome**

## Contact

- Contact direct : i.becq@activ-home.ch
- Contact projet : info@activ-home.ch

## Licence

MIT License  
© 2025–2026 — Iouri Becq / Activhome
