define([], () => {
    return class SampleDatatype {
        definition = {
            streetAddress: String,
            city: String,
            state: String,
            zipCode: String
        };

        constructor(options) {
            let optionsDef = options && Object.keys(options).length > 0;

            return optionsDef ? options : this.definition;
        }
    }
});

