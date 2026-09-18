// Activhome Maintenance - v0.1.2
//
// Carte de maintenance Home Assistant.
//
// Configuration YAML :
//
// type: custom:activhome-maintenance
// core: update.home_assistant_core_update
// supervisor: update.home_assistant_supervisor_update
// os: update.home_assistant_operating_system_update
// theme: Tr40_pl20blc_ic32_coverJaune
//
// Les autres entités update.* sont détectées automatiquement.
//
// v0.1.2 :
// - correction de l'alignement vertical de l'icône du titre
//
// v0.1.1 :
// - liste "Autres mises à jour" repliable
// - fermée par défaut

class ActivhomeMaintenance extends HTMLElement {

  constructor() {
    super();

    this.attachShadow({ mode: "open" });

    this._config = {};
    this._hass = null;

    this._otherExpanded = false;
  }

  // =========================================================
  // CONFIGURATION
  // =========================================================

  setConfig(config) {
    if (!config) {
      throw new Error(
        "Configuration manquante"
      );
    }

    if (!config.core) {
      throw new Error(
        "Entité Core manquante"
      );
    }

    if (!config.supervisor) {
      throw new Error(
        "Entité Supervisor manquante"
      );
    }

    if (!config.os) {
      throw new Error(
        "Entité Home Assistant OS manquante"
      );
    }

    this._config = {
      ...config,
    };

    if (this._hass) {
      this.render();
    }
  }

  set hass(hass) {
    this._hass = hass;

    this.render();
  }

  getCardSize() {
    return 3;
  }

  // =========================================================
  // ENTITÉS
  // =========================================================

  getEntity(entityId) {
    if (
      !entityId ||
      !this._hass?.states
    ) {
      return null;
    }

    return (
      this._hass.states[
        entityId
      ] || null
    );
  }

  // =========================================================
  // UPDATE AVAILABLE
  // =========================================================

  isUpdateAvailable(entity) {
    if (!entity) {
      return false;
    }

    return (
      entity.state === "on"
    );
  }

  // =========================================================
  // VERSION
  // =========================================================

  getInstalledVersion(entity) {
    if (!entity) {
      return "—";
    }

    return (
      entity.attributes
        ?.installed_version ??
      entity.attributes
        ?.current_version ??
      "—"
    );
  }

  getLatestVersion(entity) {
    if (!entity) {
      return null;
    }

    return (
      entity.attributes
        ?.latest_version ??
      null
    );
  }

  // =========================================================
  // NOM
  // =========================================================

  getFriendlyName(entity) {
    if (!entity) {
      return "Inconnu";
    }

    return (
      entity.attributes
        ?.friendly_name ||
      entity.entity_id ||
      "Inconnu"
    );
  }

  // =========================================================
  // AUTRES UPDATES
  // =========================================================

