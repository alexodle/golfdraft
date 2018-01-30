import server from './expressServer';
import * as socketIO from 'socket.io';

const io = socketIO.listen(server);

// TODO
//io.set('log level', 1);

export default io;
