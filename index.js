/* eslint-disable import/no-unresolved */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-var-requires */
const { verifyConditons: verifyRn, prepare: prepareRn } = require('./dist/index');

let verified;

const verifyConditions = async (pluginConfig, context) => {
  await verifyRn(pluginConfig, context);

  verified = true;
};

const prepare = async (pluginConfig, context) => {
  if (!verified) {
    await verifyRn(pluginConfig, context);

    verified = true;
  }

  return prepareRn(pluginConfig, context);
};

module.exports = { verifyConditions, prepare };
