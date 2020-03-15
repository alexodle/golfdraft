import * as express from 'express';

const app = express();
app.set('trust proxy', 1); // trust first proxy
export default app;
