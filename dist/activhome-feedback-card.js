// Activhome Feedback Card - v0.3.0
//
// Carte locale de configuration pour Activhome Feedback.
//
// Compatible avec Activhome Feedback v0.7.0+
//
// Paramètres enregistrés localement via le moteur
// ActivhomeFeedback.
//
// Sons disponibles :
// - OFF
// - CLICK
// - CLAC
// - SUCCESS
// - ERROR
//
// Option YAML :
// theme: NomDuTheme
//
// v0.3.0 :
// - ajout du toggle "Retour haptique"
// - haptique indépendant du feedback sonore
// - mention "Disponible uniquement sur iPhone"
// - correction du focus des listes déroulantes
// - suppression du rerender à chaque mise à jour de hass
//
// v0.2.2 :
// - correction couleur du toggle ON
// - variable personnalisable :
//   --activhome-feedback-toggle-on-color

class ActivhomeFeedbackCard extends HTMLElement {

  constructor() {
    super();

    this.attachShadow({ mode: "open" });

    this._config = {};
    this._hass = null;
    this._rendered = false;
  }

  // =========================================================
  // HOME ASSISTANT
  // =========================================================

  setConfig(config) {
    this._config = config || {};

    if (this._rendered) {
      this.render();
    }
  }

  set hass(hass) {
    this._hass = hass;

    // IMPORTANT :
    //
    // Cette carte ne dépend d'aucun état d'entité Home Assistant.
    //
    // On évite donc de reconstruire tout son DOM
    // à chaque mise à jour de hass.
    //
    // C'était notamment susceptible de faire perdre
    // le focus aux listes déroulantes sur iPhone.

    if (!this._rendered) {
      this.render();
    } else {
      this.applyTheme();
    }
  }

  getCardSize() {
    return 6;
  }

  // =========================================================
  // MOTEUR
  // =========================================================

  getEngine() {
    return window.ActivhomeFeedback || null;
  }

  getFeedbackConfig() {
    const engine =
      this.getEngine();

    if (!engine) {
      return null;
    }

    return engine.getConfig();
  }

  updateFeedbackConfig(
    values,
    rerender = true
  ) {
    const engine =
      this.getEngine();

    if (!engine) {
      return;
    }

    engine.setConfig(values);

    if (rerender) {
      this.render();
    }
  }

  // =========================================================
  // THÈME
  // =========================================================

  applyTheme() {
    const themeName =
      this._config?.theme;

    if (!themeName) {
      return;
    }

    const themes =
      this._hass
        ?.themes
        ?.themes;

    const theme =
      themes?.[themeName];

    if (!theme) {
      console.warn(
        `[Activhome Feedback Card] Thème introuvable : ${themeName}`
      );

      return;
    }

    const card =
      this.shadowRoot
        ?.querySelector(
          "ha-card"
        );

    if (!card) {
      return;
    }

    for (
      const [key, value]
      of Object.entries(theme)
    ) {
      if (
        typeof value === "string" ||
        typeof value === "number"
      ) {
        card.style.setProperty(
          `--${key}`,
          String(value)
        );
      }
    }
  }

  // =========================================================
  // RENDER
  // =========================================================

