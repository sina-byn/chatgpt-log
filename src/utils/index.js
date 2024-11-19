const https = require('https');

exports.GET = url => {
  return new Promise((resolve, reject) => {
    const req = https.get(url, resp => {
      let data = '';

      resp.on('data', chunk => {
        data += chunk;
      });

      resp.on('end', () => resolve(data));

      resp.on('error', error => reject(error));
    });

    req.on('error', error => reject(error));
  });
};
