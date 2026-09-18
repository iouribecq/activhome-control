// Activhome System Health - v0.1.1
//
// Carte de santé système pour Home Assistant.
//
// Configuration YAML :
//
// type: custom:activhome-system-health
// cpu: sensor.system_monitor_utilisation_du_processeur
// memory: sensor.system_monitor_memoire_utilisee
// disk: sensor.system_monitor_utilisation_du_disque
// backup: sensor.backup_last_successful_automatic_backup
// theme: Tr40_pl20blc_ic32_coverJaune
//
// Seuils V1 :
//
// CPU
// - OK        < 70 %
// - Attention >= 70 %
// - Critique  >= 90 %
//
// Mémoire
// - OK        < 75 %
// - Attention >= 75 %
// - Critique  >= 90 %
//
// Disque
// - OK        < 80 %
// - Attention >= 80 %
// - Critique  >= 90 %
//
// La sauvegarde est informative uniquement.
// Elle n'influence pas l'état global.
//
// v0.1.1 :
// - correction de l'alignement vertical de l'icône du titre

class ActivhomeSystemHealth extends HTMLElement {

  constructor() {
    super();

    this.attachShadow({ mode: "open" });

    this._config = {};
    this._hass = null;
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

    if (!config.cpu) {
      throw new Error(
        "Entité CPU manquante"
      );
    }

    if (!config.memory) {
      throw new Error(
        "Entité mémoire manquante"
      );
    }

    if (!config.disk) {
      throw new Error(
        "Entité disque manquante"
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

  getNumericState(entityId) {
    const entity =
      this.getEntity(entityId);

    if (!entity) {
      return null;
    }

    const value =
      Number(entity.state);

    if (
      Number.isNaN(value)
    ) {
      return null;
    }

    return value;
  }

  // =========================================================
  // ÉTAT DE SANTÉ
  // =========================================================

  getMetricStatus(
    value,
    warningThreshold,
    criticalThreshold
  ) {
    if (value === null) {
      return "unknown";
    }

    if (
      value >=
      criticalThreshold
    ) {
      return "critical";
    }

    if (
      value >=
      warningThreshold
    ) {
      return "warning";
    }

    return "ok";
  }

  getGlobalStatus(
    cpu,
    memory,
    disk
  ) {
    const cpuStatus =
      this.getMetricStatus(
        cpu,
        70,
        90
      );

    const memoryStatus =
      this.getMetricStatus(
        memory,
        75,
        90
      );

    const diskStatus =
      this.getMetricStatus(
        disk,
        80,
        90
      );

    const statuses = [
      cpuStatus,
      memoryStatus,
      diskStatus,
    ];

    if (
      statuses.includes(
        "critical"
      )
    ) {
      return "critical";
    }

    if (
      statuses.includes(
        "warning"
      )
    ) {
      return "warning";
    }

    if (
      statuses.includes(
        "unknown"
      )
    ) {
      return "unknown";
    }

    return "ok";
  }

  getStatusLabel(status) {
    switch (status) {
      case "ok":
        return "OK";

      case "warning":
        return "Attention";

      case "critical":
        return "Critique";

      default:
        return "Indisponible";
    }
  }

  // =========================================================
  // SAUVEGARDE
  // =========================================================

  formatBackup(entityId) {
    if (!entityId) {
      return "Non configurée";
    }

    const entity =
      this.getEntity(entityId);

    if (!entity) {
      return "Indisponible";
    }

    const state =
      entity.state;

    if (
      !state ||
      state === "unknown" ||
      state === "unavailable"
    ) {
      return "Indisponible";
    }

    const date =
      new Date(state);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return state;
    }

    const now =
      new Date();

    const today =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );

    const backupDay =
      new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );

    const diffMs =
      today.getTime() -
      backupDay.getTime();

    const diffDays =
      Math.round(
        diffMs /
        86400000
      );

    if (diffDays === 0) {
      return "Aujourd'hui";
    }

    if (diffDays === 1) {
      return "Hier";
    }

    if (
      diffDays > 1 &&
      diffDays < 7
    ) {
      return `Il y a ${diffDays} jours`;
    }

    return date.toLocaleDateString(
      "fr-FR",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );
  }

  // =========================================================
  // FORMATAGE
  // =========================================================

