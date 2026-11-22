const { Router } = require('express');

const router = Router();

require('./auth')(router);
require('./consultas')(router);
require('./ausencias')(router);
require('./medicos')(router);

module.exports = router;
