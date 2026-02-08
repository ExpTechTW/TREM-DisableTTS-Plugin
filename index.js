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
    const { TREM, Logger, logger } = this.#ctx;
    // 假設這裡的 CustomLogger 已經適配或是通用的，若它是純 Winston 依賴可能也需要調整
    const { CustomLogger } = require("../logger/logger").createCustomLogger(Logger);
    this.logger = new CustomLogger("disable_tts");

    this.logger.info("Initialization completed!");

    // 初始 Mock
    TREM.variable.speech = {
      speak: () => void 0,
      speaking: () => void 0,
      cancel: () => void 0,
    };

    // 獲取 Pino 實例
    const pinoLogger = logger._getLogger();

    /**
     * PINO 修改部分：
     * Pino 不像 Winston 有 transports 陣列可以遍歷。
     * 我們需要攔截觸發 "Speech ready!" 的日誌方法（通常是 info）。
     */

    // 1. 綁定原始的 info 方法以保留上下文
    const originalInfo = pinoLogger.info.bind(pinoLogger);

    // 2. 覆寫 info 方法
    pinoLogger.info = (...args) => {
      // Pino 的參數形式通常是: (msg), (obj, msg), 或 (obj)
      // 我們需要檢查參數中是否包含目標訊息
      let isTargetMessage = false;

      // 檢查第一個參數是字串的情況: logger.info("Speech ready!")
      if (typeof args[0] === 'string' && args[0] === "Speech ready!") {
        isTargetMessage = true;
      }
      // 檢查第二個參數是字串的情況: logger.info({context}, "Speech ready!")
      else if (typeof args[1] === 'string' && args[1] === "Speech ready!") {
        isTargetMessage = true;
      }
      // 檢查物件中包含 msg 屬性的情況: logger.info({ msg: "Speech ready!" })
      else if (args[0] && typeof args[0] === 'object' && args[0].msg === "Speech ready!") {
        isTargetMessage = true;
      }

      // 如果檢測到目標訊息且尚未禁用
      if (!this.disable && isTargetMessage) {
        this.disable = true;
        this.logger.info("Disabling TTS successfully!");

        TREM.variable.speech = {
          speak: () => void 0,
          speaking: () => void 0,
          cancel: () => void 0,
        };
      }

      // 3. 執行原始的日誌記錄，確保日誌仍被輸出
      return originalInfo(...args);
    };
  }
}

module.exports = Plugin;