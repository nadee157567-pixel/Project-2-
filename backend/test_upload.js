const fs = require('fs');
const http = require('http');
const FormData = require('form-data');

fs.writeFileSync('dummy.jpg', 'dummy image content');

const form = new FormData();
form.append('photos', fs.createReadStream('dummy.jpg'));

const req = http.request('http://localhost:3000/api/cats/28/photos', {
  method: 'POST',
  headers: form.getHeaders(),
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Response:', res.statusCode, data));
});

req.on('error', console.error);
form.pipe(req);
