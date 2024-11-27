class Plugin {
  static instance = null;

  #ctx;

  constructor(ctx) {
    if (Plugin.instance)
      return Plugin.instance;

    this.#ctx = ctx;
    this.logger = null;
    this.disable = false;

    Plugin.instance = this;
  }

  static getInstance() {
    if (!Plugin.instance)
      throw new Error("Plugin not initialized");
    return Plugin.instance;
  }

  onLoad() {
    const { TREM, Logger, logger, MixinManager } = this.#ctx;
    const { CustomLogger } = require("./src/utils/logger").createCustomLogger(Logger);
    this.logger = new CustomLogger("disable_tts");

    this.logger.info("Initialization completed!");

    const winstonLogger = logger._getLogger();

    winstonLogger.transports.forEach(transport => {
      const originalLog = transport.log.bind(transport);
      transport.log = (info, callback) => {
        if (!this.disable && info.message == "Speech ready!") {
          this.disable = true;
          this.logger.info("Disabling TTS successfully!");
          TREM.variable.speech = {
            speak    : () => void 0,
            speaking : () => void 0,
            cancel   : () => void 0,
          };
        }
        return originalLog(info, callback);
      };
    });
  }
}

module.exports = Plugin;