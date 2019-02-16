const fs = require('fs');
const path = require('path');
const algolia = require('algoliasearch');
const HttpsAgent = require('agentkeepalive').HttpsAgent;
const keepaliveAgent = new HttpsAgent({
  maxSockets: 1,
  maxKeepAliveRequests: 0, // no limit on max requests per keepalive socket
  maxKeepAliveTime: 30000, // keepalive for 30 seconds
});
const Base = require('./Base.js');

class ExportRulesScript extends Base {
  constructor() {
    super();
    // Bind class methods
    this.getOutputPath = this.getOutputPath.bind(this);
    this.start = this.start.bind(this);
    // Define validation constants
    this.message =
      '\nExample: $ algolia exportrules -a algoliaappid -k algoliaapikey -n algoliaindexname -o outputpath\n\n';
    this.params = ['algoliaappid', 'algoliaapikey', 'algoliaindexname'];
  }

  getOutputPath(outputpath, indexName) {
    const defaultFilename = `${indexName}-rules.json`;
    const defaultFilepath = path.resolve(process.cwd(), defaultFilename);
    // Process output filepath
    const filepath =
      outputpath !== null ? this.normalizePath(outputpath) : defaultFilepath;
    // Validate filepath targets valid directory
    const dir = path.dirname(filepath);
    if (!fs.lstatSync(dir).isDirectory()) {
      throw new Error(
        `Output path must target valid directory. Eg. ${defaultFilepath}`
      );
    }
    return filepath;
  }

  async start(program) {
    try {
      // Validate command; if invalid display help text
      const isValid = this.validate(program, this.message, this.params);
      if (isValid.flag)
        return console.log(program.help(h => h + isValid.output));

      // Config params
      const appId = program.algoliaappid;
      const apiKey = program.algoliaapikey;
      const indexName = program.algoliaindexname;
      const outputpath = program.outputpath || null;

      const filepath = this.getOutputPath(outputpath, indexName);

      // Instantiate Algolia index
      const client = algolia(appId, apiKey, keepaliveAgent);
      const index = client.initIndex(indexName);
      // Get index settings
      const rules = await index.exportRules();
      fs.writeFileSync(filepath, JSON.stringify(rules));
      return console.log(`Done writing ${filepath}`);
    } catch (e) {
      throw e;
    }
  }
}

const exportRulesScript = new ExportRulesScript();
module.exports = exportRulesScript;