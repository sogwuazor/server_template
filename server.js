const requirejs = require('requirejs');

/* configure imports */
/*var CM = require('schema/chat/chat.model');
var chatModel = new CM();*/


requirejs.config({
    baseUrl: 'src',
    paths: {
        connConfig: 'serverConfig.json'
    }
});

requirejs([
    'http',
    'fs',
    'express',
    'mongoose',
    'body-parser',
    'cors',
    'routers/sample.router',
    'controllers/sample.controller',
    'socket.io'
], (http, fs, express, mongoose, bodyParser, cors, SampleRoute, AppServer, socketIO) => {
    const connectionInformation = JSON.parse(fs.readFileSync('serverConfig.json', 'utf-8'));
    const conString = connectionInformation.environment.local.connectionString || '';
    const dbName = connectionInformation.environment.local.dbName || '';

    const app = express();
    const server = http.createServer(app);
    const io = socketIO(server);

    init();

    function init() {
        registerRouter();
        setAppPreferences();
        manageDBConnection();
        startServer();
        initializeSocketConnection();
    }

    function manageDBConnection() {
        if (!conString.length || !dbName.length) {
            console.error('Database connection not set up');
        }
        mongoose.connect(conString + dbName, {}, function (err) {
            console.log('Database connection:', err === null ? 'success' : err);
        });
    }

    function registerRouter() {
        if (!SampleRoute) {
            return;
        }
        app.use('/sample', new SampleRoute());
    }

    function startServer() {
        const port = 3000;
        console.log('Process port: %s', process.env.PORT);
        console.log('hard port 3000');
        server.listen(process.env.PORT || port);
        console.debug('Server listening on port ' + port);
    }

    function initializeSocketConnection() {
        io.on('connection', (socket) => {
            var addedUser = false;

            socket.on('library-added', (data) => {
                socket.broadcast.emit('library-added', {
                    message: data
                });
            });
        });
    }

    function setAppPreferences() {
        var whiteList = connectionInformation.environment.production.cors || [];

        app.use(express.json());
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({extended: false}));
        app.use(express.static(__dirname));
        app.use(cors({
            origin: function (origin, callback) {
                if (whiteList.indexOf(origin) !== -1 || !origin) {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            }
        }));

        let application = new AppServer({}, app, io);

        /*register service requests*/
        app.use('/test', function (req, res) {
            res.send('Home Page works :-)');
        });

        /*app.post("/chats", async (req, res) => {
            try {
                let chat = new Chats(req.body);
                await chat.save();
                res.sendStatus(200)
            } catch (error) {
                res.sendStatus(500);
                console.error(error)
            }
        });

        app.get("/chats", (req, res) => {
            Chats.find({}, (error, chats) => {
                res.send(chats);
            });
        });*/
    }
});
