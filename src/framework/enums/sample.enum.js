define([], () => {
    return class SampleEnum {
        baseOptions = {
            status: ['on', 'off']
        };
        constructor(options) {
            this.options = this.options(this.baseOptions, options || {});
            return this.options;
        }
    }
});
