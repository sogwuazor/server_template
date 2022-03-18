define(['mongoose', 'schema/sample.schema'], (mongoose, baseSchema) => {
    return class BaseModel {
        baseOptions = {
            modelName: 'sample',
            /**
             *  pre action sample
             *  {action: '', callback: () => {}}
             */
            preActions: [],
            /**
             * method sample
             * {name: '', callback: () => {}}
             * */
            methods: [],
        }
        constructor(options, schema) {
            if (!options) {
                options = {};
            }
            this.schema = schema ? schema : baseSchema;
            this.options = Object.assign(this.baseOptions, options);
            this.initialize();
            return mongoose.model(this.options.modelName, this.schema);
        }

        initialize() {
            this.setUpPres();
            this.setupMethods();
        }

        setupMethods() {
            let context = this,
                methods = context.options.methods || [];
            if (!methods.length) {
                console.warn('No method actions defined');
                return;
            }

            methods.forEach((method) => {
                context.schema[method.name] = method.callback;
            });
        }

        setUpPres() {
            let context = this,
                preActions = context.options.preActions || [];
            if (!preActions.length) {
                console.warn('No pre actions defined');
                return;
            }

            preActions.forEach((pre) => {
                context.schema.pre(pre.action, pre.callback);
            });
        }
    }
});
