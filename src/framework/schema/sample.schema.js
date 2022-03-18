define(['mongoose'], (mongoose) => {
    return class SampleSchema {
        schemaOptions = {
            id: String
        }
        constructor(options) {
            this.options = Object.assign(this.schemaOptions, options || {});

            return mongoose.Schema(this.options);
        }
    }
});
