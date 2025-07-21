const net = require('net');
const cron = require('node-cron');
const { InfluxDB, Point } = require('@influxdata/influxdb-client');
const url = 'http://REMOVED_HOST:8086';
const token = process.env.INFLUXDB_TOKEN = 'REMOVED_TOKEN==';
const org = 'PEA';

const bucket = 'MeterReader';
const influxDB = new InfluxDB({ url, token });
const writeApi = influxDB.getWriteApi(org, bucket, 'ns');

cron.schedule('0 * * * *', () => {
    requestDatas();
});

async function requestDatas() {
	for (const{name, requestBuffer} of ECsReader){
		await readSingleData(name, requestBuffer);
	}
  }

  async function readSingleData(name, requestBuffer) {
	return new Promise(resolve => {
		const client = new net.Socket();
        client.connect(4000, 'REMOVED_HOST', () => {
            console.log('[' + new Date().toLocaleString() + ' ' + (name) +'] Connected!');
            client.write(requestBuffer);
        });

        client.on('data', (data) => {
            handleData(data, name);
            client.destroy();
        });

        client.on('close', () => {
            console.log('Connection to ' + (name) + ' closed.' + '\n');
			resolve();
        });

        client.on('error', (err) => {
            console.error('Error with ' + (name), err.message + '\n');
			resolve();
        });
	});
  }
   
  const ECsReader = [
	  {
		  name: 'OUT01',
		  requestBuffer: Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x06, 0x01, 0x04, 0x01, 0x96, 0x00, 0x02])
	  },
	  {
		  name: 'OUT02',
		  requestBuffer: Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x06, 0x02, 0x04, 0x01, 0x96, 0x00, 0x02])
	  },
	  {
		  name: 'OUT03',
		  requestBuffer: Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x06, 0x03, 0x04, 0x01, 0x96, 0x00, 0x02])
	  },
	  {
		  name: 'OUT04',
		  requestBuffer: Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x06, 0x04, 0x04, 0x01, 0x96, 0x00, 0x02])
	  },
	  {
		  name: 'OUT05',
		  requestBuffer: Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x06, 0x05, 0x04, 0x01, 0x96, 0x00, 0x02])
	  },
	  {
		  name: 'OUT06',
		  requestBuffer: Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x06, 0x06, 0x04, 0x01, 0x96, 0x00, 0x02])
	  },
	  {
		  name: 'OUT07',
		  requestBuffer: Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x06, 0x07, 0x04, 0x01, 0x96, 0x00, 0x02])
	  },
	  {
		  name: 'OUT08',
		  requestBuffer: Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x06, 0x08, 0x04, 0x01, 0x96, 0x00, 0x02])
	  },
	  {
		  name: 'OUT09',
		  requestBuffer: Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x06, 0x09, 0x04, 0x01, 0x96, 0x00, 0x02])
	  },
	  {
		  name: 'OUT10',
		  requestBuffer: Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x06, 0x0A, 0x04, 0x01, 0x96, 0x00, 0x02])
	  }
  ];

function handleData(data, OUTid) {
	console.log('[-----> Received from: ' + (OUTid), data.toString('hex') + ' <-----]');
    if (data.length >= 13) {
        const ai406 = (data[9] << 8) + data[10];
        const ai407 = (data[11] << 8) + data[12];
		const wattHour = ((ai406 * (2**16) + ai407) * (10**4));
		const MwattHour = (wattHour/10**6);
		console.log((OUTid) + ' Rawvalue: AI 406 =',ai406, 'and AI 407 =',ai407);
		console.log((OUTid) + ' Mega Watt Hour:', MwattHour.toLocaleString('en-US'), 'MWh');
        const point = new Point(OUTid).floatField('MWH', MwattHour);
        writeApi.writePoint(point);
    }
}

process.on('SIGINT', async () => {
    await writeApi.close();
    process.exit();
});