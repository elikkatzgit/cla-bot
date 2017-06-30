const handlebars = require('handlebars');
const requestp = require('./requestAsPromise');
const gh = require('parse-github-url');

const getOrgConfigUrl = (repositoryUrl) => {
  const ghData = gh(repositoryUrl);
  const ghUrl = `https://${ghData.host}/repos/${ghData.owner}/clabot-config/contents/.clabot`;
  return ghUrl;
};

exports.githubRequest = (opts, token) =>
    requestp(Object.assign({}, {
      json: true,
      headers: {
        Authorization: `token ${token}`,
        'User-Agent': 'github-cla-bot'
      },
      method: 'POST'
    }, opts));

exports.getOrgConfig = ({ webhook }) => ({
  url: getOrgConfigUrl(webhook.repository.url),
  method: 'GET'
});

exports.getReadmeUrl = ({ webhook }) => ({
  url: `${webhook.repository.url}/contents/.clabot`,
  method: 'GET'
});

exports.getFile = body => ({
  url: body.download_url,
  method: 'GET'
});

exports.addLabel = ({ webhook, config }) => ({
  url: `${webhook.pull_request.issue_url}/labels`,
  body: [config.label]
});

exports.deleteLabel = ({ webhook, config }) => ({
  url: `${webhook.pull_request.issue_url}/labels`,
  body: [config.label],
  method: 'DELETE'
});

exports.getCommits = ({ webhook }) => ({
  url: `${webhook.pull_request.url}/commits`,
  method: 'GET'
});

exports.setStatus = ({ webhook, correlationKey }, state) => ({
  url: `${webhook.repository.url}/statuses/${webhook.pull_request.head.sha}`,
  body: {
    state,
    context: 'verification/cla-signed',
    target_url: `${process.env.LOG_URL}?correlationKey=${correlationKey}`
  }
});

exports.addComment = ({ webhook, config }, usersWithoutCLA) => {
  const template = handlebars.compile(config.message);
  const message = template({ usersWithoutCLA });
  return ({
    url: `${webhook.pull_request.issue_url}/comments`,
    body: {
      body: message
    }
  });
};