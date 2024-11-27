let globalInstance = null;
let CustomLoggerClass = null;

function createCustomLogger(BaseLogger) {
  if (CustomLoggerClass && globalInstance)
    return {
      CustomLogger : CustomLoggerClass,
      instance     : globalInstance,
    };

  class CustomLogger extends BaseLogger {
    constructor(prefix = "") {
      super();
      if (globalInstance) {
        globalInstance.prefix = prefix;
        return globalInstance;
      }

      // 獲取 winston logger 實例
      const winstonLogger = this._getLogger();

      // 保存原始的 log 方法
      const originalLog = winstonLogger.log.bind(winstonLogger);

      // 重寫 log 方法來監聽所有日誌
      winstonLogger.log = (level, message, ...args) => {
        // 輸出原始日誌內容
        console.log("[BaseLogger 攔截]", {
          level,
          message,
          args,
          timestamp: new Date().toISOString(),
        });

        // 調用原始方法
        return originalLog(level, message, ...args);
      };

      this.prefix = prefix;
      globalInstance = this;
    }

    _formatMessage(message, ...args) {
      const formattedMessage = super._formatMessage(message, ...args);
      return this.prefix ? `[${this.prefix}] ${formattedMessage}` : formattedMessage;
    }
  }

  CustomLoggerClass = CustomLogger;
  return {
    CustomLogger,
    instance: globalInstance,
  };
}

module.exports = {
  createCustomLogger,
};