/* eslint-disable no-restricted-syntax */
const {NodeSSH} = require('node-ssh')

const ssh = new NodeSSH()

export async function train() {
    if (!ssh.isConnected()) {
        await ssh.connect({
            host: '192.168.0.134',
            username: 'user',
            // privateKeyPath: 'C:\\Users\\dani3\\.ssh\\id_rsa',
            privateKeyPath: 'id_rsa',
          }
        )
    }
    const s = await ssh.exec('cat',['train.json'],{ cwd: '/home/user/trading' })
    return JSON.parse(s);
}
