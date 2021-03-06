const {Auth , Result} = require('../model');
const bcrypt = require("bcrypt");

const authController = {
    async login(req, res) {
        try {
            const password = req.body.password;
            const auths = await Auth.find({});
            // If there is no admin, initialize one token using the ENV or password for local debugging..
            if (auths.length === 0) {
                console.log("No auth record found.");
                console.log("Initialize onw with process.env.FAQ_AUTH (or password parameter for local debugging.)");
                let newAuth = new Auth({
                    password: process.env.FAQ_AUTH || password
                });
                await newAuth.save((err) => {
                    if (!err) {
                        console.log("Initialized.");
                    }
                    else{
                        console.log(err);
                    }
                })
            } else if (auths.length === 1) {
                const auth = auths[0];
                const isPasswordMatch = await bcrypt.compare(password, auth.password);
                if (!isPasswordMatch) {
                    res.status(400).json({err: "Invalid login credential."});
                } else {
                    const token = await auth.generateAuthToken();
                    res.status(201).json({token});
                }
            } else {
                res.status(400).json(Result.error('', "More than one credential stored. Something wrong."));
            }
        } catch (err) {
            res.status(400).json(Result.error(err, err.message));
        }
    }
}

module.exports = authController;
