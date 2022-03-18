define([], ()=> {
    return {
        isFunction: (func) =>{
            return func && typeof func === 'function';
        }
    };
});