  render() {
    this._rendered = true;

    const settings =
      this.getFeedbackConfig();

    if (!settings) {
      this.shadowRoot.innerHTML = `
        <ha-card>

          <div class="error">
            Activhome Feedback n'est pas chargé.
          </div>

        </ha-card>
      `;

      return;
    }

    const soundEnabled =
      settings.enabled !== false;

    const hapticEnabled =
      settings.haptic_enabled !== false;

    const volume =
      Math.round(
        (settings.volume ?? 0.8) *
        100
      );

    this.shadowRoot.innerHTML = `
      <style>

        :host {
          display: block;
        }

        ha-card {
          padding: 20px;

          box-sizing: border-box;

          background:
            var(
              --ha-card-background,
              var(
                --card-background-color
              )
            );

          color:
            var(
              --primary-text-color
            );

          border-radius:
            var(
              --ha-card-border-radius,
              12px
            );

          box-shadow:
            var(
              --ha-card-box-shadow
            );
        }

        /* ===================================================
           TITRE
           =================================================== */

        .title {
          font-size: 20px;

          font-weight: 500;

          margin-bottom: 22px;

          color:
            var(
              --primary-text-color
            );
        }

        /* ===================================================
           LIGNES
           =================================================== */

        .row {
          display: grid;

          grid-template-columns:
            minmax(0, 1fr)
            auto;

          align-items: center;

          min-height: 52px;

          gap: 16px;
        }

        .label {
          font-size: 16px;

          color:
            var(
              --primary-text-color
            );
        }

        .label-group {
          min-width: 0;
        }

        .helper {
          margin-top: 3px;

          font-size: 12px;

          line-height: 1.3;

          color:
            var(
              --secondary-text-color
            );
        }

        /* ===================================================
           VOLUME
           =================================================== */

        .volume-row {
          margin-top: 6px;
          margin-bottom: 12px;
        }

        .volume-header {
          display: flex;

          justify-content:
            space-between;

          align-items: center;

          gap: 16px;

          margin-bottom: 8px;
        }

        .volume-value {
          font-size: 14px;

          color:
            var(
              --secondary-text-color
            );

          white-space: nowrap;
        }

        input[type="range"] {
          width: 100%;

          margin: 0;

          cursor: pointer;

          accent-color:
            var(
              --primary-color
            );
        }

        /* ===================================================
           LISTES DE SONS
           =================================================== */

        select {
          min-width: 120px;

          padding:
            8px
            30px
            8px
            10px;

          border-radius: 8px;

          border:
            1px solid
            var(
              --divider-color
            );

          background:
            var(
              --card-background-color
            );

          color:
            var(
              --primary-text-color
            );

          font-size: 15px;

          cursor: pointer;

          touch-action: manipulation;
        }

        select:focus {
          outline:
            2px solid
            var(
              --primary-color
            );

          outline-offset: 2px;
        }

        select:disabled {
          cursor: default;
        }

        /* ===================================================
           SÉPARATEUR
           =================================================== */

        .divider {
          height: 1px;

          background:
            var(
              --divider-color
            );

          margin: 8px 0;
        }

        /* ===================================================
           TOGGLE
           =================================================== */

        .switch {
          position: relative;

          width: 44px;
          height: 24px;

          display: inline-block;

          flex:
            0 0 auto;
        }

        .switch input {
          opacity: 0;

          width: 0;
          height: 0;
        }

        .switch-slider {
          position: absolute;

          cursor: pointer;

          inset: 0;

          background:
            var(
              --disabled-text-color
            );

          border-radius: 24px;

          transition: 0.2s;
        }

        .switch-slider::before {
          content: "";

          position: absolute;

          width: 18px;
          height: 18px;

          left: 3px;
          top: 3px;

          background:
            var(
              --text-primary-color,
              white
            );

          border-radius: 50%;

          transition: 0.2s;
        }

        .switch input:checked
        + .switch-slider {
          background:
            var(
              --activhome-feedback-toggle-on-color,
              var(
                --state-active-color,
                #FFCC00
              )
            );
        }

        .switch input:checked
        + .switch-slider::before {
          transform:
            translateX(20px);
        }

        /* ===================================================
           ÉTATS
           =================================================== */

        .disabled {
          opacity: 0.45;
        }

        .error {
          padding: 20px;

          color:
            var(
              --error-color
            );
        }

      </style>

      <ha-card>

        <div class="title">
          Activhome Feedback
        </div>

        <!-- ============================================= -->
        <!-- FEEDBACK SONORE                               -->
        <!-- ============================================= -->

        <div class="row">

          <div class="label">
            Feedback sonore
          </div>

          <label class="switch">

            <input
              id="enabled"
              type="checkbox"
              ${
                soundEnabled
                  ? "checked"
                  : ""
              }
            >

            <span
              class="switch-slider"
            ></span>

          </label>

        </div>

        <div class="divider"></div>

        <!-- ============================================= -->
        <!-- RETOUR HAPTIQUE                               -->
        <!-- ============================================= -->

        <div class="row">

          <div class="label-group">

            <div class="label">
              Retour haptique
            </div>

            <div class="helper">
              Disponible uniquement sur iPhone
            </div>

          </div>

          <label class="switch">

            <input
              id="hapticEnabled"
              type="checkbox"
              ${
                hapticEnabled
                  ? "checked"
                  : ""
              }
            >

            <span
              class="switch-slider"
            ></span>

          </label>

        </div>

        <div class="divider"></div>

        <!-- ============================================= -->
        <!-- VOLUME                                        -->
        <!-- ============================================= -->

        <div
          class="
            volume-row
            ${
              soundEnabled
                ? ""
                : "disabled"
            }
          "
        >

          <div class="volume-header">

            <div class="label">
              Volume du feedback
            </div>

            <div
              id="volumeValue"
              class="volume-value"
            >
              ${volume} %
            </div>

          </div>

          <input
            id="volume"
            type="range"
            min="0"
            max="100"
            step="1"
            value="${volume}"
            ${
              soundEnabled
                ? ""
                : "disabled"
            }
          >

        </div>

        <div class="divider"></div>

        <!-- ============================================= -->
        <!-- SONS                                          -->
        <!-- ============================================= -->

        ${this.createSoundRow(
          "Commande",
          "command",
          settings.command,
          soundEnabled
        )}

        ${this.createSoundRow(
          "Navigation",
          "navigation",
          settings.navigation,
          soundEnabled
        )}

        ${this.createSoundRow(
          "Sliders",
          "slider",
          settings.slider,
          soundEnabled
        )}

        ${this.createSoundRow(
          "Confirmation",
          "confirmation",
          settings.confirmation,
          soundEnabled
        )}

        ${this.createSoundRow(
          "Erreur",
          "error",
          settings.error,
          soundEnabled
        )}

      </ha-card>
    `;

    this.bindEvents();
    this.applyTheme();
  }

