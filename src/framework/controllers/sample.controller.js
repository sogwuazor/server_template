define([], () => {
    return class SampleController {
        baseOptions = {
            baseServicePath: ''
        }
        constructor(options, serverReference) {
            this.options = Object.assign(this.baseOptions, options || {});
            this.server = serverReference || null;
            this.initialize();
            return this;
        }

        initialize() {
            this.initializeModels();
            this.registerRoutes();
        }


        initializeModels() {

        }

        registerRoutes() {

        }

        /**add backend functions here, addLibrary, loadBooks, addUser, removeUser*/
    }
});

/** Use this sample of the application server for library sys to build this up
 *
 * */
/**
define([
    'fs',
    'mongoose',
    'schema/library.schema',
    'schema/book.schema',
    'models/accountModel'
], function (fs, mongoose, librarySchema, bookSchema, AccountModel) {
    'use strict';
    const bookJSON = JSON.parse(fs.readFileSync('sampleData.json', 'utf-8'));

    var applicationServer = {
        options: {
            baseServicePath: '/lib/library'
        }
    };

    function checkFunction(cb, type) {
        return !cb || typeof cb !== type;
    }

    applicationServer.init = function (appReference, ioReference, options) {
        this.initializeModels();

        if (checkFunction(appReference, 'function')) {
            throw new Error('Application Reference was not passed as an argument.')
        }

        if (checkFunction(ioReference, 'object')) {
            throw new Error('Socket reference was not passed as an argument.');
        }

        this.appReference = appReference;
        this.ioReference = ioReference;

        if (options && options !== null) {
            this.options = Object.assign(this.options, options);
        }
        this.registerEvents();
        this.registerRoutes();
    };

    applicationServer.registerEvents = function () {
        if (checkFunction(this.ioReference, 'object')) {
            throw new Error("UNINITIALIZED ERROR: Controller not initialized.");
        }

        this.ioReference.on('library-added', function () { });
    };

    applicationServer.registerRoutes = function () {
        let context = this;
        // setting the servicePaths
        //get requests
        this.appReference.get(this.options.baseServicePath, context.getLibrary.bind(this));
        this.appReference.get(this.options.baseServicePath + '/users', context.getUsers.bind(this));
        this.appReference.get(this.options.baseServicePath + '/users/checkUser', context.checkUserNameInUse.bind(this));
        this.appReference.get(this.options.baseServicePath + '/books', context.getBooks.bind(this));
        this.appReference.get(this.options.baseServicePath + '/book/find', context.findBook.bind(this));
        this.appReference.get(this.options.baseServicePath + '/getUserReservations', context.getUserReservations.bind(this));
        /!*this.appReference.get(this.options.baseServicePath + '/book/load', context.loadBooks.bind(this));*!/

        //post requests
        this.appReference.post(this.options.baseServicePath, context.addNewLibrary.bind(this));
        this.appReference.post(this.options.baseServicePath + '/login', context.loginUser.bind(this));
        this.appReference.post(this.options.baseServicePath + '/users', context.addUser.bind(this));
        this.appReference.post(this.options.baseServicePath + '/users/fetchUsers', context.getAllUsers.bind(this));
        this.appReference.post(this.options.baseServicePath + '/book/add', context.addBook.bind(this));
        this.appReference.post(this.options.baseServicePath + '/book/checkout', context.checkoutBook.bind(this));
        this.appReference.post(this.options.baseServicePath + '/book/return', context.returnBook.bind(this));

        //put requests
        this.appReference.put(this.options.baseServicePath + '/users/updateUser', context.updateUser.bind(this));

        //delete requests
        this.appReference.delete(this.options.baseServicePath + '/delete/:id', async (req, res) => {
            context.deleteLibrary(req, res);
        });
        this.appReference.delete(this.appReference.baseServicePath + '/users/:id', context.removeUser.bind(this));
    };

    applicationServer.initializeModels = function () {
        this.Library = mongoose.model('Library', librarySchema);
        this.Account = AccountModel;
        this.Book = mongoose.model('Book', bookSchema);
    };

    applicationServer.loadBooks = async function (data, res) {
        let properties = {
            message: 'books added',
            status: '200'
        }, promises = [];

        try {
            bookJSON.data.forEach((dataItem) => {
                let entry = {
                    title: dataItem.title,
                    ISBN: dataItem.ISBN,
                    author: {
                        firstName: dataItem.firstName || '',
                        lastName: dataItem.lastName || '',
                        middleInitial: dataItem.middleInitial || ''
                    },
                    format: dataItem.format,
                    subject: dataItem.subject,
                    publisher: dataItem.publisher,
                    numberOfPages: dataItem.numberOfPages,
                    addedOn: new Date(),
                    statusModifiedOn: new Date(),
                    price: dataItem.price,
                    status: 'available',
                    dateOfPurchase: dataItem.dateOfPurchase,
                    publicationDate: dataItem.publicationDate
                };
                let book = new this.Book(entry);

                promises.push(book.save());
            });
            await Promise.all(promises);
            res.json(properties);
        } catch (ex) {
            properties.status = 500;
            properties.message = 'error occured: failed to add books not added';
            res.json(properties);
            console.error(ex);
        }
    };

    applicationServer.addNewLibrary = async function (data, res) {
        var entry = {
            title: data.body.title,
            dateAdded: data.body.timestamp,
            address: {
                street: data.body.street,
                city: data.body.city,
                state: data.body.state,
                zipCode: data.body.zipCode
            },
            dateModified: data.body.timestamp
        };

        try {
            let lib = new this.Library(entry);
            await lib.save();
            this.ioReference.emit('library-added', entry);
            res.sendStatus(200);
        } catch (ex) {
            res.sendStatus(500);
            console.error(ex);
        }
    };

    applicationServer.deleteLibrary = function (data, res) {
        this.Library.deleteOne(data, function (err) {
            if (err) {
                res.sendStatus(500);
            }
            res.sendStatus(200);
        });
    };

    applicationServer.getUsers = function (data, res) {
        this.Account.find({}, (error, accounts) => {
            res.send(accounts.map((x)=> {return x.userName}));
        });
    };

    applicationServer.getAllUsers = function (data, res) {
        let params = data.body.params, returnObj = {message: 'Success', data: [], statusCode: 200};

        const query = this.Account.find();

        if (!params || !params.userId) {
            returnObj.statusCode = 203;
            returnObj.message ='Access Denied: User must be admin to access global listing.';
            res.json(returnObj);
            return;
        }

        try {
            this.Account.findOne({_id: params.userId, roles: {$in: 'admin'}}, function(err, account) {
                if (err || !account) {
                    throw new Error('Access Denied');
                }
            });
        } catch (ex) {
            returnObj.statusCode = 203;
            returnObj.message ='Access Denied: User must be admin to access global listing.';
            res.json(returnObj);
            return;
        }

        query.select('-password -reservations');
        query.exec((err, accounts) => {
            if (err) {
                returnObj.statusCode = 203;
                returnObj.message = 'SchemaError: Accounts not found';
                res.json(returnObj);
                return;
            }

            returnObj.data = accounts;
            res.json(returnObj);
        });
    }

    applicationServer.getBooks = function (data, res) {
        this.Book.find({}, (error, books) => {
            res.send(books);
        });
    };

    applicationServer.findBook = function (data, res) {
        let query = {}, allowableQueries = ['title', '_id'];
        if (allowableQueries.indexOf(data.query.by) === -1) {
            res.status(402).send('Invalid search type!');
            return;
        }

        query[data.query.by] = data.query.value;
        this.Book.find(query, (error, book) => {
            res.send(book);
        });
    };

    applicationServer.getLibrary = function (data, res) {
        this.Library.find({}, (error, libraries) => {
            res.send(libraries);
        });
    };

    applicationServer.addUser = async function (data, res, next) {
        let entry = data.body.params;

        entry = Object.assign(entry, {dateAdded: Date.now(), dateModified: Date.now()});

        try {
            let account = new this.Account(entry);
            await account.save(function (err) {
                if (err) {
                    throw err;
                }
                res.json({ status: 200, message: 'User added successfully.' });
            });
        } catch (ex) {
            res.json({ status: 203, message: 'An error has been found' });
            next(ex);
            console.error(ex);
        }
    };

    applicationServer.loginUser = function (data, res) {
        let toCheck = data.body.params, resObject = {
            matched: false,
            message: ''
        };

        if (!toCheck.userName || !toCheck.password) {
            resObject.message = 'User name or password not provided!';
            res.json(resObject);
            return;
        }
        this.Account.findOne({ userName: toCheck.userName }, function (err, account) {
            if (err) {
                resObject.message = 'User not found';
                res.json(resObject);
                /!* todo: update resObject with failure message: something like could not find user *!/
                throw err;
            }

            if (!account) {
                resObject.message = 'No account found for userName: ' + toCheck.userName;
                res.json(resObject);
                return;
            }

            account.comparePassword(toCheck.password, function (err, isMatch) {
                if (err) {
                    /!* todo: update resObject with failure message: something like could not find user *!/
                    res.json(resObject);
                    throw err;
                }
                resObject.user = {
                    userName: account.userName,
                    firstName: account.firstName,
                    lastName: account.lastName,
                    emailAddress: account.emailAddress,
                    createdOn: account.dateAdded,
                    modifiedOn: account.dateModified,
                    roles: account.roles,
                    id: account._id
                };
                resObject.matched = isMatch;
                res.json(resObject);
            })
        });
    };

    applicationServer.checkUserNameInUse = function (data, res) {
        let searchFor = data.query;
        this.Account.find(searchFor, function (err, user) {
            if (err) {
                throw err;
            }

            res.json({ isValid: user.length });
        });
    };

    applicationServer.addBook = async function (data, res) {
        var entry = {
            title: data.body.title,
            ISBN: data.body.ISBN,
            author: {
                firstName: data.body.firstName || '',
                lastName: data.body.lastName || '',
                middleInitial: data.body.middleInitial || ''
            },
            format: data.body.format,
            subject: data.body.subject,
            publisher: data.body.publisher,
            numberOfPages: data.body.numberOfPages,
            addedOn: new Date(),
            statusModifiedOn: new Date(),
            price: data.body.price,
            status: 'available',
            dateOfPurchase: data.body.dateOfPurchase,
            publicationDate: data.body.publicationDate
        }, properties = {
            message: 'book added',
            status: '200'
        };

        try {
            let book = new this.Book(entry);
            await book.save();
            this.ioReference.emit('book-added', entry);
            res.json(properties);
        } catch (ex) {
            properties.status = 500;
            properties.message = 'error occured: book not added';
            res.json(properties);
            console.error(ex);
        }
    }

    applicationServer.getUserReservations = function (data, res) {
        const params = data.query;
        const context = this;
        let response = {
            message: 'User not found! Reservations not found',
            statusCode: 203,
            data: []
        };

        context.Account.findOne({ _id: params.userId }, (err, account) => {
            if (err || account.reservations.length === 0) {
                res.json(response);

                return;
            }

            context.Book.find({
                _id: {
                    $in: account.reservations
                }
            }, function (error, books) {
                response.data = books;

                if (err) {
                    response.message = 'Reservation(s) not found!';
                    res.json(response);
                    return;
                }

                response.message = 'Success';
                response.statusCode = 200;
                res.json(response);
            });
        });
    }

    applicationServer.checkoutBook = function (data, res) {
        var context = this,
            params = data.body;

        context.Account.findOne({ userName: params.userId }, function (error, account) {
            if (error) {
                res.json({ message: 'User not found or No user currently logged in.', statusCode: 203 });
                return;
            }

            context.Book.findOne({ _id: params.bookId }, async function (err, book) {
                if (err) {
                    res.json({ message: 'Error: Book not found. Item not in catalog.', statusCode: 203 });
                    return;
                }

                if (book.status !== 'available') {
                    res.json({ message: `${book.title} is not available for checkout. ${book.title} is currently ${book.status}`, statusCode: 203 });
                    return;
                }

                try {
                    account.updateOne({$push: {"reservations": book.id}, safe: true, upsert: true}, function(err, model) {
                        if (err) {
                            res.json({message: 'Account reservation update failed. Please try again later', statusCode: 203});
                            throw new Error('Account update failed');
                        }
                    });
                    book.checkedOutBy = account._id;
                    book.statusModifiedOn = Date.now();
                    book.status = 'loaned';
                    await book.save();
                    res.send({ message: 'Successfully checked out book!', statusCode: 200 });
                } catch(ex) {
                    res.send({ message: 'Failed to checkout book', statusCode: 203});
                }
            });

        });
    }

    applicationServer.returnBook = function (data, res) {
        var context = this, params = data.body;

        context.Account.findOne({ userName: params.userName }, function (error, account) {
            if (error) {
                res.json({ message: 'User not found or No user currently logged in.', statusCode: 203 });
                return;
            }

            try {
                account.updateOne({$pull: {"reservations": params.bookId}}, function(err) {
                    if (err) {
                        res.json({message: 'Account reservation update failed. Please try again later', statusCode: 203});
                        throw new Error('Account update failed');
                    }
                });
            } catch(ex) {
                res.json({message: 'Account reservation update failed. Please try again later', statusCode: 203});
                return;
            }

            context.Book.findOne({ _id: params.bookId }, async function (err, book) {
                if (err) {
                    res.json({ message: 'IdentifierInvalid: Book not found.', statusCode: 203 });
                    return;
                }

                try {
                    book.checkedOutBy = null;
                    book.statusModifiedOn = Date.now();
                    book.status = 'available';
                    await book.save();
                    res.send({ message: 'Successfully returned book!', statusCode: 200 });
                } catch (ex) {
                    res.send({message: 'An error has occurred, removal not possible', statusCode: 203});
                }
            });
        });
    }

    /!* update format
        {
            toUpdate: dataObj to update,
            updatedBy: userId of initiator,
            forceAction: boolean force action if user is not admin
        }
    *!/
    applicationServer.updateUser = function(data, res) {
        const context = this;
        let params = data.body, response = {message: 'User updated', statusCode: 200};

        try {
            if (!params.hasOwnProperty('forceAction') || !params.forceAction) {
                context.Account.findOne({_id: params.updatedBy, roles: 'admin'}, (err, account) => {
                    if (err || !account) {
                        throw new Error("Unauthorized action: User not authorized for updates");
                    }
                });
            }

            context.Account.findOne({_id: params.toUpdate._id}, async (err, account) => {
                if (err) {
                    throw new Error("Account not found");
                }

                account.emailAddress= params.toUpdate.emailAddress || '';
                account.firstName= params.toUpdate.firstName;
                account.lastName= params.toUpdate.lastName;
                account.roles= params.toUpdate.roles;
                account.userName= params.toUpdate.userName;
                account.dateModified = Date.now();

                await account.save();
                res.json(response);
            });
        } catch (ex) {
            response.message = "Unauthorized action: User not authorized for updates";
            response.statusCode = 203;
            res.json(response);
        }
    }

    applicationServer.removeUser = async function(data, res) {
        var params = data.body;
        try {
            this.Account.find({_id: params.userId, roles: 'admin'}, function(err, account) {
                if (err || !account) {
                    throw new Error("Unauthorized user access");
                }
            });
            await this.Account.deleteOne({_id: params.itemId});
            res.json({message: 'Successfully removed user', statusCode: 200});
        } catch (ex) {
            res.json({message: 'Unauthorized Action: Failed to remove user', statusCode: 203});
        }
    }

    // params = loggedInUser, accountId, roleToAdd
    applicationServer.addUserRole = function (data, res) {
        var context = this,
            params = data.body.params, returnMessage = {
                message: '',
                statusCode: 203
            };

        context.Account.findOne({ _id: params.loggedInUser }, function (err, account) {
            if (err || !account.hasOwnProperty('roles') || account.roles.indexOf('admin') === -1) {
                returnMessage.message = 'No Logged in user or Logged In user is not admin. Contact the admins';
                res.json(returnMessage);
                return;
            }
        });

        context.Account.findOne({ _id: params.accountId }, async function (err, account) {
            if (err) {
                returnMessage.message = 'Account to modify not found.';
                res.json(returnMessage);
                return;
            }

            if (account.hasOwnProperty('roles') && account.roles.indexOf(params.roleToAdd) !== -1) {
                returnMessage.message = `Account already has role ${params.roleToAdd}`;
                res.json(returnMessage);
                return;
            }

            account.roles = (account.roles || []).push(params.roleToAdd);
            account.dateModified = Date.now();
            await account.save();

            res.send(returnMessage)
        });
    }

    return applicationServer;
});*/
