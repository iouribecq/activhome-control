// Activhome Control - v0.1.1
//
// CHANGELOG v0.1.1:
// - FIX: chargement automatique des composants Activhome Control.
// - FIX: une seule ressource Lovelace est désormais nécessaire.
//
// Point d'entrée de la suite Activhome Control.

(async () => {
  const VERSION = "0.1.1";

  const baseUrl = new URL(".", import.meta.url);

  const components = [
    "activhome-feedback.js",
    "activhome-system-health.js",
    "activhome-maintenance.js",
    "activhome-device-info.js",
    "activhome-feedback-card.js",
  ];

  try {
    for (const component of components) {
      await import(new URL(component, baseUrl).href);
    }

    console.info(`[Activhome Control] v${VERSION} chargé`);
  } catch (error) {
    console.error(
      `[Activhome Control] v${VERSION} - erreur de chargement :`,
      error
    );
  }
})();