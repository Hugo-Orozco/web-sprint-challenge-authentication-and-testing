const auth = require('./auth-model');

const checkPayload = (req, res, next) => {
    const { username, password } = req.body;
    if (!username || !password) {
        next({ status: 400, message: 'username and password required' });
    }
    else {
        next();
    }
};

const checkTaken = (req, res, next) => {
    const { username } = req.body;
    auth.findBy({ username })
        .then(data => {
            if (data && data.username) {
                next({ status: 422, message: 'username taken' });
            }
            else {
                next();
            }
        })
        .catch(next);
};

const checkInvalid = (req, res, next) => {
    const { username } = req.body;
    auth.findBy({ username })
        .then(data => {
            if (!data || !data.username) {
                next({ status: 401, message: 'invalid credentials' });
            }
            else {
                req.data = data;
                next();
            }
        })
        .catch(next);
};

module.exports = {
    checkPayload,
    checkTaken,
    checkInvalid
};
