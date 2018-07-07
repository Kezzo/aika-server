export default function GetEnvironmentBasedUrl() {
  switch (process.env.NODE_ENV) {
  case 'DEV':
    return 'https://dev.aika.cloud.tinkrinc.co:443';
  case 'LOCAL':
    return 'http://localhost:3075';
  }
}
