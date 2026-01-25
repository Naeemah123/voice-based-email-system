const {createHash} = require('crypto');
const {pool} = require("./db.js")
const {UNEXPECTED, SUCCESS, NOT_FOUND, NOT_AUTH} = require("./error_codes.js")

function computeSHA256(str) {
  const password = createHash('sha256');
  password.update(str)
  return password.digest('hex');
}


exports.sign_in = function(req, response) {
    const body = req.body;
    const email = body["email"];
    const username = body["username"];
    const password = body["password"];
    const hashedPassword = computeSHA256(password);
    

    pool.query("INSERT INTO users (email, username, password) VALUES ($1, $2, $3)", [email, username, hashedPassword], (err, res) => {
        if (err) {
            console.log(err)
            response.send({
                code: err.code,
                detail: err.detail,
                data: null
            })
        } else {
         
            sess=req.session;
            sess.email = email;
            sess.username = username;
        
            response.send({
                code: SUCCESS,
                detail: "Success",
                data: null
            })
        }
    })   
}


exports.login = function(req, response) {
    const body = req.body;
    const password = body["password"];
    const email= body["email"];
    const hashedPassword = computeSHA256(password);

    pool.query("SELECT username FROM users WHERE password = $1 AND email= $2", [hashedPassword, email], (err, res) => {
        if (err) {
            console.log("Database error:", err);
            response.send({
                code: err.code,
                detail: err.detail,
                data: null
            });
        } else {
            if (res.rows.length === 0) {
                response.send({
                    code: NOT_FOUND,
                    detail: "Email address or the password is invalid",
                    data: null
                });
            } else {
       
                req.session.email = email;
                req.session.username = res.rows[0]["username"];
          
                req.session.save((saveErr) => {
                    if (saveErr) {
                        console.log("Session save error:", saveErr);
                        response.send({
                            code: UNEXPECTED,
                            detail: "Session save error",
                            data: null
                        });
                    } else {
                        console.log("Session saved successfully", req.session);
                        response.send({
                            code: SUCCESS,
                            detail: "Success",
                            data: null
                        });
                    }
                });
            }
        }
    });
};


exports.fetch_user = function(req, response) {
    if (req.session && req.session.email) {  
        response.send({
            code: 200,  // 
            detail: "Success",
            data: {
                username: req.session.username,
                address: req.session.email
            }
        });
    } else {
        console.log("Session not found!");
        response.send({
            code: 2,
            detail: "user not authenticated",
            data: null
        });
    }
};


exports.delete_user = function(req, response) {
    if(req.session.email) {
        const sess =  req.session;

        pool.query("DELETE FROM users WHERE email = $1", [sess.email], (err, res) => {
            if (err) {

                console.log(err)
                response.send({
                    code: err.code,
                    detail: err.detail,
                    data: null
                })
            } else {

                response.send({
                    code: SUCCESS,
                    detail: "Success",
                    data: null
                })
            }
        })
    } else {

        response.send({
            code: NOT_AUTH,
            detail: "user not authenticated",
            data: null
        })
    }
}


exports.logout = function(req, response) {
    req.session.destroy(err => {
        if(err) {

            response.send({
                code: UNEXPECTED,
                detail: "Unexpected Error",
                data: null
            })
        } else {
            response.send({
                code: SUCCESS,
                detail: "Success",
                data: null
            })
        }
    })
}