  formatPercent(value) {
    if (value === null) {
      return "—";
    }

    return `${Math.round(value)} %`;
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
        `[Activhome System Health] Thème introuvable : ${themeName}`
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
    if (
      !this._hass ||
      !this._config
    ) {
      return;
    }

    const cpu =
      this.getNumericState(
        this._config.cpu
      );

    const memory =
      this.getNumericState(
        this._config.memory
      );

    const disk =
      this.getNumericState(
        this._config.disk
      );

    const globalStatus =
      this.getGlobalStatus(
        cpu,
        memory,
        disk
      );

    const statusLabel =
      this.getStatusLabel(
        globalStatus
      );

    const backup =
      this.formatBackup(
        this._config.backup
      );

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
            20px;
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

        .status {
          display: flex;

          align-items:
            center;

          gap: 8px;

          font-size:
            15px;

          font-weight:
            500;
        }

        .status-dot {
          width: 10px;
          height: 10px;

          border-radius:
            50%;
        }

        .status.ok {
          color:
            var(
              --success-color,
              #4CAF50
            );
        }

        .status.ok
        .status-dot {
          background:
            var(
              --success-color,
              #4CAF50
            );
        }

        .status.warning {
          color:
            var(
              --warning-color,
              #FFB300
            );
        }

        .status.warning
        .status-dot {
          background:
            var(
              --warning-color,
              #FFB300
            );
        }

        .status.critical {
          color:
            var(
              --error-color,
              #F44336
            );
        }

        .status.critical
        .status-dot {
          background:
            var(
              --error-color,
              #F44336
            );
        }

        .status.unknown {
          color:
            var(
              --secondary-text-color
            );
        }

        .status.unknown
        .status-dot {
          background:
            var(
              --secondary-text-color
            );
        }

        .metrics {
          display: grid;

          grid-template-columns:
            repeat(
              3,
              1fr
            );

          gap: 12px;

          margin-bottom:
            18px;
        }

        .metric {
          text-align:
            center;

          min-width: 0;
        }

        .metric-label {
          font-size:
            14px;

          color:
            var(
              --secondary-text-color
            );

          margin-bottom:
            6px;
        }

        .metric-value {
          font-size:
            22px;

          font-weight:
            500;

          color:
            var(
              --primary-text-color
            );
        }

        .divider {
          height: 1px;

          background:
            var(
              --divider-color
            );

          margin:
            0
            0
            14px
            0;
        }

        .backup {
          display: grid;

          grid-template-columns:
            1fr auto;

          align-items:
            center;

          gap: 16px;

          font-size:
            15px;
        }

        .backup-label {
          color:
            var(
              --primary-text-color
            );
        }

        .backup-value {
          color:
            var(
              --secondary-text-color
            );

          text-align:
            right;
        }

      </style>

      <ha-card>

        <div class="header">

          <div class="title">

            <ha-icon
              icon="mdi:heart-pulse"
            ></ha-icon>

            <span>
              Santé du système
            </span>

          </div>

          <div
            class="
              status
              ${globalStatus}
            "
          >

            <span
              class="status-dot"
            ></span>

            <span>
              ${statusLabel}
            </span>

          </div>

        </div>

        <div class="metrics">

          <div class="metric">

            <div class="metric-label">
              CPU
            </div>

            <div class="metric-value">
              ${this.formatPercent(cpu)}
            </div>

          </div>

          <div class="metric">

            <div class="metric-label">
              Mémoire
            </div>

            <div class="metric-value">
              ${this.formatPercent(memory)}
            </div>

          </div>

          <div class="metric">

            <div class="metric-label">
              Disque
            </div>

            <div class="metric-value">
              ${this.formatPercent(disk)}
            </div>

          </div>

        </div>

        <div class="divider"></div>

        <div class="backup">

          <div class="backup-label">
            Dernière sauvegarde
          </div>

          <div class="backup-value">
            ${backup}
          </div>

        </div>

      </ha-card>
    `;

    this.applyTheme();
  }
}

// ===========================================================
// ENREGISTREMENT
// ===========================================================

if (
  !customElements.get(
    "activhome-system-health"
  )
) {
  customElements.define(
    "activhome-system-health",
    ActivhomeSystemHealth
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
      "activhome-system-health"
  )
) {
  window.customCards.push({
    type:
      "activhome-system-health",

    name:
      "Activhome System Health",

    description:
      "État de santé du système Home Assistant",
  });
}

// ===========================================================
// READY
// ===========================================================

console.info(
  "[Activhome System Health] v0.1.1 chargé"
);