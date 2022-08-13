/* eslint-disable import/no-unresolved */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-var-requires */
const { verifyConditons: verifyRn, publish: publishRn } = require('./dist/index');

let verified;

const verifyConditions = async (pluginConfig, context) => {
  await verifyRn(pluginConfig, context);

  verified = true;
};

const publish = async (pluginConfig, context) => {
  if (!verified) {
    await verifyRn(pluginConfig, context);

    verified = true;
  }

  return publishRn(pluginConfig, context);
};

module.exports = { verifyConditions, publish };
