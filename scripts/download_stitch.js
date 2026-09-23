const fs = require('fs');
const https = require('https');

const urls = {
  'dashboard_desktop.html': 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1YmFlYmUzOWI0MTIwN2ZlZTFmZjU1MjRiZTZiEgsSBxCk_pmYngMYAZIBIwoKcHJvamVjdF9pZBIVQhM2MTQ4ODc5MTMwNDYyMjIzMzEx&filename=&opi=89354086',
  'crm_desktop.html': 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1YmFlZjRjNDRlMjEwMzM4NjAwZDZmMjkwNmI3EgsSBxCk_pmYngMYAZIBIwoKcHJvamVjdF9pZBIVQhM2MTQ4ODc5MTMwNDYyMjIzMzEx&filename=&opi=89354086',
  'dashboard_mobile.html': 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1YmFlZTczZDQ5MzAwN2M0ZGUzZTE0MzM2OTdlEgsSBxCk_pmYngMYAZIBIwoKcHJvamVjdF9pZBIVQhM2MTQ4ODc5MTMwNDYyMjIzMzEx&filename=&opi=89354086',
  'additional.html': 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1YmIwZDQ5NGZjNWYwMWI0ZWU5NTFjMDM4MzhjEgsSBxCk_pmYngMYAZIBIwoKcHJvamVjdF9pZBIVQhM2MTQ4ODc5MTMwNDYyMjIzMzEx&filename=&opi=89354086'
};

if (!fs.existsSync('.stitch')) {
  fs.mkdirSync('.stitch');
}

Object.entries(urls).forEach(([filename, url]) => {
  https.get(url, (res) => {
    const file = fs.createWriteStream('.stitch/' + filename);
    res.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('Downloaded ' + filename);
    });
  }).on('error', (err) => {
    console.error('Error downloading ' + filename + ': ', err.message);
  });
});
