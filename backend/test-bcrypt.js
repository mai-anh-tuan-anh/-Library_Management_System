const bcrypt = require('bcryptjs');

const password = 'admin123';
const hash = '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqXzJxPLRh1Vj2Cb8L8nL1pMbJtZW';

console.log('Testing bcrypt comparison...');
console.log('Password:', password);
console.log('Hash:', hash);

bcrypt.compare(password, hash).then(result => {
    console.log('Match result:', result);
    if (!result) {
        console.log('\n⚠️  WARNING: bcrypt.compare returned FALSE');
        console.log('Possible causes:');
        console.log('1. bcryptjs version mismatch');
        console.log('2. Hash was generated with different salt rounds');
        console.log('3. Password string has hidden characters');
        
        // Let's generate a new hash to compare
        console.log('\nGenerating new hash for "admin123"...');
        bcrypt.hash(password, 10).then(newHash => {
            console.log('New hash:', newHash);
            return bcrypt.compare(password, newHash);
        }).then(newResult => {
            console.log('New hash verification:', newResult);
        });
    } else {
        console.log('\n✅ bcrypt comparison works correctly!');
    }
}).catch(err => {
    console.error('Error:', err);
});
