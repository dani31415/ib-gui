/* eslint-disable no-restricted-syntax */
const {NodeSSH} = require('node-ssh')

const ssh = new NodeSSH()

async function connect() {
    if (!ssh.isConnected()) {
        await ssh.connect({
            host: '192.168.0.134',
            username: 'user',
            // privateKeyPath: 'C:\\Users\\dani3\\.ssh\\id_rsa',
            privateKeyPath: 'id_rsa',
          }
        )
    }
}

export async function train() {
    await connect();
    const s = await ssh.exec('cat',['train.json'],{ cwd: '/home/user/trading' })
    return JSON.parse(s);
}

export async function trainProcess() {
    await connect();
    const s = await ssh.exec('bash', ['-c', 'ps -ef | grep train.py | grep -v grep']);
    let ss = s.split(' ');
    ss = ss.filter( (x: string) => x.length > 0);
    return ss[1];
}

export async function trainRun() {
    await connect();
    console.log('begin run');
    await ssh.exec('bash', ['train.sh', '--notail'], { cwd: '/home/user/trading' });
    console.log('end run');
    return 'ok';
}
