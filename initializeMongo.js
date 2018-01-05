db = db.getSiblingDB('gd');
db.createUser({ user: 'gd', pwd: pwd, roles: ['readWrite'] });