  // =========================================================
  // LIGNE DE SÉLECTION D'UN SON
  // =========================================================

  createSoundRow(
    label,
    key,
    value,
    enabled
  ) {
    return `
      <div
        class="
          row
          ${
            enabled
              ? ""
              : "disabled"
          }
        "
      >

        <div class="label">
          ${label}
        </div>

        <select
          data-setting="${key}"
          ${
            enabled
              ? ""
              : "disabled"
          }
        >

          ${this.soundOption(
            "off",
            "OFF",
            value
          )}

          ${this.soundOption(
            "click",
            "CLICK",
            value
          )}

          ${this.soundOption(
            "clac",
            "CLAC",
            value
          )}

          ${this.soundOption(
            "success",
            "SUCCESS",
            value
          )}

          ${this.soundOption(
            "error",
            "ERROR",
            value
          )}

        </select>

      </div>
    `;
  }

  // =========================================================
  // OPTION DE SON
  // =========================================================

  soundOption(
    value,
    label,
    selected
  ) {
    return `
      <option
        value="${value}"
        ${
          value === selected
            ? "selected"
            : ""
        }
      >
        ${label}
      </option>
    `;
  }

  // =========================================================
  // EVENTS
  // =========================================================

  bindEvents() {

    // -------------------------------------------------------
    // FEEDBACK SONORE ON / OFF
    // -------------------------------------------------------

    const enabled =
      this.shadowRoot
        .getElementById(
          "enabled"
        );

    enabled?.addEventListener(
      "change",
      (event) => {

        this.updateFeedbackConfig({
          enabled:
            event.target.checked,
        });

      }
    );

    // -------------------------------------------------------
    // HAPTIQUE ON / OFF
    // -------------------------------------------------------

    const hapticEnabled =
      this.shadowRoot
        .getElementById(
          "hapticEnabled"
        );

    hapticEnabled
      ?.addEventListener(
        "change",
        (event) => {

          const value =
            event.target.checked;

          this.updateFeedbackConfig({
            haptic_enabled:
              value,
          });

          // Lorsque l'utilisateur active
          // l'haptique sur iPhone,
          // on donne immédiatement
          // une confirmation tactile.

          if (value) {
            this.getEngine()
              ?.testHaptic(
                "heavy"
              );
          }

        }
      );

    // -------------------------------------------------------
    // VOLUME
    //
    // Pas de rerender pendant la manipulation :
    // on conserve le contrôle sous le doigt.
    // -------------------------------------------------------

    const volume =
      this.shadowRoot
        .getElementById(
          "volume"
        );

    const volumeValue =
      this.shadowRoot
        .getElementById(
          "volumeValue"
        );

    volume?.addEventListener(
      "input",
      (event) => {

        const value =
          Number(
            event.target.value
          );

        if (volumeValue) {
          volumeValue.textContent =
            `${value} %`;
        }

        this.updateFeedbackConfig(
          {
            volume:
              value / 100,
          },
          false
        );

      }
    );

    // -------------------------------------------------------
    // SÉLECTEURS DE SON
    //
    // On ne reconstruit PAS la carte après changement.
    //
    // Cela évite de casser le focus / menu natif iOS.
    // -------------------------------------------------------

    const selectors =
      this.shadowRoot
        .querySelectorAll(
          "select[data-setting]"
        );

    selectors.forEach(
      (selector) => {

        selector.addEventListener(
          "change",
          (event) => {

            const key =
              event.target
                .dataset
                .setting;

            const value =
              event.target
                .value;

            this.updateFeedbackConfig(
              {
                [key]:
                  value,
              },
              false
            );

            // Pré-écoute immédiate
            // du son sélectionné.

            if (
              value !== "off"
            ) {
              this.getEngine()
                ?.test(
                  value
                );
            }

          }
        );

      }
    );
  }
}

// ===========================================================
// ENREGISTREMENT DE LA CARTE
// ===========================================================

if (
  !customElements.get(
    "activhome-feedback-card"
  )
) {
  customElements.define(
    "activhome-feedback-card",
    ActivhomeFeedbackCard
  );
}

// ===========================================================
// CARTE DISPONIBLE DANS HOME ASSISTANT
// ===========================================================

window.customCards =
  window.customCards || [];

if (
  !window.customCards.some(
    (card) =>
      card.type ===
      "activhome-feedback-card"
  )
) {
  window.customCards.push({
    type:
      "activhome-feedback-card",

    name:
      "Activhome Feedback",

    description:
      "Configuration locale du feedback Activhome",
  });
}

// ===========================================================
// READY
// ===========================================================

console.info(
  "[Activhome Feedback Card] v0.3.0 chargé"
);