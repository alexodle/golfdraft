db = db.getSiblingDB('gd');

db.dropUser('gd');
db.createUser({ user: 'gd', pwd: pwd, roles: ['readWrite'] });
