// Activhome Feedback - v0.7.0
//
// Moteur global de feedback pour Home Assistant.
//
// Feedback disponible :
// - Sonore
// - Haptique iPhone
//
// Sons intégrés :
// - CLICK
// - CLAC
// - SUCCESS
// - ERROR
//
// v0.7.0
// - séparation complète du feedback sonore et haptique
// - ajout de haptic_enabled dans la configuration locale
// - haptique HEAVY validé
// - le son peut être coupé sans couper l'haptique
// - l'haptique peut être coupé sans couper le son
//
// Configuration locale par navigateur via localStorage.

(() => {
  const VERSION = "0.7.0";

  const STORAGE_KEY =
    "activhome_feedback_config";

  const DEFAULTS_REVISION_KEY =
    "activhome_feedback_defaults_revision";

  const DEFAULTS_REVISION =
    "0.7.0-feedback-independent";

  if (
    window.__activhomeFeedbackInstalled
  ) {
    console.info(
      "[Activhome Feedback] Déjà chargé"
    );

    return;
  }

  window.__activhomeFeedbackInstalled =
    true;

  // =========================================================
  // CONFIGURATION
  // =========================================================

  const DEFAULT_CONFIG = {

    // Son
    enabled: true,

    volume: 0.80,

    // Haptique
    haptic_enabled: true,

    // Sons par catégorie
    command: "click",
    navigation: "click",
    slider: "click",
    confirmation: "click",
    error: "click",
  };

  let config =
    loadConfig();

  function loadConfig() {
    try {
      const saved =
        localStorage.getItem(
          STORAGE_KEY
        );

      let loadedConfig =
        saved
          ? {
              ...DEFAULT_CONFIG,
              ...JSON.parse(saved),
            }
          : {
              ...DEFAULT_CONFIG,
            };

      const appliedRevision =
        localStorage.getItem(
          DEFAULTS_REVISION_KEY
        );

      // -----------------------------------------------------
      // MIGRATION V0.7.0
      //
      // On conserve les réglages sonores existants.
      // On ajoute simplement haptic_enabled si absent.
      // -----------------------------------------------------

      if (
        appliedRevision !==
        DEFAULTS_REVISION
      ) {
        if (
          typeof
            loadedConfig
              .haptic_enabled !==
          "boolean"
        ) {
          loadedConfig.haptic_enabled =
            true;
        }

        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(
            loadedConfig
          )
        );

        localStorage.setItem(
          DEFAULTS_REVISION_KEY,
          DEFAULTS_REVISION
        );
      }

      return loadedConfig;

    } catch (error) {
      console.warn(
        "[Activhome Feedback] Configuration locale invalide",
        error
      );

      return {
        ...DEFAULT_CONFIG,
      };
    }
  }

  function saveConfig() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(config)
    );
  }

  // =========================================================
  // HAPTIQUE
  //
  // Disponible via Home Assistant Companion iOS.
  //
  // Type retenu :
  // HEAVY
  // =========================================================

  function playHaptic(
    type = "heavy",
    target = null
  ) {
    if (
      !config.haptic_enabled
    ) {
      return;
    }

    try {
      const dispatchTarget =
        target instanceof EventTarget
          ? target
          : document.body;

      if (!dispatchTarget) {
        return;
      }

      dispatchTarget.dispatchEvent(
        new CustomEvent(
          "haptic",
          {
            detail: type,
            bubbles: true,
            composed: true,
          }
        )
      );

    } catch (error) {
      console.warn(
        "[Activhome Feedback] Haptique indisponible",
        error
      );
    }
  }

  // =========================================================
  // AUDIO
  // =========================================================

  let audioContext = null;

  let masterGain = null;

  let compressor = null;

  function getAudioContext() {
    if (!audioContext) {

      const AudioContextClass =
        window.AudioContext ||
        window.webkitAudioContext;

      if (
        !AudioContextClass
      ) {
        console.warn(
          "[Activhome Feedback] Web Audio API non disponible"
        );

        return null;
      }

      audioContext =
        new AudioContextClass({
          latencyHint:
            "interactive",
        });

      masterGain =
        audioContext.createGain();

      compressor =
        audioContext
          .createDynamicsCompressor();

      compressor.threshold.value =
        -12;

      compressor.knee.value =
        6;

      compressor.ratio.value =
        8;

      compressor.attack.value =
        0.002;

      compressor.release.value =
        0.08;

      updateMasterVolume();

      masterGain.connect(
        compressor
      );

      compressor.connect(
        audioContext.destination
      );
    }

    return audioContext;
  }

  function updateMasterVolume() {
    if (!masterGain) {
      return;
    }

    const volume =
      Math.max(
        0,
        Math.min(
          1,
          Number(
            config.volume
          )
        )
      );

    masterGain.gain.value =
      volume * 3.5;
  }

  // =========================================================
  // OUTILS AUDIO
  // =========================================================

  function createNoiseBuffer(
    ctx,
    duration = 0.03
  ) {
    const length =
      Math.max(
        1,
        Math.floor(
          ctx.sampleRate *
          duration
        )
      );

    const buffer =
      ctx.createBuffer(
        1,
        length,
        ctx.sampleRate
      );

    const data =
      buffer.getChannelData(0);

    for (
      let i = 0;
      i < length;
      i++
    ) {
      data[i] =
        Math.random() * 2 - 1;
    }

    return buffer;
  }

  function noiseImpact(
    ctx,
    start,
    {
      duration = 0.025,
      volume = 0.12,
      frequency = 1800,
      q = 1.5,
    } = {}
  ) {
    const source =
      ctx.createBufferSource();

    source.buffer =
      createNoiseBuffer(
        ctx,
        duration
      );

    const filter =
      ctx.createBiquadFilter();

    filter.type =
      "bandpass";

    filter.frequency.value =
      frequency;

    filter.Q.value =
      q;

    const gain =
      ctx.createGain();

    gain.gain.setValueAtTime(
      0.0001,
      start
    );

    gain.gain
      .exponentialRampToValueAtTime(
        volume,
        start + 0.001
      );

    gain.gain
      .exponentialRampToValueAtTime(
        0.0001,
        start + duration
      );

    source.connect(
      filter
    );

    filter.connect(
      gain
    );

    gain.connect(
      masterGain
    );

    source.start(
      start
    );

    source.stop(
      start + duration
    );
  }

  function bodyImpact(
    ctx,
    start,
    {
      frequency = 230,
      endFrequency = 110,
      duration = 0.03,
      volume = 0.08,
    } = {}
  ) {
    const oscillator =
      ctx.createOscillator();

    const gain =
      ctx.createGain();

    oscillator.type =
      "triangle";

    oscillator.frequency
      .setValueAtTime(
        frequency,
        start
      );

    oscillator.frequency
      .exponentialRampToValueAtTime(
        endFrequency,
        start + duration
      );

    gain.gain.setValueAtTime(
      0.0001,
      start
    );

    gain.gain
      .exponentialRampToValueAtTime(
        volume,
        start + 0.001
      );

    gain.gain
      .exponentialRampToValueAtTime(
        0.0001,
        start + duration
      );

    oscillator.connect(
      gain
    );

    gain.connect(
      masterGain
    );

    oscillator.start(
      start
    );

    oscillator.stop(
      start + duration
    );
  }

  function tone(
    ctx,
    start,
    frequency,
    duration,
    volume,
    type = "sine"
  ) {
    const oscillator =
      ctx.createOscillator();

    const gain =
      ctx.createGain();

    oscillator.type =
      type;

    oscillator.frequency
      .setValueAtTime(
        frequency,
        start
      );

    gain.gain.setValueAtTime(
      0.0001,
      start
    );

    gain.gain
      .exponentialRampToValueAtTime(
        volume,
        start + 0.004
      );

    gain.gain
      .exponentialRampToValueAtTime(
        0.0001,
        start + duration
      );

    oscillator.connect(
      gain
    );

    gain.connect(
      masterGain
    );

    oscillator.start(
      start
    );

    oscillator.stop(
      start + duration
    );
  }

  // =========================================================
  // CLICK
  // =========================================================

  function soundClick(ctx) {
    const now =
      ctx.currentTime;

    const oscillator =
      ctx.createOscillator();

    const gain =
      ctx.createGain();

    oscillator.type =
      "sine";

    oscillator.frequency
      .setValueAtTime(
        950,
        now
      );

    oscillator.frequency
      .exponentialRampToValueAtTime(
        650,
        now + 0.025
      );

    gain.gain.setValueAtTime(
      0.0001,
      now
    );

    gain.gain
      .exponentialRampToValueAtTime(
        0.12,
        now + 0.003
      );

    gain.gain
      .exponentialRampToValueAtTime(
        0.0001,
        now + 0.035
      );

    oscillator.connect(
      gain
    );

    gain.connect(
      masterGain
    );

    oscillator.start(
      now
    );

    oscillator.stop(
      now + 0.04
    );
  }

  // =========================================================
  // CLAC
  // =========================================================

  function soundClac(ctx) {
    const now =
      ctx.currentTime;

    noiseImpact(
      ctx,
      now,
      {
        duration: 0.018,
        volume: 0.09,
        frequency: 1700,
      }
    );

    noiseImpact(
      ctx,
      now + 0.045,
      {
        duration: 0.025,
        volume: 0.16,
        frequency: 2100,
      }
    );

    bodyImpact(
      ctx,
      now + 0.045,
      {
        frequency: 230,
        endFrequency: 110,
        duration: 0.03,
        volume: 0.08,
      }
    );
  }

  // =========================================================
  // SUCCESS
  // =========================================================

  function soundSuccess(ctx) {
    const now =
      ctx.currentTime;

    tone(
      ctx,
      now,
      660,
      0.055,
      0.13
    );

    tone(
      ctx,
      now + 0.065,
      880,
      0.075,
      0.14
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  function soundError(ctx) {
    const now =
      ctx.currentTime;

    tone(
      ctx,
      now,
      880,
      0.055,
      0.13
    );

    tone(
      ctx,
      now + 0.065,
      620,
      0.085,
      0.15
    );
  }

  // =========================================================
  // LECTURE DES SONS
  // =========================================================

  async function ensureAudioReady() {
    const ctx =
      getAudioContext();

    if (!ctx) {
      return null;
    }

    if (
      ctx.state ===
      "suspended"
    ) {
      try {
        await ctx.resume();

      } catch (error) {
        console.warn(
          "[Activhome Feedback] Impossible d'activer l'audio",
          error
        );

        return null;
      }
    }

    return ctx;
  }

  async function playSound(
    sound
  ) {
    if (
      !config.enabled
    ) {
      return;
    }

    if (
      !sound ||
      sound === "off"
    ) {
      return;
    }

    const ctx =
      await ensureAudioReady();

    if (!ctx) {
      return;
    }

    switch (
      sound.toLowerCase()
    ) {

      case "click":
        soundClick(ctx);
        break;

      case "clac":
        soundClac(ctx);
        break;

      case "success":
        soundSuccess(ctx);
        break;

      case "error":
        soundError(ctx);
        break;
    }
  }

  // =========================================================
  // DÉTECTION DES SLIDERS
  // =========================================================

  function isContinuousControl(
    path
  ) {
    return path.some(
      (element) => {

        if (
          !(
            element instanceof
            Element
          )
        ) {
          return false;
        }

        const tag =
          element.tagName
            ?.toLowerCase();

        const role =
          element.getAttribute?.(
            "role"
          );

        const type =
          element.getAttribute?.(
            "type"
          );

        if (
          tag === "input" &&
          type === "range"
        ) {
          return true;
        }

        if (
          role === "slider"
        ) {
          return true;
        }

        if (
          tag ===
            "ha-control-slider" ||
          tag ===
            "ha-slider" ||
          tag ===
            "mwc-slider" ||
          tag ===
            "md-slider"
        ) {
          return true;
        }

        return false;
      }
    );
  }

  // =========================================================
  // ÉLÉMENTS INTERACTIFS
  // =========================================================

  function isInteractive(
    path
  ) {
    return path.some(
      (element) => {

        if (
          !(
            element instanceof
            Element
          )
        ) {
          return false;
        }

        const tag =
          element.tagName
            ?.toLowerCase();

        if (
          tag === "button" ||
          tag === "a" ||
          tag === "select" ||
          tag === "input"
        ) {
          return true;
        }

        const role =
          element.getAttribute?.(
            "role"
          );

        if (
          role === "button" ||
          role === "switch" ||
          role === "link" ||
          role === "checkbox" ||
          role === "tab" ||
          role === "menuitem"
        ) {
          return true;
        }

        if (
          tag ===
            "ha-icon-button" ||
          tag ===
            "ha-control-button" ||
          tag ===
            "ha-control-switch" ||
          tag ===
            "ha-switch" ||
          tag ===
            "mwc-button" ||
          tag ===
            "mwc-icon-button" ||
          tag ===
            "md-button" ||
          tag ===
            "md-icon-button"
        ) {
          return true;
        }

        return false;
      }
    );
  }

  // =========================================================
  // NAVIGATION
  // =========================================================

  function isNavigation(
    path
  ) {
    return path.some(
      (element) => {

        if (
          !(
            element instanceof
            Element
          )
        ) {
          return false;
        }

        const tag =
          element.tagName
            ?.toLowerCase();

        const role =
          element.getAttribute?.(
            "role"
          );

        if (
          tag === "a" &&
          element.hasAttribute(
            "href"
          )
        ) {
          return true;
        }

        if (
          role === "link" ||
          role === "tab"
        ) {
          return true;
        }

        if (
          tag?.includes(
            "sidebar"
          ) ||
          tag?.includes(
            "navigation"
          ) ||
          tag?.includes(
            "navbar"
          )
        ) {
          return true;
        }

        return false;
      }
    );
  }

  // =========================================================
  // CARTE ACTIVHOME FEEDBACK
  //
  // Évite que les réglages de la carte
  // déclenchent le feedback global.
  // =========================================================

  function isFeedbackSettingsCard(
    path
  ) {
    return path.some(
      (element) => {

        if (
          !(
            element instanceof
            Element
          )
        ) {
          return false;
        }

        return (
          element.tagName
            ?.toLowerCase() ===
          "activhome-feedback-card"
        );
      }
    );
  }

  // =========================================================
  // DÉCLENCHEMENT GLOBAL
  // =========================================================

  function triggerFeedback(
    sound,
    target
  ) {
    playHaptic(
      "heavy",
      target
    );

    playSound(
      sound
    );
  }

  // =========================================================
  // LISTENER GLOBAL
  // =========================================================

  document.addEventListener(
    "pointerdown",
    (event) => {

      // Si les deux feedbacks
      // sont désactivés,
      // inutile d'analyser l'interaction.

      if (
        !config.enabled &&
        !config.haptic_enabled
      ) {
        return;
      }

      const path =
        event.composedPath();

      if (
        isFeedbackSettingsCard(
          path
        )
      ) {
        return;
      }

      // -----------------------------------------------------
      // SLIDER
      // -----------------------------------------------------

      if (
        isContinuousControl(
          path
        )
      ) {
        triggerFeedback(
          config.slider,
          event.target
        );

        return;
      }

      // -----------------------------------------------------
      // ZONE NON INTERACTIVE
      // -----------------------------------------------------

      if (
        !isInteractive(
          path
        )
      ) {
        return;
      }

      // -----------------------------------------------------
      // NAVIGATION
      // -----------------------------------------------------

      if (
        isNavigation(
          path
        )
      ) {
        triggerFeedback(
          config.navigation,
          event.target
        );

        return;
      }

      // -----------------------------------------------------
      // COMMANDE
      // -----------------------------------------------------

      triggerFeedback(
        config.command,
        event.target
      );
    },
    true
  );

  // =========================================================
  // API PUBLIQUE
  // =========================================================

  window.ActivhomeFeedback = {

    version:
      VERSION,

    sounds: [
      "off",
      "click",
      "clac",
      "success",
      "error",
    ],

    getConfig() {
      return {
        ...config,
      };
    },

    setConfig(
      newConfig
    ) {
      config = {
        ...config,
        ...newConfig,
      };

      config.enabled =
        Boolean(
          config.enabled
        );

      config.haptic_enabled =
        Boolean(
          config.haptic_enabled
        );

      config.volume =
        Math.max(
          0,
          Math.min(
            1,
            Number(
              config.volume
            )
          )
        );

      saveConfig();

      updateMasterVolume();

      console.info(
        "[Activhome Feedback] Configuration enregistrée",
        config
      );

      return {
        ...config,
      };
    },

    resetConfig() {
      config = {
        ...DEFAULT_CONFIG,
      };

      saveConfig();

      updateMasterVolume();

      console.info(
        "[Activhome Feedback] Configuration réinitialisée",
        config
      );

      return {
        ...config,
      };
    },

    test(sound) {
      return playSound(
        sound
      );
    },

    testHaptic(
      type = "heavy"
    ) {
      return playHaptic(
        type
      );
    },

    testFeedback(
      sound = "click"
    ) {
      triggerFeedback(
        sound,
        document.body
      );
    },
  };

  // =========================================================
  // READY
  // =========================================================

  console.info(
    `[Activhome Feedback] v${VERSION} chargé`,
    config
  );
})();