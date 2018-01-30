import server from './expressServer';
import * as socketIO from 'socket.io';

const io = socketIO.listen(server);

export default io;
