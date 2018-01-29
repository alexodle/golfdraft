import app from './expressApp';
import * as http from 'http';

export default http.createServer(app);
