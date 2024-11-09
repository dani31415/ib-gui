/* eslint-disable no-restricted-syntax */
const {NodeSSH} = require('node-ssh')

async function connectBroker() {
    if (!sshBroker.isConnected()) {
        await sshBroker.connect({
            host: '192.168.0.150',
            username: 'dani',
            privateKeyPath: 'id_rsa',
          }
        )
    }
}

async function connectTalius() {
    if (!sshTalius.isConnected()) {
        await sshTalius.connect({
            host: '192.168.0.159',
            username: 'user',
            privateKeyPath: 'id_rsa',
          }
        )
    }
}

const sshTalius = new NodeSSH()
const sshBroker = new NodeSSH()

export async function freespace() {
    await connectTalius();
    const s0 = await sshTalius.exec('bash', ['-c', ` df /dev/nvme0n1p2 --output=pcent | tail -1`], { });
    const s1 = await sshTalius.exec('bash', ['-c', ` df /dev/nvme1n1p1 --output=pcent | tail -1`], { });
    await connectBroker();
    const s2 = await sshBroker.exec('bash', ['-c', ` df /dev/nvme0n1p2 --output=pcent | tail -1`], { });
    return { Broker: [ parseInt(s2) ], Talius: [ parseInt(s0), parseInt(s1) ] };
}