  getOtherUpdates() {
    if (!this._hass?.states) {
      return [];
    }

    const excluded = new Set([
      this._config.core,
      this._config.supervisor,
      this._config.os,
    ]);

    return Object.entries(
      this._hass.states
    )
      .filter(
        ([entityId]) =>
          entityId.startsWith(
            "update."
          )
      )
      .filter(
        ([entityId]) =>
          !excluded.has(
            entityId
          )
      )
      .map(
        ([entityId, entity]) => ({
          entityId,
          entity,
        })
      )
      .filter(
        ({ entity }) =>
          this.isUpdateAvailable(
            entity
          )
      )
      .sort(
        (a, b) =>
          this.getFriendlyName(
            a.entity
          ).localeCompare(
            this.getFriendlyName(
              b.entity
            ),
            "fr"
          )
      );
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
        `[Activhome Maintenance] Thème introuvable : ${themeName}`
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
  // STATUS HTML
  // =========================================================

  renderStatus(entity) {
    if (!entity) {
      return `
        <div class="status unknown">
          <span class="dot"></span>
          <span>Indisponible</span>
        </div>
      `;
    }

    if (
      this.isUpdateAvailable(
        entity
      )
    ) {
      return `
        <div class="status update">
          <span class="dot"></span>
          <span>Mise à jour</span>
        </div>
      `;
    }

    return `
      <div class="status ok">
        <span class="dot"></span>
        <span>À jour</span>
      </div>
    `;
  }

  // =========================================================
  // LIGNE PRINCIPALE
  // =========================================================

  renderMainUpdate(
    label,
    entity
  ) {
    const installed =
      this.getInstalledVersion(
        entity
      );

    const latest =
      this.getLatestVersion(
        entity
      );

    const updateAvailable =
      this.isUpdateAvailable(
        entity
      );

    let versionText =
      installed;

    if (
      updateAvailable &&
      latest &&
      latest !== installed
    ) {
      versionText =
        `${installed} → ${latest}`;
    }

    return `
      <div class="main-row">

        <div class="main-label">
          ${label}
        </div>

        <div class="version">
          ${versionText}
        </div>

        ${this.renderStatus(
          entity
        )}

      </div>
    `;
  }

  // =========================================================
  // AUTRES UPDATES HTML
  // =========================================================

  renderOtherUpdates(
    updates
  ) {
    const count =
      updates.length;

    const expanded =
      this._otherExpanded;

    return `
      <div
        class="
          other-summary
          ${count > 0 ? "clickable" : ""}
        "
        id="otherUpdatesToggle"
      >

        <div>
          Autres mises à jour
        </div>

        <div class="other-summary-right">

          <div
            class="
              other-count
              ${
                count === 0
                  ? "ok-text"
                  : ""
              }
            "
          >
            ${
              count === 0
                ? "Aucune"
                : count
            }
          </div>

          ${
            count > 0
              ? `
                <ha-icon
                  class="
                    expand-icon
                    ${
                      expanded
                        ? "expanded"
                        : ""
                    }
                  "
                  icon="mdi:chevron-right"
                ></ha-icon>
              `
              : ""
          }

        </div>

      </div>

      ${
        count > 0 &&
        expanded
          ? `
            <div class="updates-list">

              ${updates
                .map(
                  ({ entity }) => {

                    const name =
                      this.getFriendlyName(
                        entity
                      );

                    const installed =
                      this.getInstalledVersion(
                        entity
                      );

                    const latest =
                      this.getLatestVersion(
                        entity
                      );

                    let version = "";

                    if (
                      installed !== "—" &&
                      latest
                    ) {
                      version =
                        `${installed} → ${latest}`;
                    }

                    return `
                      <div class="update-item">

                        <div class="update-name">
                          ${name}
                        </div>

                        <div class="update-version">
                          ${version}
                        </div>

                      </div>
                    `;
                  }
                )
                .join("")}

            </div>
          `
          : ""
      }
    `;
  }

  // =========================================================
  // EVENTS
  // =========================================================

  bindEvents() {
    const toggle =
      this.shadowRoot
        ?.getElementById(
          "otherUpdatesToggle"
        );

    if (!toggle) {
      return;
    }

    const otherUpdates =
      this.getOtherUpdates();

    if (
      otherUpdates.length === 0
    ) {
      return;
    }

    toggle.addEventListener(
      "click",
      () => {
        this._otherExpanded =
          !this._otherExpanded;

        this.render();
      }
    );
  }

  // =========================================================
  // RENDER
  // =========================================================

  render() {
    if (
      !this._hass ||
      !this._config
    ) {
      return;
    }

    const core =
      this.getEntity(
        this._config.core
      );

    const supervisor =
      this.getEntity(
        this._config.supervisor
      );

    const os =
      this.getEntity(
        this._config.os
      );

    const otherUpdates =
      this.getOtherUpdates();

    const hasImportantUpdate =
      this.isUpdateAvailable(
        core
      ) ||
      this.isUpdateAvailable(
        supervisor
      ) ||
      this.isUpdateAvailable(
        os
      );

    const hasAnyUpdate =
      hasImportantUpdate ||
      otherUpdates.length > 0;

    this.shadowRoot.innerHTML = `
      <style>

        :host {
          display: block;
        }

        ha-card {
          padding:
            18px
            20px
            18px
            20px;

          box-sizing:
            border-box;

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

        .header {
          display: grid;

          grid-template-columns:
            1fr auto;

          align-items:
            center;

          gap: 16px;

          margin-bottom:
            18px;
        }

        .title {
          display: flex;

          align-items:
            center;

          gap: 10px;

          font-size:
            20px;

          font-weight:
            500;

          color:
            var(
              --primary-text-color
            );
        }

        .title ha-icon {
          width: 26px;
          height: 26px;

          display: flex;

          align-items: center;

          justify-content: center;

          transform: translateY(2px);
        }

        .global-status {
          display: flex;

          align-items:
            center;

          gap: 8px;

          font-size:
            15px;

          font-weight:
            500;
        }

        .global-dot,
        .dot {
          width: 10px;
          height: 10px;

          border-radius:
            50%;

          flex:
            0 0 auto;
        }

        .global-status.ok {
          color:
            var(
              --success-color,
              #4CAF50
            );
        }

        .global-status.ok
        .global-dot {
          background:
            var(
              --success-color,
              #4CAF50
            );
        }

        .global-status.update {
          color:
            var(
              --warning-color,
              #FFB300
            );
        }

        .global-status.update
        .global-dot {
          background:
            var(
              --warning-color,
              #FFB300
            );
        }

        .main-row {
          display: grid;

          grid-template-columns:
            minmax(0, 1fr)
            auto
            110px;

          align-items:
            center;

          gap: 14px;

          min-height:
            46px;
        }

        .main-label {
          font-size:
            15px;

          color:
            var(
              --primary-text-color
            );
        }

        .version {
          font-size:
            14px;

          color:
            var(
              --secondary-text-color
            );

          text-align:
            right;

          white-space:
            nowrap;
        }

        .status {
          display: flex;

          align-items:
            center;

          justify-content:
            flex-end;

          gap: 7px;

          font-size:
            14px;

          white-space:
            nowrap;
        }

        .status.ok {
          color:
            var(
              --success-color,
              #4CAF50
            );
        }

        .status.ok
        .dot {
          background:
            var(
              --success-color,
              #4CAF50
            );
        }

        .status.update {
          color:
            var(
              --warning-color,
              #FFB300
            );
        }

        .status.update
        .dot {
          background:
            var(
              --warning-color,
              #FFB300
            );
        }

        .status.unknown {
          color:
            var(
              --secondary-text-color
            );
        }

        .status.unknown
        .dot {
          background:
            var(
              --secondary-text-color
            );
        }

        .divider {
          height: 1px;

          background:
            var(
              --divider-color
            );

          margin:
            10px
            0
            12px
            0;
        }

        .other-summary {
          display: grid;

          grid-template-columns:
            1fr auto;

          align-items:
            center;

          gap: 16px;

          font-size:
            15px;

          min-height:
            40px;
        }

        .other-summary.clickable {
          cursor: pointer;
        }

        .other-summary-right {
          display: flex;

          align-items: center;

          gap: 8px;
        }

        .other-count {
          font-size:
            16px;

          font-weight:
            600;

          color:
            var(
              --warning-color,
              #FFB300
            );
        }

        .ok-text {
          color:
            var(
              --success-color,
              #4CAF50
            );
        }

        .expand-icon {
          width: 20px;
          height: 20px;

          color:
            var(
              --secondary-text-color
            );

          transition:
            transform 0.2s ease;
        }

        .expand-icon.expanded {
          transform:
            rotate(90deg);
        }

        .updates-list {
          margin-top:
            4px;

          padding-top:
            8px;

          border-top:
            1px solid
            var(
              --divider-color
            );
        }

        .update-item {
          display: grid;

          grid-template-columns:
            minmax(0, 1fr)
            auto;

          align-items:
            center;

          gap: 16px;

          min-height:
            34px;
        }

        .update-name {
          overflow:
            hidden;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;

          font-size:
            14px;

          color:
            var(
              --primary-text-color
            );
        }

        .update-version {
          font-size:
            13px;

          color:
            var(
              --secondary-text-color
            );

          white-space:
            nowrap;
        }

      </style>

      <ha-card>

        <div class="header">

          <div class="title">

            <ha-icon
              icon="mdi:update"
            ></ha-icon>

            <span>
              Maintenance
            </span>

          </div>

          <div
            class="
              global-status
              ${
                hasAnyUpdate
                  ? "update"
                  : "ok"
              }
            "
          >

            <span
              class="global-dot"
            ></span>

            <span>
              ${
                hasAnyUpdate
                  ? "Mises à jour"
                  : "À jour"
              }
            </span>

          </div>

        </div>

        ${this.renderMainUpdate(
          "Home Assistant Core",
          core
        )}

        ${this.renderMainUpdate(
          "Supervisor",
          supervisor
        )}

        ${this.renderMainUpdate(
          "Home Assistant OS",
          os
        )}

        <div class="divider"></div>

        ${this.renderOtherUpdates(
          otherUpdates
        )}

      </ha-card>
    `;

    this.bindEvents();
    this.applyTheme();
  }
}

// ===========================================================
// ENREGISTREMENT
// ===========================================================

if (
  !customElements.get(
    "activhome-maintenance"
  )
) {
  customElements.define(
    "activhome-maintenance",
    ActivhomeMaintenance
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
      "activhome-maintenance"
  )
) {
  window.customCards.push({
    type:
      "activhome-maintenance",

    name:
      "Activhome Maintenance",

    description:
      "Versions et mises à jour Home Assistant",
  });
}

// ===========================================================
// READY
// ===========================================================

console.info(
  "[Activhome Maintenance] v0.1.2 chargé"
);