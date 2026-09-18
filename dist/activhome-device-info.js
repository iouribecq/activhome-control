// Activhome Device Info - v0.2.0
//
// v0.2.0
// - Suppression du bouton "Actualiser les capteurs"
// - Suppression de notify_service
// - Carte plus compacte
//
// v0.1.2
// - Correction de l'alignement vertical de l'icône du device
//
// Exemple :
//
// type: custom:activhome-device-info
// name: iPhone de Iouri
// icon: mdi:cellphone
// battery: sensor.iphone_iouri_battery_level
// battery_state: sensor.iphone_iouri_battery_state
// connection: sensor.iphone_iouri_connection_type
// ssid: sensor.iphone_iouri_ssid
// theme: Tr40_pl20blc_ic32_coverJaune

class ActivhomeDeviceInfo extends HTMLElement {

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
      throw new Error("Configuration manquante");
    }

    if (!config.battery) {
      throw new Error("Entité batterie manquante");
    }

    if (!config.battery_state) {
      throw new Error("Entité état de charge manquante");
    }

    if (!config.connection) {
      throw new Error("Entité connexion manquante");
    }

    if (!config.ssid) {
      throw new Error("Entité SSID manquante");
    }

    this._config = {
      name: "Appareil Companion",
      icon: "mdi:cellphone",
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
    return 2;
  }

  // =========================================================
  // ENTITÉS
  // =========================================================

  getEntity(entityId) {
    if (!entityId || !this._hass?.states) {
      return null;
    }

    return this._hass.states[entityId] || null;
  }

  getState(entityId) {
    const entity = this.getEntity(entityId);

    if (!entity) {
      return null;
    }

    const state = entity.state;

    if (
      !state ||
      state === "unknown" ||
      state === "unavailable"
    ) {
      return null;
    }

    return state;
  }

  // =========================================================
  // BATTERIE
  // =========================================================

  getBattery() {
    const state = this.getState(
      this._config.battery
    );

    if (state === null) {
      return null;
    }

    const value = Number(state);

    if (Number.isNaN(value)) {
      return null;
    }

    return value;
  }

  formatBattery(value) {
    if (value === null) {
      return "Indisponible";
    }

    return `${Math.round(value)} %`;
  }

  getBatteryIcon(value) {
    if (value === null) {
      return "mdi:battery-unknown";
    }

    const batteryState = this.getState(
      this._config.battery_state
    );

    const normalized = String(
      batteryState || ""
    ).toLowerCase();

    const charging =
      normalized.includes("charg") &&
      !normalized.includes("not charging") &&
      !normalized.includes("pas en charge");

    if (charging) {
      if (value >= 90) return "mdi:battery-charging-100";
      if (value >= 70) return "mdi:battery-charging-80";
      if (value >= 50) return "mdi:battery-charging-60";
      if (value >= 30) return "mdi:battery-charging-40";

      return "mdi:battery-charging-20";
    }

    if (value >= 95) return "mdi:battery";
    if (value >= 85) return "mdi:battery-90";
    if (value >= 75) return "mdi:battery-80";
    if (value >= 65) return "mdi:battery-70";
    if (value >= 55) return "mdi:battery-60";
    if (value >= 45) return "mdi:battery-50";
    if (value >= 35) return "mdi:battery-40";
    if (value >= 25) return "mdi:battery-30";
    if (value >= 15) return "mdi:battery-20";

    return "mdi:battery-10";
  }

  // =========================================================
  // ÉTAT DE CHARGE
  // =========================================================

  formatBatteryState() {
    const state = this.getState(
      this._config.battery_state
    );

    if (!state) {
      return "Indisponible";
    }

    const normalized = state
      .toLowerCase()
      .trim();

    if (
      normalized === "charging" ||
      normalized === "en charge"
    ) {
      return "En charge";
    }

    if (
      normalized === "full" ||
      normalized === "charged" ||
      normalized === "chargé" ||
      normalized === "charge complete"
    ) {
      return "Chargée";
    }

    if (
      normalized === "not charging" ||
      normalized === "unplugged" ||
      normalized === "débranché" ||
      normalized === "pas en charge"
    ) {
      return "Non";
    }

    return state;
  }

  // =========================================================
  // CONNEXION
  // =========================================================

  formatConnection() {
    const state = this.getState(
      this._config.connection
    );

    if (!state) {
      return "Indisponible";
    }

    const normalized = state
      .toLowerCase()
      .trim();

    if (
      normalized === "wi-fi" ||
      normalized === "wifi"
    ) {
      return "Wi-Fi";
    }

    if (normalized.includes("cell")) {
      return "Réseau mobile";
    }

    if (normalized === "ethernet") {
      return "Ethernet";
    }

    return state;
  }

  // =========================================================
  // SSID
  // =========================================================

  formatSSID() {
    const state = this.getState(
      this._config.ssid
    );

    if (!state) {
      return "Indisponible";
    }

    const normalized = state.toLowerCase();

    if (
      normalized === "not connected" ||
      normalized === "non connecté"
    ) {
      return "Non connecté";
    }

    return state;
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
      this._hass?.themes?.themes;

    const theme =
      themes?.[themeName];

    if (!theme) {
      console.warn(
        `[Activhome Device Info] Thème introuvable : ${themeName}`
      );

      return;
    }

    const card =
      this.shadowRoot?.querySelector(
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
    if (!this._hass || !this._config) {
      return;
    }

    const battery =
      this.getBattery();

    const batteryIcon =
      this.getBatteryIcon(
        battery
      );

    const batteryText =
      this.formatBattery(
        battery
      );

    const batteryState =
      this.formatBatteryState();

    const connection =
      this.formatConnection();

    const ssid =
      this.formatSSID();

    this.shadowRoot.innerHTML = `
      <style>

        :host {
          display: block;
        }

        ha-card {
          padding: 18px 20px;

          box-sizing: border-box;

          background:
            var(
              --ha-card-background,
              var(--card-background-color)
            );

          color:
            var(--primary-text-color);

          border-radius:
            var(
              --ha-card-border-radius,
              12px
            );

          box-shadow:
            var(--ha-card-box-shadow);
        }

        /* ===================================================
           HEADER
           =================================================== */

        .header {
          display: flex;

          align-items: center;

          gap: 10px;

          margin-bottom: 14px;

          min-height: 32px;
        }

        .header ha-icon {
          width: 26px;
          height: 26px;

          color:
            var(--primary-text-color);

          display: flex;

          align-items: center;

          justify-content: center;

          transform: translateY(2px);
        }

        .title {
          font-size: 20px;

          font-weight: 500;

          line-height: 32px;

          color:
            var(--primary-text-color);
        }

        /* ===================================================
           INFORMATIONS
           =================================================== */

        .row {
          display: grid;

          grid-template-columns:
            1fr auto;

          align-items: center;

          gap: 16px;

          min-height: 42px;
        }

        .label {
          font-size: 15px;

          color:
            var(--primary-text-color);
        }

        .value {
          display: flex;

          align-items: center;

          justify-content: flex-end;

          gap: 8px;

          font-size: 15px;

          color:
            var(--secondary-text-color);

          text-align: right;

          min-width: 0;
        }

        .value ha-icon {
          width: 20px;
          height: 20px;

          flex: 0 0 auto;
        }

        .ssid-value {
          max-width: 220px;

          overflow: hidden;

          text-overflow: ellipsis;

          white-space: nowrap;
        }

      </style>

      <ha-card>

        <div class="header">

          <ha-icon
            icon="${this._config.icon}"
          ></ha-icon>

          <div class="title">
            ${this._config.name}
          </div>

        </div>

        <div class="row">

          <div class="label">
            Batterie
          </div>

          <div class="value">

            <ha-icon
              icon="${batteryIcon}"
            ></ha-icon>

            <span>
              ${batteryText}
            </span>

          </div>

        </div>

        <div class="row">

          <div class="label">
            Charge
          </div>

          <div class="value">
            ${batteryState}
          </div>

        </div>

        <div class="row">

          <div class="label">
            Connexion
          </div>

          <div class="value">
            ${connection}
          </div>

        </div>

        <div class="row">

          <div class="label">
            SSID
          </div>

          <div class="value ssid-value">
            ${ssid}
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
    "activhome-device-info"
  )
) {
  customElements.define(
    "activhome-device-info",
    ActivhomeDeviceInfo
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
      "activhome-device-info"
  )
) {
  window.customCards.push({
    type: "activhome-device-info",
    name: "Activhome Device Info",
    description:
      "Informations d'un appareil Home Assistant Companion",
  });
}

// ===========================================================
// READY
// ===========================================================

console.info(
  "[Activhome Device Info] v0.2.0 chargé"
);