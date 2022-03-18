define(['express'], (express) => {
    const fkData = [
        { id: 1, title: 'Create a project',  order: 1, completed: true, createdOn: new Date() },
        { id: 2, title: 'Take a coffee',     order: 2, completed: true, createdOn: new Date() },
        { id: 3, title: 'Write new article', order: 3, completed: true, createdOn: new Date() },
        { id: 4, title: 'Walk toward home', order: 4, completed: false, createdOn: new Date() },
        { id: 5, title: 'Have some dinner', order: 5, completed: false, createdOn: new Date() },
    ];

    function isFunction(func) {
        return func && typeof func === 'function';
    }

    function sampleTest(req, res) {
        res.status(200).json(fkData);
    }

    return class SampleRouter {
        defaultOptions = {
            /**
             * Actions sample
             * {path: '', callback: () => {}}
             * */
            getActions: [{path: '/', callback: sampleTest}],
            postActions: [],
            deleteActions: [],
            putActions: []
        }
        constructor(options) {
            this.options = Object.assign(this.defaultOptions, options);
            this.initialize();
            return this.router;
        }

        initialize() {
            this.router = express.Router();
            this.registerGetActions();
            this.registerPostActions();
            this.registerDeleteActions();
            this.registerPutActions();
        }

        registerToRouter(action, path, cb) {
            let accessibleActions = 'get,post,delete,put';

            if (!action ||
                accessibleActions.split(',').indexOf(action) === -1 ||
                typeof this.router[action] !== 'function') {
                console.warn('No accessible action provided');
                return;
            }

            if (!path || typeof path != 'string' || path.length <= 0) {
                console.error('Path is not defined or a string');
                return;
            }

            if (!isFunction(cb)) {
                console.error('Callback function is not defined or a function');
                return;
            }

            this.router[action](path, cb);
        }

        registerGetActions() {
            let context = this,
                actions = this.options.getActions;
            if (!actions.length) {
                return;
            }

            actions.forEach((action) => {
                context.registerToRouter('get', action.path, action.callback);
            });
        }

        registerPostActions() {
            let context = this,
                actions = this.options.postActions;

            if (!actions.length) {
                return;
            }

            actions.forEach((action) => {
                context.registerToRouter('post', action.path, action.callback);
            });
        }

        registerDeleteActions() {
            let context = this,
                actions = this.options.deleteActions;

            if (!actions.length) {
                return;
            }

            actions.forEach((action) => {
                context.registerToRouter('delete', action.path, action.callback);
            });
        }

        registerPutActions() {
            let context = this,
                actions = this.options.putActions;

            if (!actions.length) {
                return;
            }

            actions.forEach((action) => {
                context.registerToRouter('put', action.path, action.callback);
            });
        }
    }
});
