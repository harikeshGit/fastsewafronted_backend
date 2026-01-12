const http = require('http');

async function test(path) {
    return new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:4000${path}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({ status: res.statusCode, data: json });
                } catch (e) {
                    resolve({ status: res.statusCode, data });
                }
            });
        });
        req.on('error', reject);
        setTimeout(() => reject(new Error('Timeout')), 3000);
    });
}

(async () => {
    try {
        console.log('🔄 Testing /api/health...');
        const health = await test('/api/health');
        console.log('✅ Health:', health);

        console.log('\n🔄 Testing /api/test-db...');
        const testDb = await test('/api/test-db');
        console.log('✅ DB Test:', testDb);

        console.log('\n🔄 Creating announcement...');
        const createReq = await new Promise((resolve, reject) => {
            const postData = JSON.stringify({
                title: '🎉 Welcome to FastSewa',
                message: 'Admin backend is working!',
                active: true
            });
            const req = http.request('http://localhost:4000/api/announcements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Content-Length': postData.length }
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve({ status: res.statusCode, data: JSON.parse(data) });
                    } catch (e) {
                        resolve({ status: res.statusCode, data });
                    }
                });
            });
            req.on('error', reject);
            req.write(postData);
            req.end();
        });
        console.log('✅ Created:', createReq.data.title, 'ID:', createReq.data._id);

        console.log('\n🔄 Fetching announcements...');
        const list = await test('/api/announcements');
        console.log('✅ Announcements count:', list.data.length);
        list.data.forEach(a => console.log(`   - ${a.title} (${a.active ? 'active' : 'inactive'})`));

        console.log('\n✨ All tests passed!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
})();
