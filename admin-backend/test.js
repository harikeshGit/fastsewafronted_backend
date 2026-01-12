const http = require('http');

console.log('Testing http://localhost:4000/api/health');

const req = http.get('http://localhost:4000/api/health', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Response:', data);
        process.exit(0);
    });
});

req.on('error', (err) => {
    console.error('Error:', err.message);
    process.exit(1);
});

setTimeout(() => {
    console.error('Timeout after 5 seconds');
    process.exit(1);
}, 5000);
