const authentication = require('./authentication');
const { addAuthorization, handleErrors } = require('./middleware');
const newEvent = require('./triggers/new_event');
const sendEmail = require('./creates/send_email');
const addSuppression = require('./creates/add_suppression');

module.exports = {
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,

  // The inputs reach the code as the user typed them: empty values are handled in each action.
  flags: { cleanInputData: false },

  authentication,
  beforeRequest: [addAuthorization],
  afterResponse: [handleErrors],

  triggers: {
    [newEvent.key]: newEvent,
  },
  creates: {
    [sendEmail.key]: sendEmail,
    [addSuppression.key]: addSuppression,
  },
};
